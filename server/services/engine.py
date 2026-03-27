"""
Hey804 Engine — the unified brain.
Intent match -> response generation -> channel formatting -> safety validation.
All surfaces (SMS, web, widget, QR) use this single engine.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from server.services.intent_matcher import IntentMatcher
from server.services.response_formatter import (
    format_sms,
    format_web,
    format_fallback_sms,
    format_fallback_web,
    format_partial_web,
    format_partial_sms,
    GREETING_RESPONSE,
    HELP_RESPONSE,
    STOP_RESPONSE,
)
from server.services.safety import validate_response_citations, contains_pii, sanitize_message_for_storage

logger = logging.getLogger(__name__)

# Language detection heuristic
SPANISH_INDICATORS = {
    'hola', 'ayuda', 'necesito', 'como', 'puedo', 'pagar',
    'impuestos', 'agua', 'comida', 'español', 'por', 'favor',
    'donde', 'quiero', 'tengo', 'factura', 'dinero',
}

STOP_WORDS = {"stop", "unsubscribe", "cancel", "quit"}
HELP_WORDS = {"help", "info"}
GREETING_WORDS = {"hi", "hello", "hey", "hola", "sup", "yo"}
LANGUAGE_SWITCH_WORDS = {"es", "español", "spanish"}


def detect_language(text: str) -> str:
    words = set(text.lower().split())
    spanish_count = sum(1 for w in words if w in SPANISH_INDICATORS)
    if spanish_count >= 2 or text.lower().strip() in LANGUAGE_SWITCH_WORDS:
        return "es"
    return "en"


class Hey804Engine:
    """The core engine. Load once, call respond() for every message."""

    def __init__(self, kb_path: str | Path):
        kb_path = Path(kb_path)
        with open(kb_path) as f:
            data = json.load(f)

        self.questions = data["questions"]
        self.fallback_message = data["meta"]["fallback_message"]
        self.matcher = IntentMatcher(self.questions)
        logger.info(f"Hey804 engine loaded: {len(self.questions)} intents, {len(self.matcher.keyword_map)} keywords")

    def respond(
        self,
        message: str,
        channel: str = "sms",
        context: dict | None = None,
        language: str | None = None,
        is_first_message: bool = False,
    ) -> dict | str:
        """
        Main entry point. Returns:
          - str for SMS channel
          - dict for web/widget/qr channels
        Also returns metadata dict with intent info for logging.
        """
        msg_stripped = message.strip()
        msg_lower = msg_stripped.lower()

        # Handle special commands (SMS only but safe for all channels)
        if msg_lower in STOP_WORDS:
            return self._wrap_response(STOP_RESPONSE, channel, intent="_stop")

        if msg_lower in HELP_WORDS:
            return self._wrap_response(HELP_RESPONSE, channel, intent="_help")

        if msg_lower in GREETING_WORDS:
            return self._wrap_response(GREETING_RESPONSE, channel, intent="_greeting")

        if msg_lower in LANGUAGE_SWITCH_WORDS:
            return self._wrap_response(
                "Entendido. Responderé en español. ¿En qué puedo ayudarle? "
                "Puede preguntar sobre impuestos, beneficios, facturas de servicios públicos, o envíe HELP para opciones.",
                channel,
                intent="_language_switch",
            )

        # Detect language if not provided
        if language is None:
            language = detect_language(msg_stripped)

        # Match intent via keywords (three-tier: full match, partial, none)
        result = self.matcher.match_with_related(msg_stripped)

        if result["match"] is not None:
            match = result["match"]
            if channel == "sms":
                response_text = format_sms(match, is_first_message=is_first_message)
                response_text = validate_response_citations(response_text, match)
                return response_text
            else:
                return format_web(match)

        if result["related"]:
            return self._format_partial_match(result["related"], channel, is_first_message)

        return self._format_fallback(channel, is_first_message)

    def _format_partial_match(self, related: list[dict], channel: str, is_first_message: bool = False) -> dict | str:
        if channel == "sms":
            return format_partial_sms(self.fallback_message, related, is_first_message=is_first_message)
        return format_partial_web(self.fallback_message, related)

    def _format_fallback(self, channel: str, is_first_message: bool = False) -> dict | str:
        if channel == "sms":
            return format_fallback_sms(self.fallback_message, is_first_message=is_first_message)
        return format_fallback_web(self.fallback_message)

    def _wrap_response(self, text: str, channel: str, intent: str = None) -> dict | str:
        if channel == "sms":
            return text
        return {
            "answer": text,
            "action_steps": [],
            "sources": [],
            "deadlines": None,
            "category": None,
            "intent": intent,
            "handoff_available": True,
            "handoff_message": "Call RVA 311 at 804-646-7000",
        }

    def get_intent_info(self, message: str) -> dict:
        """Get intent match info for logging purposes."""
        match, confidence = self.matcher.match(message.strip())
        return {
            "intent": match["intent"] if match else None,
            "confidence": confidence,
            "category": match["category"] if match else None,
        }
