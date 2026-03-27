"""
Broadcast endpoint — push emergency alerts to all subscribers.
POST /api/broadcast (admin auth required)
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from twilio.rest import Client

from server.config import ADMIN_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from server.models.database import create_alert, get_opted_in_subscribers

logger = logging.getLogger(__name__)

router = APIRouter()


class BroadcastRequest(BaseModel):
    message_en: str
    message_es: Optional[str] = None
    broadcast_type: str = "emergency"


@router.post("/api/broadcast")
async def broadcast(request: Request):
    # Auth check
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        return JSONResponse(status_code=403, content={"error": "Unauthorized"})

    body = await request.json()
    req = BroadcastRequest(**body)

    # Create alert (visible on web/widget)
    alert_id = create_alert(req.message_en, req.message_es, req.broadcast_type)

    # Send SMS to all opted-in subscribers
    subscribers = get_opted_in_subscribers()
    sent_count = 0
    errors = []

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        for sub in subscribers:
            msg = req.message_es if sub["language"] == "es" and req.message_es else req.message_en
            try:
                client.messages.create(
                    to=sub["phone"],
                    from_=TWILIO_PHONE_NUMBER,
                    body=msg,
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"Broadcast SMS failed for {sub['phone']}: {e}")
                errors.append(sub["phone"])
    else:
        logger.warning("Twilio not configured — broadcast saved as alert only (no SMS sent)")

    logger.info(f"Broadcast {alert_id}: {sent_count}/{len(subscribers)} SMS sent")

    return {
        "broadcast_id": alert_id,
        "recipients_queued": len(subscribers),
        "sms_sent": sent_count,
        "sms_errors": len(errors),
        "status": "sent",
    }
