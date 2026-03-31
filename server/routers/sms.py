"""
Twilio SMS webhook handler.
POST /api/sms/incoming — receives inbound SMS, returns TwiML response.

Security:
- Twilio request signature validation (rejects forged requests)
- Input length capping (no oversized payloads)
- PII sanitization before storage
- Phone numbers masked in logs
"""
from __future__ import annotations

import asyncio
import logging
from fastapi import APIRouter, Request, Response, HTTPException

from twilio.request_validator import RequestValidator

from server.services.engine import detect_language, STOP_WORDS
from server.services.engine_instance import get_engine
from server.services.safety import sanitize_message_for_storage
from server.models.database import upsert_subscriber, opt_out_subscriber, log_conversation
from server.config import TWILIO_AUTH_TOKEN, ENVIRONMENT

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_BODY_LENGTH = 500


def _mask_phone(phone: str) -> str:
    """Mask phone number for logging — show only last 4 digits."""
    return f"***{phone[-4:]}" if len(phone) > 4 else "***"


def validate_twilio_request(request: Request, form_data: dict) -> bool:
    """Verify the request actually came from Twilio using signature validation."""
    if ENVIRONMENT == "development":
        return True

    if not TWILIO_AUTH_TOKEN:
        logger.warning("TWILIO_AUTH_TOKEN not set — skipping signature validation")
        return True

    validator = RequestValidator(TWILIO_AUTH_TOKEN)
    signature = request.headers.get("X-Twilio-Signature", "")

    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    url = f"{forwarded_proto}://{forwarded_host}{request.url.path}"

    return validator.validate(url, form_data, signature)


def twiml_response(message: str) -> Response:
    """Wrap a text string in TwiML XML for Twilio."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{escape_xml(message)}</Message>
</Response>"""
    return Response(content=xml, media_type="application/xml")


def escape_xml(text: str) -> str:
    """Escape XML special characters."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


@router.post("/api/sms/incoming")
async def incoming_sms(request: Request):
    form = await request.form()
    form_data = dict(form)

    if not validate_twilio_request(request, form_data):
        logger.warning(f"Invalid Twilio signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid request signature")

    from_number = form_data.get("From", "")
    body = form_data.get("Body", "").strip()

    if len(body) > MAX_BODY_LENGTH:
        body = body[:MAX_BODY_LENGTH]

    # Log with masked phone number — no PII in logs
    logger.info(f"SMS from {_mask_phone(from_number)} ({len(body)} chars)")

    if not body:
        return twiml_response("Text your question and I'll help you find the answer.")

    eng = get_engine()

    # Handle STOP — opt out subscriber
    if body.lower() in STOP_WORDS:
        opt_out_subscriber(from_number)
        log_conversation(from_number, "inbound", body, intent="_stop", channel="sms")
        reply = await asyncio.to_thread(eng.respond, body, channel="sms")
        log_conversation(from_number, "outbound", reply, intent="_stop", channel="sms")
        return twiml_response(reply)

    language = detect_language(body)
    is_new = upsert_subscriber(from_number, language=language)

    # Get intent info for logging (run in thread — calls keyword matcher)
    intent_info = await asyncio.to_thread(eng.get_intent_info, body)

    # Sanitize PII before storage
    stored_message = sanitize_message_for_storage(body, intent_info.get("intent"))
    log_conversation(
        from_number, "inbound", stored_message,
        intent=intent_info["intent"],
        confidence=intent_info["confidence"],
        channel="sms",
    )

    # Generate response (run in thread — may call LLM)
    reply = await asyncio.to_thread(
        eng.respond,
        body,
        channel="sms",
        language=language,
        is_first_message=is_new,
    )

    log_conversation(from_number, "outbound", reply, intent=intent_info["intent"], channel="sms")
    return twiml_response(reply)
