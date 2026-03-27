#!/usr/bin/env python3
"""
RVA Hey804 — Minimal Chatbot Prototype
This is the core logic. Wire it to Twilio (SMS) or Flask (web) separately.

Architecture (3 layers, no magic):

  1. INTENT MATCHING   — match user message to one of 20 known intents
  2. ANSWER RETRIEVAL   — pull curated answer + action steps from KB
  3. SAFETY WRAPPER     — add source links, detect when to hand off to 311

That's it. No vector DB needed for the hackathon. The curated KB IS the
retrieval layer. Add RAG over the scraped corpus only if you have time.

USAGE:
  # As a module
  from chatbot import Hey804
  bot = Hey804("knowledge_base.json")
  response = bot.respond("I can't pay my tax bill")

  # Quick test
  python chatbot.py
"""

import json
import re
from pathlib import Path


class Hey804:

    def __init__(self, kb_path="knowledge_base.json"):
        with open(kb_path) as f:
            data = json.load(f)
        self.questions = data["questions"]
        self.fallback = data["meta"]["fallback_message"]
        self._build_keyword_index()

    def _build_keyword_index(self):
        """
        Build a simple keyword → intent mapping from sample questions.
        This is intentionally dumb. It works for 20 intents at demo scale.
        Replace with embeddings + cosine similarity if you have time.
        """
        self.keyword_map = {}  # keyword → list of (intent_id, weight)

        # High-signal keywords per intent (manually tuned for accuracy)
        BOOST_KEYWORDS = {
            "tax_bill_cant_pay": ["tax", "taxes", "bill", "can't pay", "cant pay", "behind", "owe", "delinquent", "payment plan"],
            "senior_disabled_tax_relief": ["senior", "elderly", "disabled", "disability", "oapd", "relief", "65", "veteran", "old"],
            "real_estate_tax_wrong": ["assessment", "appeal", "wrong", "incorrect", "too high", "property value", "assessor"],
            "personal_property_tax_car": ["car", "vehicle", "pptra", "personal property", "auto", "registration"],
            "utility_bill_cant_pay": ["utility", "water bill", "gas bill", "metrocare", "promisepay", "disconnected", "shut off", "heating"],
            "water_safety": ["water safe", "boil", "advisory", "water crisis", "drinking water", "water quality"],
            "utility_bill_wrong": ["bill too high", "overcharged", "meter", "bill doubled", "bill wrong"],
            "apply_snap_food": ["snap", "food stamps", "ebt", "hungry", "food help", "food assistance", "groceries"],
            "apply_medicaid": ["medicaid", "health insurance", "medical", "famis", "coverva", "uninsured"],
            "rent_help": ["rent", "eviction", "evicted", "housing", "apartment", "homeless", "shelter"],
            "benefits_status_check": ["status", "pending", "approved", "application status", "haven't heard", "waiting"],
            "where_to_go_in_person": ["office", "location", "in person", "address", "where do i go", "walk in"],
            "energy_heating_assistance": ["heating", "liheap", "energy", "furnace", "cold", "heat"],
            "report_pothole_streetlight": ["pothole", "streetlight", "road", "sidewalk", "street", "light out"],
            "trash_recycling": ["trash", "garbage", "recycling", "bulk", "pickup", "collection"],
            "business_license": ["business license", "bpol", "start business", "business permit"],
            "free_internet_computer": ["internet", "computer", "wifi", "library", "print", "online access"],
            "pay_parking_ticket": ["parking", "ticket", "citation", "fine", "towed"],
            "emergency_alerts": ["emergency", "alert", "notification", "richmond ready", "warning"],
            "childcare_help": ["childcare", "daycare", "child care", "babysitter", "head start", "pre-k", "preschool"],
        }

        for q in self.questions:
            intent = q["intent"]
            keywords = BOOST_KEYWORDS.get(intent, [])
            # Also extract from sample questions
            for sq in q["sample_questions"]:
                words = re.findall(r'\b\w+\b', sq.lower())
                keywords.extend(words)

            # Dedupe and index
            for kw in set(keywords):
                kw = kw.lower().strip()
                if len(kw) < 3:
                    continue
                if kw not in self.keyword_map:
                    self.keyword_map[kw] = []
                self.keyword_map[kw].append(q["id"])

    def match_intent(self, message):
        """
        Score each intent by keyword overlap. Returns best match or None.
        """
        msg_lower = message.lower()
        scores = {}  # intent_id → score

        for kw, intent_ids in self.keyword_map.items():
            if kw in msg_lower:
                weight = len(kw)  # longer keywords = more specific = higher weight
                for iid in intent_ids:
                    scores[iid] = scores.get(iid, 0) + weight

        if not scores:
            return None

        best_id = max(scores, key=scores.get)
        best_score = scores[best_id]

        # Confidence threshold — don't guess on weak matches
        if best_score < 5:
            return None

        return next(q for q in self.questions if q["id"] == best_id)

    def format_response(self, match, channel="sms"):
        """
        Format the answer for the given channel.
        SMS: short, numbered steps, character-conscious.
        Web: full answer with links.
        """
        if channel == "sms":
            return self._format_sms(match)
        return self._format_web(match)

    def _format_sms(self, match):
        """SMS-friendly response (< 1600 chars ideally, multi-message OK)."""
        lines = []
        # Short answer first
        answer = match["answer"]
        # Truncate to first 2 sentences for SMS
        sentences = re.split(r'(?<=[.!?])\s+', answer)
        short_answer = " ".join(sentences[:2])
        lines.append(short_answer)
        lines.append("")

        # Action steps (numbered)
        lines.append("NEXT STEPS:")
        for i, step in enumerate(match["action_steps"][:4], 1):
            lines.append(f"{i}. {step}")

        # Deadlines if relevant
        if match.get("deadlines"):
            lines.append(f"\n⏰ {match['deadlines']}")

        # Source
        if match["sources"]:
            lines.append(f"\nSource: {match['sources'][0]['url']}")

        # Always offer handoff
        lines.append("\nReply HELP to talk to a person, or ask another question.")

        return "\n".join(lines)

    def _format_web(self, match):
        """Web/HTML-friendly response with full detail."""
        return {
            "answer": match["answer"],
            "action_steps": match["action_steps"],
            "deadlines": match.get("deadlines"),
            "sources": match["sources"],
            "handoff_available": True,
            "handoff_message": "Need more help? Call RVA 311 at 804-646-7000",
            "category": match["category"],
        }

    def respond(self, message, channel="sms", language="en"):
        """
        Main entry point. Returns formatted response string (SMS)
        or dict (web).
        """
        # Language detection stub — in production, use langdetect or LLM
        if language != "en":
            # For demo: wrap response with translation note
            pass

        match = self.match_intent(message)

        if match is None:
            if channel == "sms":
                return self.fallback
            return {"answer": self.fallback, "action_steps": [], "sources": [], "handoff_available": True}

        # Check for handoff triggers
        if match.get("handoff_trigger"):
            # In production: run a classifier to see if the trigger applies
            # For demo: just include the trigger info in metadata
            pass

        return self.format_response(match, channel)


# ── LLM-enhanced version (use if you have API access) ─────────────

class Hey804LLM(Hey804):
    """
    Enhanced version that uses an LLM for:
    1. Better intent matching (when keyword match is weak)
    2. Natural language response generation
    3. Translation

    Requires: ANTHROPIC_API_KEY environment variable
    """

    def __init__(self, kb_path="knowledge_base.json"):
        super().__init__(kb_path)
        try:
            import anthropic
            self.client = anthropic.Anthropic()
            self.llm_available = True
        except Exception:
            self.llm_available = False
            print("WARNING: LLM not available, falling back to keyword matching")

    def respond(self, message, channel="sms", language="en"):
        if not self.llm_available:
            return super().respond(message, channel, language)

        # First try keyword match
        match = self.match_intent(message)

        if match:
            # Use LLM to generate a natural response grounded in the KB entry
            return self._llm_respond(message, match, channel, language)

        # If no keyword match, use LLM to try harder
        return self._llm_classify_and_respond(message, channel, language)

    def _llm_respond(self, user_message, kb_match, channel, language):
        """Use LLM to generate natural response grounded in KB data."""
        system_prompt = f"""You are Hey804, a helpful assistant for Richmond, Virginia residents.
You help people navigate city services, benefits, taxes, and utilities.

RULES:
- ONLY use information from the provided knowledge base entry.
- NEVER make up phone numbers, URLs, deadlines, or eligibility criteria.
- Include specific action steps with real phone numbers and URLs.
- If you're not sure about something, say so and direct to RVA 311 (804-646-7000).
- Keep responses concise. For SMS: under 300 words. For web: under 500 words.
- {"Respond in Spanish." if language == "es" else ""}
- End with an offer to help with something else or connect to a person.

KNOWLEDGE BASE ENTRY:
{json.dumps(kb_match, indent=2)}
"""
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=600 if channel == "sms" else 1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            text = response.content[0].text

            if channel == "sms":
                return text
            return {
                "answer": text,
                "action_steps": kb_match["action_steps"],
                "sources": kb_match["sources"],
                "handoff_available": True,
                "category": kb_match["category"],
            }
        except Exception as e:
            # Fallback to template response
            return super().format_response(kb_match, channel)

    def _llm_classify_and_respond(self, user_message, channel, language):
        """When keyword match fails, ask LLM to classify intent."""
        intents = [q["intent"] for q in self.questions]
        system_prompt = f"""You are classifying a Richmond VA resident's message.
Pick the BEST matching intent from this list, or respond "NONE" if nothing fits:

{json.dumps(intents)}

Respond with ONLY the intent name or "NONE". Nothing else."""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=50,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            intent = response.content[0].text.strip().strip('"')

            if intent == "NONE":
                if channel == "sms":
                    return self.fallback
                return {"answer": self.fallback, "action_steps": [], "sources": [], "handoff_available": True}

            match = next((q for q in self.questions if q["intent"] == intent), None)
            if match:
                return self._llm_respond(user_message, match, channel, language)

        except Exception:
            pass

        if channel == "sms":
            return self.fallback
        return {"answer": self.fallback, "action_steps": [], "sources": [], "handoff_available": True}


# ── Quick test ────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("Hey804 Chatbot — Test Mode")
    print("=" * 60)

    bot = Hey804()

    test_messages = [
        "I got a tax bill I can't pay",
        "I'm 72 and can't afford property tax",
        "How do I get food stamps",
        "My water bill is way too high",
        "Is the water safe to drink?",
        "I need help paying rent, about to be evicted",
        "Where's the social services office",
        "Can't afford daycare so I can work",
        "How do I report a pothole on my street",
        "Want to start a small business, need a license",
        "What's the meaning of life",  # Should trigger fallback
    ]

    for msg in test_messages:
        print(f"\n{'─' * 50}")
        print(f"USER: {msg}")
        print(f"{'─' * 50}")
        response = bot.respond(msg, channel="sms")
        print(response)

    print(f"\n{'=' * 60}")
    print("Test complete. Try your own messages:")
    print("=" * 60)

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input or user_input.lower() in ("quit", "exit"):
                break
            print(f"\nHey804:\n{bot.respond(user_input)}")
        except (EOFError, KeyboardInterrupt):
            break
