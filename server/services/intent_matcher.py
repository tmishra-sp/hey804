"""
Keyword-based intent matcher for Hey804.
Layer 1: fast keyword scoring, no API calls, handles 70-80% of queries.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

# Abbreviation and typo expansions — applied to message before scoring
EXPANSIONS = {
    # Common abbreviations
    "tx": "tax",
    "govt": "government",
    "ss": "social services",
    "dss": "social services",
    "biz": "business",
    "ins": "insurance",
    "util": "utility",
    "pmt": "payment",
    "dept": "department",
    "lic": "license",
    # Common misspellings
    "medicaide": "medicaid",
    "medicade": "medicaid",
    "medacaid": "medicaid",
    "assistence": "assistance",
    "assistense": "assistance",
    "reccycling": "recycling",
    "liscense": "license",
    "lisence": "license",
    "propty": "property",
    "evicton": "eviction",
    "utilty": "utility",
    "insurence": "insurance",
    # Emotional → keyword-friendly expansions
    "starving": "hungry food starving",
    "freezing": "cold heat freezing",
}


# High-signal keywords per intent (manually tuned for accuracy)
BOOST_KEYWORDS = {
    "tax_bill_cant_pay": [
        "tax", "taxes", "tax bill", "can't pay", "cant pay", "behind on taxes",
        "owe", "delinquent", "payment plan", "payment arrangement", "property tax",
        "real estate tax", "owe taxes",
        "scared", "lose my house", "foreclosure", "lien", "behind on",
        "owe money", "cant afford taxes", "can't afford taxes",
    ],
    "senior_disabled_tax_relief": [
        "senior", "elderly", "disabled", "disability", "oapd", "relief",
        "65", "veteran", "old", "tax relief", "tax exemption", "tax freeze",
        "mom is 70", "years old", "senior citizen",
        "disabled homeowner", "tax break for",
        "70 and can't pay", "can't pay property tax",
    ],
    "real_estate_tax_wrong": [
        "assessment", "appeal", "wrong", "incorrect", "too high",
        "property value", "assessor", "bill wrong", "tax wrong",
        "bill seems wrong", "bill is wrong",
        "tax bill wrong", "tax bill incorrect",
        "dispute", "overvalued", "dispute my tax",
        "appeal real estate", "how to appeal",
    ],
    "personal_property_tax_car": [
        "car tax", "car", "vehicle", "pptra", "personal property",
        "auto", "registration", "car tax bill",
    ],
    "utility_bill_cant_pay": [
        "utility", "water bill", "gas bill", "metrocare", "promisepay",
        "disconnected", "shut off", "utility bill", "can't pay water",
        "can't pay gas", "utility assistance",
        "lights off", "power off", "water turned off", "shut off notice",
        "disconnection", "about to lose",
    ],
    "water_safety": [
        "water safe", "boil", "advisory", "water crisis", "drinking water",
        "water quality", "water safe to drink", "boil water",
        "taste", "tastes", "brown", "cloudy", "dirty", "contaminated",
        "water taste", "water tastes", "water looks",
    ],
    "utility_bill_wrong": [
        "bill too high", "overcharged", "meter", "bill doubled",
        "utility bill wrong", "water bill too high", "charged too much",
        "way too high", "bill doesn't look right", "bill wrong",
        "getting charged too much", "bill is wrong", "doubled for no reason",
        "water bill wrong", "gas bill wrong", "gas bill too high",
        "dispute my utility", "dispute my water", "dispute my gas",
    ],
    "apply_snap_food": [
        "snap", "food stamps", "ebt", "hungry", "food help",
        "food assistance", "groceries", "food", "food stamps",
        "need food", "can't afford food", "cant afford food",
        "cant afford groceries", "can't afford groceries",
        "feed my", "kids are hungry", "no food",
        "starving", "food bank", "food pantry", "feed my kids", "feed my family",
    ],
    "apply_medicaid": [
        "medicaid", "health insurance", "medical", "famis", "coverva",
        "uninsured", "no insurance", "health coverage",
    ],
    "rent_help": [
        "rent", "eviction", "evicted", "housing", "apartment",
        "homeless", "shelter", "can't pay rent", "rental assistance",
        "kicked out", "nowhere to go", "lose my apartment", "behind on rent",
        "cant pay rent", "about to be evicted",
    ],
    "benefits_status_check": [
        "status", "pending", "approved", "application status",
        "haven't heard", "waiting", "check status", "benefits status",
        "when will i get",
    ],
    "where_to_go_in_person": [
        "office", "location", "in person", "address", "where do i go",
        "walk in", "welfare office", "social services office", "dss office",
    ],
    "energy_heating_assistance": [
        "heating", "liheap", "energy assistance", "furnace", "cold",
        "heat", "heating bill", "fuel assistance", "can't afford heat",
        "no heat", "no gas", "gas turned off", "heat turned off",
        "pipes frozen", "cold in my house",
    ],
    "report_pothole_streetlight": [
        "pothole", "streetlight", "road repair", "sidewalk", "street",
        "light out", "road needs repair",
    ],
    "trash_recycling": [
        "trash", "garbage", "recycling", "bulk pickup", "pickup",
        "collection", "missed trash", "trash pickup",
    ],
    "business_license": [
        "business license", "bpol", "start business", "business permit",
        "small business", "home business",
    ],
    "free_internet_computer": [
        "internet", "computer", "wifi", "library", "print",
        "online access", "free internet", "free wifi", "free computer",
    ],
    "pay_parking_ticket": [
        "parking", "parking ticket", "citation", "fine", "towed",
        "parking violation",
    ],
    "emergency_alerts": [
        "emergency", "alert", "notification", "richmond ready",
        "warning", "emergency alerts", "water alerts",
    ],
    "childcare_help": [
        "childcare", "daycare", "child care", "babysitter",
        "head start", "pre-k", "preschool", "can't afford daycare",
    ],
    "animal_control": [
        "animal", "stray", "dog", "cat", "loose dog", "stray dog", "stray cat",
        "animal control", "animal cruelty", "dangerous animal", "animal shelter",
        "loose animal", "barking",
    ],
    "jury_duty": [
        "jury", "jury duty", "summons", "jury summons", "court duty",
        "jury service", "juror", "jury pay",
    ],
    "marriage_license": [
        "marriage", "marriage license", "wedding", "courthouse wedding",
        "get married", "marriage certificate", "marriage requirements",
    ],
    "building_permit": [
        "permit", "building permit", "zoning", "renovation", "deck",
        "fence", "construction permit", "building inspection",
        "home improvement permit",
    ],
    "voter_registration": [
        "vote", "voter", "register to vote", "voter registration",
        "voting", "election", "ballot", "polling place", "where do I vote",
    ],
    "school_enrollment": [
        "school", "enroll", "enrollment", "kindergarten", "rps",
        "school registration", "richmond public schools", "preschool",
        "school zoned", "transfer school",
    ],
    "birth_death_certificate": [
        "birth certificate", "death certificate", "vital records",
        "birth record", "death record", "certificate copy",
    ],
    "senior_services": [
        "senior", "elderly", "meals on wheels", "homebound",
        "aging", "senior meals", "senior help", "grandma", "grandmother",
        "feedmore", "meal delivery", "aging services",
    ],
    "towed_vehicle": [
        "towed", "tow", "towing", "car towed", "vehicle towed",
        "abandoned car", "abandoned vehicle", "tow lot",
        "find my car", "car missing",
    ],
    "legal_aid": [
        "legal aid", "legal help", "lawyer", "attorney", "tenant rights",
        "landlord", "eviction court", "free lawyer", "free legal",
        "landlord tenant", "tenant dispute",
    ],
}


class IntentMatcher:
    """Keyword-based intent matcher. No external API calls."""

    def __init__(self, questions: list[dict]):
        self.questions = questions
        self._intent_by_id = {q["id"]: q for q in questions}
        self._intent_by_name = {q["intent"]: q for q in questions}
        self.keyword_map: dict[str, list[int]] = {}
        self._build_index()

    def _build_index(self):
        for q in self.questions:
            intent = q["intent"]
            keywords = list(BOOST_KEYWORDS.get(intent, []))

            # Also extract words from sample questions
            for sq in q["sample_questions"]:
                words = re.findall(r'\b\w+\b', sq.lower())
                keywords.extend(words)

            for kw in set(keywords):
                kw = kw.lower().strip()
                if len(kw) < 3:
                    continue
                if kw not in self.keyword_map:
                    self.keyword_map[kw] = []
                self.keyword_map[kw].append(q["id"])

    @staticmethod
    def normalize_message(message: str) -> str:
        """Expand abbreviations and fix common typos before scoring."""
        words = message.lower().split()
        normalized = []
        for word in words:
            clean = word.strip(".,!?;:'\"()[]")
            if clean in EXPANSIONS:
                normalized.append(EXPANSIONS[clean])
            else:
                normalized.append(word.lower())
        return " ".join(normalized)

    def match(self, message: str) -> tuple[dict | None, float]:
        """
        Score each intent by keyword overlap.
        Returns (best_match_entry, confidence) or (None, 0.0).
        """
        msg_lower = self.normalize_message(message)
        scores: dict[int, int] = {}

        for kw, intent_ids in self.keyword_map.items():
            if kw in msg_lower:
                weight = len(kw)  # longer = more specific = higher weight
                for iid in intent_ids:
                    scores[iid] = scores.get(iid, 0) + weight

        if not scores:
            return None, 0.0

        best_id = max(scores, key=scores.get)
        best_score = scores[best_id]

        if best_score < 5:
            return None, best_score / 10.0

        # Normalize confidence: 5-30 range mapped to 0.5-1.0
        confidence = min(1.0, 0.5 + (best_score - 5) / 50.0)
        return self._intent_by_id[best_id], confidence
