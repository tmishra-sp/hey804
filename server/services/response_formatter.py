"""
Channel-aware response formatter.
Same answer, shaped for SMS vs web vs widget.
"""
from __future__ import annotations

import re


def format_sms(match: dict, is_first_message: bool = False) -> str:
    """
    SMS-friendly response. Targets <1000 chars for readability.
    Twilio concatenates automatically up to 1600 chars.
    """
    lines = []

    # Short answer: first 2 sentences only
    answer = match["answer"]
    sentences = re.split(r'(?<=[.!?])\s+', answer)
    short_answer = " ".join(sentences[:2])
    lines.append(short_answer)
    lines.append("")

    # Action steps (max 4, numbered)
    lines.append("NEXT STEPS:")
    for i, step in enumerate(match["action_steps"][:4], 1):
        lines.append(f"{i}. {step}")

    # Deadline if present
    if match.get("deadlines"):
        lines.append(f"\nDeadline: {match['deadlines']}")

    # Source citation
    if match.get("sources"):
        lines.append(f"\nSource: {match['sources'][0]['url']}")

    # Handoff offer
    lines.append("\nReply HELP to talk to a person, or ask another question.")

    # First-message opt-in notice (TCPA compliance)
    if is_first_message:
        lines.append("\n---\nYou'll also get emergency alerts from the City at this number. Reply STOP anytime to opt out.")

    return "\n".join(lines)


def format_web(match: dict, related: list[dict] | None = None) -> dict:
    """Web/widget JSON response with full detail + related topics for transparency."""
    result = {
        "answer": match["answer"],
        "action_steps": match["action_steps"],
        "deadlines": match.get("deadlines"),
        "sources": match["sources"],
        "category": match["category"],
        "intent": match["intent"],
        "handoff_available": True,
        "handoff_message": "Need more help? Call RVA 311 at 804-646-7000",
    }
    if related:
        result["related"] = [
            {
                "title": r["title"],
                "answer_preview": r["answer_preview"],
                "sources": r["sources"],
                "category": r["category"],
            }
            for r in related
        ]
    return result


def format_fallback_sms(fallback_message: str, is_first_message: bool = False) -> str:
    """Fallback response for SMS when no intent matched."""
    text = fallback_message
    if is_first_message:
        text += "\n\n---\nYou'll also get emergency alerts from the City at this number. Reply STOP anytime to opt out."
    return text


def format_fallback_web(fallback_message: str) -> dict:
    """Fallback response for web when no intent matched."""
    return {
        "answer": fallback_message,
        "action_steps": [],
        "sources": [],
        "deadlines": None,
        "category": None,
        "intent": None,
        "handoff_available": True,
        "handoff_message": "Call RVA 311 at 804-646-7000 (Mon-Fri 8am-7pm, Sat 9am-1pm)",
    }


def format_partial_web(fallback_message: str, related: list[dict]) -> dict:
    """Partial-match response for web: fallback message + up to 5 related topic links."""
    return {
        "answer": fallback_message,
        "action_steps": [],
        "sources": [],
        "deadlines": None,
        "category": None,
        "intent": "_partial_match",
        "handoff_available": True,
        "handoff_message": "Call RVA 311 at 804-646-7000 (Mon-Fri 8am-7pm, Sat 9am-1pm)",
        "related": [
            {
                "title": r["title"],
                "answer_preview": r["answer_preview"],
                "sources": r["sources"],
                "category": r["category"],
            }
            for r in related
        ],
    }


def format_partial_sms(fallback_message: str, related: list[dict], is_first_message: bool = False) -> str:
    """Partial-match response for SMS: fallback message + up to 3 related topics with URLs."""
    lines = [fallback_message, "", "Related topics:"]
    for i, r in enumerate(related[:3], 1):
        url = r["sources"][0]["url"] if r["sources"] else ""
        lines.append(f"{i}. {r['title']}: {url}")
    text = "\n".join(lines)
    if is_first_message:
        text += "\n\n---\nYou'll also get emergency alerts from the City at this number. Reply STOP anytime to opt out."
    return text


GREETING_RESPONSE = (
    "Hi! I'm Hey804 — I help Richmond residents navigate city services. "
    "What do you need help with? You can ask about taxes, benefits, utility bills, "
    "or text HELP for options."
)

HELP_RESPONSE = (
    "Hey804 helps Richmond residents navigate city services. "
    "You can ask me about:\n"
    "- Tax bills & payment plans\n"
    "- SNAP, Medicaid, benefits\n"
    "- Utility bills & assistance\n"
    "- Rent help & housing\n"
    "- City services (311, trash, permits)\n"
    "- Roads, sidewalks, sewer, trees, parks\n"
    "- Code violations, dumping, pests, parking\n\n"
    "Or call RVA 311 at 804-646-7000 (Mon-Fri 8am-7pm, Sat 9am-1pm)."
)

STOP_RESPONSE = (
    "You've been unsubscribed from Hey804 messages. "
    "You won't receive any more texts. "
    "Text START to re-subscribe anytime."
)
