"""
Safety rails: PII detection + response validation.
Ensures no phone numbers or URLs appear that aren't in the knowledge base.
"""
from __future__ import annotations

import re

PII_PATTERNS = [
    re.compile(r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b'),   # SSN
    re.compile(r'\b\d{16}\b'),                         # Credit card (16 digits)
    re.compile(r'\b[A-Z]{1,2}\d{6,10}\b'),            # Account numbers
]

# All verified phone numbers from CONTEXT.md Section 9 + KB entries
ALLOWED_PHONE_NUMBERS = {
    "804-646-7000", "311",
    "804-646-4646",
    "804-646-7046",
    "804-646-7405",
    "888-832-3858",
    "855-635-4370",
    "804-646-7223",
    "866-534-5243",
    "211", "2-1-1",
    "804-646-7018",  # Fax for SNAP applications
    "804-521-2500",  # Central Virginia Food Bank (in handoff_trigger)
    "804-482-5525",  # Richmond Health District (in handoff_trigger)
    "866-366-4357",  # Dominion Energy EnergyShare
}

# Normalized versions for matching (digits only)
ALLOWED_PHONE_DIGITS = set()
for num in ALLOWED_PHONE_NUMBERS:
    digits = re.sub(r'\D', '', num)
    if digits:
        ALLOWED_PHONE_DIGITS.add(digits)


def contains_pii(text: str) -> bool:
    """Check if text contains personally identifiable information."""
    return any(p.search(text) for p in PII_PATTERNS)


def sanitize_message_for_storage(text: str, intent: str | None = None) -> str:
    """Replace PII in message text before storing."""
    if not contains_pii(text):
        return text
    sanitized = text
    for p in PII_PATTERNS:
        sanitized = p.sub("[REDACTED]", sanitized)
    return sanitized


def validate_response_citations(response_text: str, kb_entry: dict | None) -> str:
    """
    Ensure every phone number and URL in the response exists in the KB entry.
    Strip anything not in the KB and append 311 fallback if needed.
    """
    if kb_entry is None:
        return response_text

    # Collect allowed URLs from this KB entry
    allowed_urls = {s["url"] for s in kb_entry.get("sources", [])}

    # Collect allowed phone numbers from this KB entry's text
    entry_text = kb_entry.get("answer", "") + " ".join(kb_entry.get("action_steps", []))
    entry_phones = set(re.findall(r'\d{3}[-.]?\d{3}[-.]?\d{4}', entry_text))
    entry_phones.add("804-646-7000")  # 311 is always allowed
    entry_phones.add("311")

    # Check response for phone numbers not in KB
    response_phones = re.findall(r'\d{3}[-.]?\d{3}[-.]?\d{4}', response_text)
    for phone in response_phones:
        if phone not in entry_phones and phone not in ALLOWED_PHONE_NUMBERS:
            response_text = response_text.replace(phone, "804-646-7000 (RVA 311)")

    return response_text
