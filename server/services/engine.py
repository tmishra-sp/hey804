"""
Hey804 Engine — the unified brain.
Intent match -> response generation -> channel formatting -> safety validation.
All surfaces (SMS, web, widget, QR) use this single engine.

Pipeline: emergency check -> crisis check -> redirect check ->
          keyword match -> LLM classification -> honest fallback
All responses flow through _finalize() for translation/post-processing.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from server.services.language import detect_language, translate_text
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
from server.services.safety import (
    validate_response_citations,
    contains_pii,
    sanitize_message_for_storage,
)
from server.config import ANTHROPIC_API_KEY, MAX_LLM_CONCURRENT, LLM_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

STOP_WORDS = {"stop", "unsubscribe", "cancel", "quit"}
HELP_WORDS = {"help", "info"}
GREETING_WORDS = {"hi", "hello", "hey", "hola", "sup", "yo"}
LANGUAGE_SWITCH_WORDS = {"es", "español", "spanish"}

# ------------------------------------------------------------------
# Priority layers (checked BEFORE intent matching)
# ------------------------------------------------------------------

EMERGENCY_PATTERNS = [
    (re.compile(r"\b(gas leak|leaking gas|smell.{0,10}gas)\b", re.I), "gas leak"),
    (
        re.compile(r"\b(shooting|shots fired|gunshots|someone.{0,10}shot)\b", re.I),
        "active violence",
    ),
    (
        re.compile(r"\b(house.{0,10}fire|building.{0,10}fire|fire.{0,10}building|on fire)\b", re.I),
        "structure fire",
    ),
    (re.compile(r"\b(child.{0,10}missing|missing.{0,10}child|kidnap)\b", re.I), "missing child"),
    (
        re.compile(
            r"\b(overdos|someone.{0,10}(passed out|not breathing|unconscious|collapsed))\b", re.I
        ),
        "medical emergency",
    ),
    (
        re.compile(r"\b(heart attack|choking|seizure|bleeding.{0,10}(badly|out|heavily))\b", re.I),
        "medical emergency",
    ),
]

EMERGENCY_RESPONSE = (
    "This sounds like an emergency. Call 911 immediately.\n\n"
    "For non-emergency police: 804-646-5100\n"
    "For city utility emergencies (water/sewer/gas): 804-646-4646 press 1\n\n"
    "If this is not an emergency, please describe your question "
    "and I'll help you find the right city service."
)

CRISIS_PATTERNS = [
    (
        re.compile(
            r"\b(domestic violence|abusive.{0,15}(husband|wife|partner|boyfriend|girlfriend)|hits? me|beating me)\b",
            re.I,
        ),
        "If you are in immediate danger, call 911.\n\n"
        "National Domestic Violence Hotline: 1-800-799-7233 (24/7)\n"
        "Virginia Family Violence & Sexual Assault Hotline: 1-800-838-8238\n"
        "For legal help: Virginia Legal Aid at 866-534-5243",
    ),
    (
        re.compile(
            r"\b(kill myself|suicide|suicidal|end.{0,5}(my life|it all)|want to die|don.?t want to live)\b",
            re.I,
        ),
        "Please reach out — help is available right now.\n\n"
        "988 Suicide & Crisis Lifeline: call or text 988 (24/7)\n"
        "Crisis Text Line: text HOME to 741741\n\n"
        "You are not alone. These services are free and confidential.",
    ),
    (
        re.compile(
            r"\b(elder.{0,10}abuse|abus.{0,15}(elderly|senior|parent|grandparent|older)|neglect.{0,15}(elderly|senior|parent)|(parent|grandparent|grandmother|grandfather).{0,15}(abuse|abused|being abused|neglect))\b",
            re.I,
        ),
        "Report elder abuse or neglect to Adult Protective Services.\n\n"
        "Virginia APS Hotline: 888-832-3858 (24/7)\n"
        "Richmond Office of Aging: 804-646-1082\n"
        "If in immediate danger, call 911.",
    ),
    (
        re.compile(
            r"\b(child.{0,10}abuse|abus.{0,10}(child|kid|minor)|neglect.{0,10}(child|kid)|hurt.{0,10}(child|kid))\b",
            re.I,
        ),
        "Report suspected child abuse or neglect.\n\n"
        "Virginia Child Abuse Hotline: 800-552-7096 (24/7)\n"
        "Richmond Social Services: 804-646-7000\n"
        "If a child is in immediate danger, call 911.",
    ),
    (
        re.compile(
            r"\b(homeless tonight|sleeping (outside|in my car|on the street)|warming shelter|emergency shelter|no.{0,10}(place|where) to (go|sleep|stay))\b",
            re.I,
        ),
        "For immediate shelter assistance, call 211 (Virginia 211) — available 24/7.\n\n"
        "Richmond Emergency Shelter: contact 211 for current availability\n"
        "Salvation Army: 804-644-9471\n"
        "CARITAS: 804-358-0964\n"
        "Commonwealth Catholic Charities: 804-285-5900\n\n"
        "For ongoing housing help, contact Richmond Social Services at 804-646-7000.",
    ),
]

REDIRECT_PATTERNS = [
    (
        re.compile(
            r"\b(hit and run|car accident|robbery|robbed|assault|break.?in|broke into|stole|stolen|theft|trespass)\b",
            re.I,
        ),
        "This is a police matter.\n\n"
        "Richmond Police non-emergency: 804-646-5100\n"
        "If this is happening NOW or someone is in danger: call 911\n"
        "You can also file a police report online at richmondva.policereports.us",
    ),
    (
        re.compile(r"\b(power.{0,5}(out|outage)|electricity.{0,5}(out|off)|dominion)\b", re.I),
        "Power outages are handled by Dominion Energy, not the city.\n\n"
        "Dominion Energy outage line: 866-366-4357\n"
        "Report outages: dominionenergy.com/outages\n"
        "For city gas service (DPU): call 804-646-4646",
    ),
    (
        re.compile(
            r"\b(driver.?s? licen|dmv|license plate|vehicle registration|car registration)\b", re.I
        ),
        "Driver's licenses and vehicle registration are handled by the Virginia DMV, not the city.\n\n"
        "Virginia DMV: dmv.virginia.gov\n"
        "DMV Customer Service: 804-497-7100\n"
        "For city personal property tax on vehicles: call RVA 311 at 804-646-7000",
    ),
    (
        re.compile(r"\b(divorce.{0,10}(decree|papers|record|certificate))\b", re.I),
        "Divorce records are handled by the Circuit Court, not the Health Department.\n\n"
        "Richmond Circuit Court Clerk: 804-646-6505\n"
        "John Marshall Courts Building, 400 N. 9th Street, Richmond VA 23219\n"
        "For birth or death certificates: call 804-205-3911",
    ),
    (
        re.compile(
            r"\b(pipes? burst|burst.{0,5}pipe|plumb(er|ing).{0,10}(emergency|broken|leak))\b", re.I
        ),
        "Burst pipes inside your home are a private plumbing issue — the city does not repair private plumbing.\n\n"
        "For emergencies: shut off your main water valve and call a licensed plumber\n"
        "If the leak is in the STREET (not your home): call DPU at 804-646-4646 press 1\n"
        "For help paying water bills: call DPU at 804-646-4646 about MetroCare",
    ),
]


class Hey804Engine:
    """The core engine. Load once, call respond() for every message."""

    def __init__(self, kb_path: str | Path):
        kb_path = Path(kb_path)
        with open(kb_path) as f:
            data = json.load(f)

        self.questions = data["questions"]
        self.fallback_message = data["meta"]["fallback_message"]
        self.matcher = IntentMatcher(self.questions)

        # Build department lookup from 311 data
        self._url_to_dept = {}
        data_311_path = kb_path.parent / "data-311.json"
        if data_311_path.exists():
            with open(data_311_path) as f:
                for group in json.load(f):
                    for svc in group["services"]:
                        self._url_to_dept[svc["source"]] = group["name"]

        self.llm_client = None
        if ANTHROPIC_API_KEY:
            try:
                import anthropic

                self.llm_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                logger.info("LLM fallback enabled (Anthropic API)")
            except Exception as e:
                logger.warning(f"LLM fallback unavailable: {e}")

        logger.info(
            f"Hey804 engine loaded: {len(self.questions)} intents, {len(self.matcher.keyword_map)} keywords"
        )

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
        language = detect_language(message)

        translated_input = message
        if language != "en":
            translated_input = translate_text(message, src_lang=language, target_lang="en")

        msg_stripped = translated_input.strip()
        msg_lower = msg_stripped.lower()

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

        # --- PRIORITY 1: Emergency check ---
        emergency = self._check_emergency(msg_lower)
        if emergency:
            response = self._wrap_response(emergency, channel, intent="_emergency")
            return self._finalize(response, channel, language)

        # --- PRIORITY 2: Crisis check ---
        crisis = self._check_crisis(msg_lower)
        if crisis:
            response = self._wrap_response(crisis, channel, intent="_crisis")
            return self._finalize(response, channel, language)

        # --- PRIORITY 3: Redirect check ---
        redirect = self._check_redirect(msg_lower)
        if redirect:
            response = self._wrap_response(redirect, channel, intent="_redirect")
            return self._finalize(response, channel, language)

        # --- PRIORITY 4: Single-word ambiguity guard ---
        words = msg_lower.split()
        if len(words) == 1:
            result = self.matcher.match_with_related(msg_stripped)
            if result["related"]:
                response = self._format_partial(result["related"], channel, is_first_message)
                return self._finalize(response, channel, language)

        # --- Intent matching ---
        result = self.matcher.match_with_related(msg_stripped)

        if result["match"] is not None:
            match = result["match"]
            related = result.get("related", [])
            confidence = result.get("confidence", 0.5)

            if confidence >= 0.85:
                response = self._format_match(
                    match,
                    related,
                    channel,
                    is_first_message,
                    user_message=msg_stripped,
                    confidence=confidence,
                )
            else:
                verified = self._llm_verify(msg_stripped, match)
                if verified:
                    response = self._format_match(
                        match,
                        related,
                        channel,
                        is_first_message,
                        user_message=msg_stripped,
                        confidence=confidence,
                    )
                else:
                    llm_result = self._llm_classify(msg_stripped, language)
                    if llm_result is not None:
                        logger.info(
                            f"LLM reclassified '{msg_stripped[:50]}' from {match['intent']} to {llm_result['intent']}"
                        )
                        response = self._format_match(
                            llm_result,
                            [],
                            channel,
                            is_first_message,
                            user_message=msg_stripped,
                            confidence=0.75,
                        )
                    elif related:
                        response = self._format_partial(related, channel, is_first_message)
                    else:
                        response = self._format_fallback(channel, is_first_message)

            return self._finalize(response, channel, language)

        if result["related"]:
            llm_result = self._llm_classify(msg_stripped, language)
            if llm_result is not None:
                logger.info(
                    f"LLM classified partial-match '{msg_stripped[:50]}' as {llm_result['intent']}"
                )
                response = self._format_match(
                    llm_result,
                    result["related"],
                    channel,
                    is_first_message,
                    user_message=msg_stripped,
                    confidence=0.75,
                )
            else:
                response = self._format_partial(result["related"], channel, is_first_message)

            return self._finalize(response, channel, language)

        # No keyword match — LLM fallback
        llm_result = self._llm_classify(msg_stripped, language)
        if llm_result is not None:
            logger.info(f"LLM classified '{msg_stripped[:50]}' as intent={llm_result['intent']}")
            response = self._format_match(
                llm_result,
                [],
                channel,
                is_first_message,
                user_message=msg_stripped,
                confidence=0.70,
            )
        else:
            response = self._format_fallback(channel, is_first_message)

        return self._finalize(response, channel, language)

    def get_intent_info(self, message: str) -> dict:
        match, confidence = self.matcher.match(message.strip())
        return {
            "intent": match["intent"] if match else None,
            "confidence": confidence,
            "category": match["category"] if match else None,
        }

    # ------------------------------------------------------------------
    # Priority layers
    # ------------------------------------------------------------------

    @staticmethod
    def _check_emergency(msg_lower: str) -> str | None:
        for pattern, _ in EMERGENCY_PATTERNS:
            if pattern.search(msg_lower):
                return EMERGENCY_RESPONSE
        return None

    @staticmethod
    def _check_crisis(msg_lower: str) -> str | None:
        for pattern, response_text in CRISIS_PATTERNS:
            if pattern.search(msg_lower):
                return response_text
        return None

    @staticmethod
    def _check_redirect(msg_lower: str) -> str | None:
        for pattern, response_text in REDIRECT_PATTERNS:
            if pattern.search(msg_lower):
                return response_text
        return None

    # ------------------------------------------------------------------
    # Single exit point — translation (Ben's code)
    # ------------------------------------------------------------------

    def _finalize(self, response: dict | str, channel: str, language: str) -> dict | str:
        ui_messages = {
            "you_asked": "You asked",
            "first_step": "Here's your first step",
            "see_steps": f"See all {len(response['action_steps']) if isinstance(response, dict) and 'action_steps' in response else 0} steps",
            "also_see": "Also see",
            "might_help": "These might help",
            "back_button": "Ask me something else",
            "sourced_from": "Sourced from",
            "learn_more": "Learn more",
            "footer": "Your Richmond Navigator",
            "error": "Something went wrong. Try again or call",
            "make_sure": "I want to make sure I point you to the right place. Did you mean",
        }
        if language == "en":
            if isinstance(response, str):
                return response
            return {**response, "ui_messages": ui_messages}
        if isinstance(response, str):
            return translate_text(response, src_lang="en", target_lang=language)
        else:
            for k, v in ui_messages.items():
                ui_messages[k] = translate_text(v, src_lang="en", target_lang=language)

            response["answer"] = translate_text(
                response["answer"], src_lang="en", target_lang=language
            )
            response["deadlines"] = (
                translate_text(response["deadlines"], src_lang="en", target_lang=language)
                if response.get("deadlines")
                else None
            )
            response["action_steps"] = translate_text(
                " || ".join(response["action_steps"]), src_lang="en", target_lang=language
            ).split(" || ")
            response["handoff_message"] = translate_text(
                response["handoff_message"], src_lang="en", target_lang=language
            )
            for s in response.get("sources", []):
                s["title"] = translate_text(s["title"], src_lang="en", target_lang=language)
            if "related" in response:
                for r in response["related"]:
                    r["title"] = translate_text(r["title"], src_lang="en", target_lang=language)
                    r["answer_preview"] = translate_text(
                        r["answer_preview"], src_lang="en", target_lang=language
                    )
        return {**response, "ui_messages": ui_messages}

    # ------------------------------------------------------------------
    # Response formatters
    # ------------------------------------------------------------------

    def _get_department(self, sources: list) -> str | None:
        """Look up the 311 department name from the primary source URL."""
        for s in sources:
            dept = self._url_to_dept.get(s.get("url", ""))
            if dept:
                return dept
        return None

    def _format_match(
        self,
        match: dict,
        related: list,
        channel: str,
        is_first_message: bool,
        user_message: str = "",
        confidence: float = 0.0,
    ) -> dict | str:
        # Rerank sources so the most relevant one for this query is first
        if user_message and len(match.get("sources", [])) > 1:
            msg_words = set(user_message.lower().split())

            def source_relevance(s):
                title_words = set(s.get("title", "").lower().replace("-", " ").split())
                return len(msg_words & title_words)

            match = dict(match)  # don't mutate the KB entry
            match["sources"] = sorted(match["sources"], key=source_relevance, reverse=True)

        if channel == "sms":
            response_text = format_sms(match, is_first_message=is_first_message)
            response_text = validate_response_citations(response_text, match)
            return response_text

        result = format_web(match, related=related)
        # Add department and confidence for widget UX
        result["department"] = self._get_department(match.get("sources", []))
        result["confidence"] = round(confidence, 2) if confidence > 0 else 0.85
        return result

    def _format_partial(
        self, related: list[dict], channel: str, is_first_message: bool = False
    ) -> dict | str:
        if channel == "sms":
            return format_partial_sms(
                self.fallback_message, related, is_first_message=is_first_message
            )
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
            "sources": [
                {
                    "title": "About RVA 311 | Richmond",
                    "url": "https://www.rva.gov/citizen-service-and-response/about-rva-311",
                },
            ],
            "deadlines": None,
            "category": None,
            "intent": intent,
            "handoff_available": True,
            "handoff_message": "Call RVA 311 at 804-646-7000",
        }

    # ------------------------------------------------------------------
    # LLM helpers
    # ------------------------------------------------------------------

    def _llm_verify(self, message: str, match: dict) -> bool:
        if not self.llm_client:
            return True
        try:
            prompt = (
                f'A Richmond VA resident said: "{message}"\n\n'
                f'Our system matched this to the topic: "{match["intent"]}" — which is about: "{match["sample_questions"][0]}"\n\n'
                f"Is this a reasonable match? Answer YES or NO only."
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
        if not self.llm_client:
            return None
        intent_list = [
            {"intent": q["intent"], "description": q["sample_questions"][0]} for q in self.questions
        ]
        system_prompt = (
            "You are classifying a Richmond, Virginia resident's message into a city service category.\n"
            "Pick the BEST matching intent from this list. Pick the CLOSEST match even if not perfect — "
            "a close match is better than no match for someone who needs help.\n"
            'Only respond "NONE" if the message is truly unrelated to any city service '
            "(e.g., homework help, weather, sports, general chat).\n\n"
            'Respond with ONLY the intent name or "NONE". Nothing else.\n\n'
            "INTENTS:\n" + "\n".join(f"- {i['intent']}: {i['description']}" for i in intent_list)
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
