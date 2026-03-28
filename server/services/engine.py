"""
Hey804 Engine — the unified brain.
Intent match -> response generation -> channel formatting -> safety validation.
All surfaces (SMS, web, widget, QR) use this single engine.

Fallback chain: keyword match -> LLM classification -> honest "I don't know"
All responses flow through _finalize() for translation/post-processing.
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
from server.config import ANTHROPIC_API_KEY, MAX_LLM_CONCURRENT, LLM_TIMEOUT_SECONDS

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

        # LLM fallback (for queries that don't match keywords)
        self.llm_client = None
        if ANTHROPIC_API_KEY:
            try:
                import anthropic
                self.llm_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                logger.info("LLM fallback enabled (Anthropic API)")
            except Exception as e:
                logger.warning(f"LLM fallback unavailable: {e}")

        logger.info(f"Hey804 engine loaded: {len(self.questions)} intents, {len(self.matcher.keyword_map)} keywords")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def respond(
        self,
        message: str,
        channel: str = "sms",
        context: dict | None = None,
        language: str | None = None,
        is_first_message: bool = False,
    ) -> dict | str:
        """
        Main entry point. Every code path builds a response,
        then returns through _finalize() for translation/post-processing.
        """
        msg_stripped = message.strip()
        msg_lower = msg_stripped.lower()

        # Detect language early — _finalize needs it
        if language is None:
            language = detect_language(msg_stripped)

        # --- Special commands ---
        if msg_lower in STOP_WORDS:
            response = self._wrap_response(STOP_RESPONSE, channel, intent="_stop")
            return self._finalize(response, channel, language)

        if msg_lower in HELP_WORDS:
            response = self._wrap_response(HELP_RESPONSE, channel, intent="_help")
            return self._finalize(response, channel, language)

        if msg_lower in GREETING_WORDS:
            response = self._wrap_response(GREETING_RESPONSE, channel, intent="_greeting")
            return self._finalize(response, channel, language)

        if msg_lower in LANGUAGE_SWITCH_WORDS:
            response = self._wrap_response(
                "Entendido. Responderé en español. ¿En qué puedo ayudarle? "
                "Puede preguntar sobre impuestos, beneficios, facturas de servicios públicos, o envíe HELP para opciones.",
                channel,
                intent="_language_switch",
            )
            return self._finalize(response, channel, language)

        # --- Intent matching ---
        result = self.matcher.match_with_related(msg_stripped)

        if result["match"] is not None:
            match = result["match"]
            related = result.get("related", [])
            confidence = result.get("confidence", 0.5)

            if confidence >= 0.85:
                response = self._format_match(match, related, channel, is_first_message)
            else:
                # Low confidence — LLM verify before committing
                verified = self._llm_verify(msg_stripped, match)
                if verified:
                    response = self._format_match(match, related, channel, is_first_message)
                else:
                    # LLM disagreed — try full reclassification
                    llm_result = self._llm_classify(msg_stripped, language)
                    if llm_result is not None:
                        logger.info(f"LLM reclassified '{msg_stripped[:50]}' from {match['intent']} to {llm_result['intent']}")
                        response = self._format_match(llm_result, [], channel, is_first_message)
                    elif related:
                        response = self._format_partial(related, channel, is_first_message)
                    else:
                        response = self._format_fallback(channel, is_first_message)

            return self._finalize(response, channel, language)

        if result["related"]:
            # Partial keyword match — try LLM to resolve
            llm_result = self._llm_classify(msg_stripped, language)
            if llm_result is not None:
                logger.info(f"LLM classified partial-match '{msg_stripped[:50]}' as {llm_result['intent']}")
                response = self._format_match(llm_result, result["related"], channel, is_first_message)
            else:
                response = self._format_partial(result["related"], channel, is_first_message)

            return self._finalize(response, channel, language)

        # No keyword match at all — LLM fallback
        llm_result = self._llm_classify(msg_stripped, language)
        if llm_result is not None:
            logger.info(f"LLM classified '{msg_stripped[:50]}' as intent={llm_result['intent']}")
            response = self._format_match(llm_result, [], channel, is_first_message)
        else:
            response = self._format_fallback(channel, is_first_message)

        return self._finalize(response, channel, language)

    def get_intent_info(self, message: str) -> dict:
        """Get intent match info for logging purposes."""
        match, confidence = self.matcher.match(message.strip())
        return {
            "intent": match["intent"] if match else None,
            "confidence": confidence,
            "category": match["category"] if match else None,
        }

    # ------------------------------------------------------------------
    # Single exit point — hook translation / post-processing here
    # ------------------------------------------------------------------

    def _finalize(self, response: dict | str, channel: str, language: str) -> dict | str:
        """
        Every response passes through here before returning to the caller.
        This is the single place to add:
          - Outgoing translation (language == "es")
          - Response logging / analytics
          - Any other cross-cutting concern
        """
        # Future: if language == "es", translate response text here
        return response

    # ------------------------------------------------------------------
    # Response formatters (build the response shape)
    # ------------------------------------------------------------------

    def _format_match(self, match: dict, related: list, channel: str, is_first_message: bool) -> dict | str:
        """Format a full intent match for the given channel."""
        if channel == "sms":
            response_text = format_sms(match, is_first_message=is_first_message)
            response_text = validate_response_citations(response_text, match)
            return response_text
        return format_web(match, related=related)

    def _format_partial(self, related: list[dict], channel: str, is_first_message: bool = False) -> dict | str:
        """Format a partial match (no confident intent, but related topics)."""
        if channel == "sms":
            return format_partial_sms(self.fallback_message, related, is_first_message=is_first_message)
        return format_partial_web(self.fallback_message, related)

    def _format_fallback(self, channel: str, is_first_message: bool = False) -> dict | str:
        """Format the honest 'I don't know' fallback."""
        if channel == "sms":
            return format_fallback_sms(self.fallback_message, is_first_message=is_first_message)
        return format_fallback_web(self.fallback_message)

    def _wrap_response(self, text: str, channel: str, intent: str = None) -> dict | str:
        """Wrap a plain text response (special commands) for the given channel."""
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

    # ------------------------------------------------------------------
    # LLM helpers (classify and verify)
    # ------------------------------------------------------------------

    def _llm_verify(self, message: str, match: dict) -> bool:
        """
        Ask LLM to verify a low-confidence keyword match.
        Returns True if the match is correct, False if the LLM disagrees.
        Falls back to True (trust keyword match) if LLM is unavailable.
        """
        if not self.llm_client:
            return True

        try:
            prompt = (
                f'A Richmond VA resident said: "{message}"\n\n'
                f'Our system matched this to the topic: "{match["intent"]}" — which is about: "{match["sample_questions"][0]}"\n\n'
                f'Is this a reasonable match? Answer YES or NO only.'
            )
            response = self.llm_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}],
                timeout=LLM_TIMEOUT_SECONDS,
            )
            answer = response.content[0].text.strip().upper()
            verified = answer.startswith("YES")
            if not verified:
                logger.info(f"LLM rejected keyword match: '{message[:50]}' != {match['intent']}")
            return verified
        except Exception as e:
            logger.warning(f"LLM verify failed: {e}")
            return True

    def _llm_classify(self, message: str, language: str) -> dict | None:
        """
        LLM fallback: ask Claude to classify the user's message into one of our intents.
        Returns the KB entry if classified, None if LLM unavailable or says NONE.

        This does NOT generate free-form text — it only picks an intent.
        The response still comes from the curated KB, so every fact is cited.
        """
        if not self.llm_client:
            return None

        intent_list = [
            {"intent": q["intent"], "description": q["sample_questions"][0]}
            for q in self.questions
        ]

        system_prompt = (
            "You are classifying a Richmond, Virginia resident's message into a city service category.\n"
            "Pick the BEST matching intent from this list. Pick the CLOSEST match even if not perfect — "
            "a close match is better than no match for someone who needs help.\n"
            "Only respond \"NONE\" if the message is truly unrelated to any city service "
            "(e.g., homework help, weather, sports, general chat).\n\n"
            "Respond with ONLY the intent name or \"NONE\". Nothing else.\n\n"
            "INTENTS:\n"
            + "\n".join(f"- {i['intent']}: {i['description']}" for i in intent_list)
        )

        try:
            response = self.llm_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=50,
                system=system_prompt,
                messages=[{"role": "user", "content": message}],
                timeout=LLM_TIMEOUT_SECONDS,
            )
            intent_name = response.content[0].text.strip().strip('"').strip()

            if intent_name == "NONE":
                logger.info(f"LLM classified '{message[:50]}' as NONE")
                return None

            match = next((q for q in self.questions if q["intent"] == intent_name), None)
            if match:
                return match

            logger.warning(f"LLM returned unknown intent: {intent_name}")
            return None

        except Exception as e:
            logger.warning(f"LLM classify failed: {e}")
            return None
