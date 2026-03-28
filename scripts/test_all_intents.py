#!/usr/bin/env python3
"""
Test all 42 intents: match accuracy, citation safety, SMS length.
Run: python3 -m scripts.test_all_intents
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.services.engine import Hey804Engine
from server.config import KB_PATH

# --- Allowed phone numbers from CONTEXT.md Section 9 ---
ALLOWED_PHONES = {
    "8046467000", "311",
    "8046464646",
    "8046467046",
    "8046467405",
    "8888323858",
    "8556354370",
    "8046467223",
    "8665345243",
    "211",
    "8046467018",   # fax for SNAP
    "8045212500",   # Central VA Food Bank (handoff)
    "8044825525",   # Richmond Health District (handoff)
    "8663664357",   # Dominion EnergyShare
    "8046465573",   # Animal Care & Control
    "8046460802",   # Jury duty line
    "8046466501",   # Jury questions
    "8046466767",   # Marriage license appointments
    "8005529745",   # VA voter registration
    "8047807710",   # RPS enrollment
    "8042053911",   # Vital records
    "8046461082",   # Senior/disability help line
    "8045215200",   # FeedMore meals on wheels
    "8046465100",   # Non-emergency police
    "8448025910",   # Senior legal helpline
    "8668304501",   # Predatory loan helpline
    "911",          # Emergency services
}

SMS_MAX_CHARS = 1000


def extract_phone_numbers(text: str) -> list[str]:
    """Extract all phone-number-like strings, normalize to digits only."""
    # Match standard US phone formats: 804-646-7000, (804) 646-7000, 804.646.7000
    # Also match short codes: 311, 211
    patterns = [
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 10-digit phone numbers
    ]
    # Also look for standalone short codes (311, 211) but NOT street numbers
    short_code_pattern = r'(?:^|[\s(])(\d{3})(?=[\s).,;:!?]|$)'
    result = []
    for p in patterns:
        for match in re.finditer(p, text):
            digits = re.sub(r'\D', '', match.group())
            result.append(digits)
    # Only flag short codes that look like phone numbers, not addresses
    for match in re.finditer(short_code_pattern, text):
        code = match.group(1)
        # Skip if followed by address indicators (E., W., N., S., Street, St)
        end = match.end()
        after = text[end:end+15].strip()
        if re.match(r'^[EWNS]\.?\s', after) or re.match(r'^(Street|St|Ave|Blvd|Road|Rd)', after, re.I):
            continue
        if code in ("311", "211", "911"):
            result.append(code)
    return result


def extract_urls(text: str) -> list[str]:
    return re.findall(r'https?://[^\s\)]+', text)


def main():
    engine = Hey804Engine(KB_PATH)

    # Load KB for source URL validation
    with open(KB_PATH) as f:
        kb = json.load(f)

    # Build set of all allowed URLs from KB
    all_kb_urls = set()
    for q in kb["questions"]:
        for s in q["sources"]:
            all_kb_urls.add(s["url"])
    # Also allow common URLs mentioned in action steps
    all_kb_urls.add("https://commonhelp.virginia.gov/")
    all_kb_urls.add("https://coverva.dmas.virginia.gov/apply/how-to-apply/")

    # One representative sample question per intent
    test_cases = [
        (1,  "tax_bill_cant_pay",           "I got a tax bill I can't pay"),
        (2,  "senior_disabled_tax_relief",   "I'm a senior can I get tax relief"),
        (3,  "real_estate_tax_wrong",        "My tax bill seems wrong"),
        (4,  "personal_property_tax_car",    "How do I pay my car tax"),
        (5,  "utility_bill_cant_pay",        "Can't pay my water bill"),
        (6,  "water_safety",                 "Is the water safe to drink"),
        (7,  "utility_bill_wrong",           "My water bill is way too high"),
        (8,  "apply_snap_food",              "How do I get food stamps"),
        (9,  "apply_medicaid",               "Need health insurance can't afford it"),
        (10, "rent_help",                    "I need help paying rent"),
        (11, "benefits_status_check",        "Check my benefits status"),
        (12, "where_to_go_in_person",        "Where is the social services office"),
        (13, "energy_heating_assistance",    "Help with heating bill"),
        (14, "report_pothole_streetlight",   "How to report a pothole"),
        (15, "trash_recycling",              "When is trash pickup"),
        (16, "business_license",             "How to get a business license"),
        (17, "free_internet_computer",       "Where can I use a computer for free"),
        (18, "pay_parking_ticket",           "How to pay a parking ticket"),
        (19, "emergency_alerts",             "How do I get emergency alerts"),
        (20, "childcare_help",              "Help paying for childcare"),
        (21, "animal_control",          "There's a stray dog in my yard"),
        (22, "jury_duty",               "I got a jury duty summons"),
        (23, "marriage_license",        "How to get a marriage license in Richmond"),
        (24, "building_permit",         "Do I need a building permit for a deck"),
        (25, "voter_registration",      "How do I register to vote"),
        (26, "school_enrollment",       "How to enroll my kid in Richmond schools"),
        (27, "birth_death_certificate", "How to get a birth certificate in Richmond"),
        (28, "senior_services",         "meals on wheels for my grandma"),
        (29, "towed_vehicle",           "My car got towed where is it"),
        (30, "legal_aid",               "I need free legal help for eviction"),
        (31, "road_sidewalk_repair",    "The sidewalk on my street is broken"),
        (32, "traffic_signs_signals",   "A traffic light is out on my street"),
        (33, "streetlight_new_repair",  "The streetlight on my block is out"),
        (34, "tree_vegetation",         "I need a tree trimmed on my street"),
        (35, "parks_trails",            "Something is broken at my local park"),
        (36, "stormwater_flooding",     "Standing water won't drain on my street"),
        (37, "sewer_issues",            "There's a sewer smell on my street"),
        (38, "code_enforcement",        "My neighbor's property is falling apart"),
        (39, "illegal_dumping_graffiti","Someone dumped trash in the alley"),
        (40, "pest_control",            "There are rats in my neighborhood"),
        (41, "residential_parking",     "How do I get a residential parking permit"),
        (42, "report_speeding_safety",  "Cars keep speeding on my street"),
    ]

    print("=" * 90)
    print(f"Hey804 — Full Intent Test Suite ({len(test_cases)} intents)")
    print("=" * 90)

    results = []
    for qid, expected_intent, sample in test_cases:
        # Get intent match info
        info = engine.get_intent_info(sample)
        matched_intent = info["intent"]
        confidence = info["confidence"]

        # Get SMS response
        sms_response = engine.respond(sample, channel="sms")

        # Check 1: Intent matched correctly
        intent_ok = matched_intent == expected_intent

        # Check 2: Phone numbers in response are all allowed
        phones_in_response = extract_phone_numbers(sms_response)
        bad_phones = []
        for p in phones_in_response:
            if p not in ALLOWED_PHONES:
                bad_phones.append(p)
        phones_ok = len(bad_phones) == 0

        # Check 3: URLs in response are all in KB
        urls_in_response = extract_urls(sms_response)
        bad_urls = []
        for u in urls_in_response:
            # Strip trailing punctuation
            u_clean = u.rstrip('.,;:)')
            if u_clean not in all_kb_urls:
                bad_urls.append(u_clean)
        urls_ok = len(bad_urls) == 0

        # Check 4: SMS length under 1000 chars
        length = len(sms_response)
        length_ok = length <= SMS_MAX_CHARS

        all_ok = intent_ok and phones_ok and urls_ok and length_ok
        status = "PASS" if all_ok else "FAIL"

        results.append({
            "id": qid,
            "intent": expected_intent,
            "status": status,
            "intent_ok": intent_ok,
            "matched": matched_intent,
            "confidence": confidence,
            "phones_ok": phones_ok,
            "bad_phones": bad_phones,
            "urls_ok": urls_ok,
            "bad_urls": bad_urls,
            "length": length,
            "length_ok": length_ok,
        })

    # Print results table
    print(f"\n{'ID':>3} {'Intent':<35} {'Match':>5} {'Phones':>6} {'URLs':>5} {'Len':>5} {'Result':>6}")
    print("-" * 90)

    pass_count = 0
    for r in results:
        intent_sym = "ok" if r["intent_ok"] else f"WRONG({r['matched']})"
        phones_sym = "ok" if r["phones_ok"] else f"BAD({r['bad_phones']})"
        urls_sym = "ok" if r["urls_ok"] else f"BAD({r['bad_urls']})"
        length_sym = f"{r['length']}" if r["length_ok"] else f"{r['length']}!"

        print(f"{r['id']:>3} {r['intent']:<35} {intent_sym:>5} {phones_sym:>6} {urls_sym:>5} {length_sym:>5} {r['status']:>6}")

        if r["status"] == "PASS":
            pass_count += 1
        else:
            # Print details for failures
            if not r["intent_ok"]:
                print(f"     ^ Expected: {r['intent']}, Got: {r['matched']} (conf={r['confidence']:.2f})")
            if not r["phones_ok"]:
                print(f"     ^ Unverified phones: {r['bad_phones']}")
            if not r["urls_ok"]:
                print(f"     ^ Unverified URLs: {r['bad_urls']}")
            if not r["length_ok"]:
                print(f"     ^ SMS too long: {r['length']} chars (max {SMS_MAX_CHARS})")

    print("-" * 90)
    total_tier0 = len(test_cases)
    print(f"\nTier 0 RESULT: {pass_count}/{total_tier0} passed")

    any_failure = pass_count < total_tier0

    # ------------------------------------------------------------------
    # TIER A: Sample Question Round-Trip Test
    # Loop through every sample_question in the KB and verify it matches
    # its own intent.  Catches regressions when adding new samples.
    # ------------------------------------------------------------------
    print("\n" + "=" * 90)
    print("Tier A — Sample Question Round-Trip Test (all KB sample_questions)")
    print("=" * 90)

    tier_a_pass = 0
    tier_a_total = 0
    for q in kb["questions"]:
        expected = q["intent"]
        for sample in q["sample_questions"]:
            tier_a_total += 1
            info = engine.get_intent_info(sample)
            matched = info["intent"]
            ok = matched == expected
            status_str = "PASS" if ok else "FAIL"
            if ok:
                tier_a_pass += 1
            else:
                print(f"  FAIL: \"{sample}\" -> expected {expected}, got {matched} (conf={info['confidence']:.2f})")
                any_failure = True

    print(f"\nTier A RESULT: {tier_a_pass}/{tier_a_total} sample questions matched their own intent")

    # ------------------------------------------------------------------
    # TIER B: Adversarial / Colloquial Tests
    # Abbreviations, typos, emotional phrasings, colloquial language.
    # ------------------------------------------------------------------
    print("\n" + "=" * 90)
    print("Tier B — Adversarial / Colloquial Tests")
    print("=" * 90)

    adversarial_tests = [
        ("tx bill", "tax_bill_cant_pay"),
        ("water taste weird", "water_safety"),
        ("medicaide", "apply_medicaid"),
        ("my kids are hungry", "apply_snap_food"),
        ("scared im gonna lose my house over taxes", "tax_bill_cant_pay"),
        ("no heat in my house", "energy_heating_assistance"),
        ("eviction notice", "rent_help"),
        ("where is the welfare office", "where_to_go_in_person"),
        ("lights about to get cut off", "utility_bill_cant_pay"),
        ("I need an EBT card", "apply_snap_food"),
        ("my water looks brown", "water_safety"),
        ("behind on rent 2 months", "rent_help"),
        ("how to get a biz license", "business_license"),
        ("free wifi near me", "free_internet_computer"),
        ("got a parking fine", "pay_parking_ticket"),
        # New infrastructure intents
        ("broken sidewalk near me", "road_sidewalk_repair"),
        ("sewer smells bad", "sewer_issues"),
        ("rats coming from the sewer", "pest_control"),
        ("someone dumped a couch in the alley", "illegal_dumping_graffiti"),
        ("my street floods every time it rains", "stormwater_flooding"),
    ]

    tier_b_pass = 0
    tier_b_total = len(adversarial_tests)

    print(f"\n{'#':>3} {'Input':<45} {'Expected':<30} {'Got':<30} {'Result':>6}")
    print("-" * 90)

    for idx, (text, expected) in enumerate(adversarial_tests, 1):
        info = engine.get_intent_info(text)
        matched = info["intent"]
        ok = matched == expected
        status_str = "PASS" if ok else "FAIL"
        if ok:
            tier_b_pass += 1
        else:
            any_failure = True
        got_display = matched if matched else "(fallback)"
        print(f"{idx:>3} {text:<45} {expected:<30} {got_display:<30} {status_str:>6}")
        if not ok:
            print(f"     ^ conf={info['confidence']:.2f}")

    print("-" * 90)
    print(f"\nTier B RESULT: {tier_b_pass}/{tier_b_total} adversarial tests passed")

    # ------------------------------------------------------------------
    # TIER C: Fallback Tests
    # These messages should NOT match the wrong intent; they should
    # either be handled as a special command or fall back gracefully.
    # ------------------------------------------------------------------
    print("\n" + "=" * 90)
    print("Tier C — Fallback / Graceful Degradation Tests")
    print("=" * 90)

    should_not_match_wrong = [
        ("hello", None),  # Should be greeting, not an intent
        ("asdfkjasldf", None),  # Gibberish should fallback
        ("help", None),  # Should be HELP command
    ]

    tier_c_pass = 0
    tier_c_total = len(should_not_match_wrong)

    print(f"\n{'#':>3} {'Input':<30} {'Expected':<15} {'Got':<30} {'Result':>6}")
    print("-" * 90)

    for idx, (text, expected) in enumerate(should_not_match_wrong, 1):
        info = engine.get_intent_info(text)
        matched = info["intent"]
        # For fallback tests, expected is None — the intent matcher should
        # return None (fallback) for these inputs.  If the engine matched
        # a real KB intent, that's wrong.
        ok = matched == expected
        status_str = "PASS" if ok else "FAIL"
        if ok:
            tier_c_pass += 1
        else:
            any_failure = True
        got_display = matched if matched else "(none/fallback)"
        exp_display = expected if expected else "(none/fallback)"
        print(f"{idx:>3} {text:<30} {exp_display:<15} {got_display:<30} {status_str:>6}")
        if not ok:
            print(f"     ^ conf={info['confidence']:.2f}")

    print("-" * 90)
    print(f"\nTier C RESULT: {tier_c_pass}/{tier_c_total} fallback tests passed")

    # ------------------------------------------------------------------
    # FINAL SUMMARY
    # ------------------------------------------------------------------
    total_pass = pass_count + tier_a_pass + tier_b_pass + tier_c_pass
    total_tests = total_tier0 + tier_a_total + tier_b_total + tier_c_total
    print("\n" + "=" * 90)
    print(f"OVERALL: {total_pass}/{total_tests} tests passed "
          f"(Tier 0: {pass_count}/{total_tier0}, A: {tier_a_pass}/{tier_a_total}, "
          f"B: {tier_b_pass}/{tier_b_total}, C: {tier_c_pass}/{tier_c_total})")
    print("=" * 90)

    if any_failure:
        print("\nSome tests FAILED. Fix failures before proceeding.")
        sys.exit(1)
    else:
        print("\nAll tests passed. Ready for Phase 2.")
        sys.exit(0)


if __name__ == "__main__":
    main()
