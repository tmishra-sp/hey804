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
    # Infrastructure typos
    "sienwalk": "sidewalk",
    "sidwalk": "sidewalk",
    "sewar": "sewer",
    "sewege": "sewage",
    "pothol": "pothole",
    "grafiti": "graffiti",
    "grafitti": "graffiti",
    "stret": "street",
    "trafic": "traffic",
    "traffik": "traffic",
    "manhole": "manhole sewer",
    "scootr": "scooter",
    "wreckless": "reckless",
    "mosquito's": "mosquitoes",
    "mosquitos": "mosquitoes",
    "roach": "roaches cockroach",
    "racoon": "animal",
    "possum": "animal",
    "opossum": "animal",
    "coyote": "animal dangerous",
    "abandonded": "abandoned",
    "abondoned": "abandoned",
    "dumpster": "dumping trash",
    "sinkhol": "sinkhole",
}


# High-signal keywords per intent (manually tuned for accuracy)
BOOST_KEYWORDS = {
    "tax_bill_help": [
        "tax", "taxes", "tax bill", "can't pay", "cant pay", "behind on taxes",
        "owe", "delinquent", "payment plan", "payment arrangement", "property tax",
        "real estate tax", "owe taxes",
        "scared", "lose my house", "foreclosure", "lien", "behind on",
        "owe money", "cant afford taxes", "can't afford taxes",
        # From 311: Delinquent Collections keywords
        "past due tax", "past-due", "wage garnishment", "garnish",
        "collection agency", "late charges", "penalty and interest",
        "bankruptcy", "debt set-off", "seizure",
        # Pay / lookup keywords
        "pay my taxes", "pay tax bill", "look up my tax", "how much are my taxes",
        "where to pay taxes", "tax bill lookup", "check my tax",
    ],
    "senior_disabled_tax_relief": [
        "senior", "elderly", "disabled", "disability", "oapd", "relief",
        "65", "veteran", "old", "tax relief", "tax exemption", "tax freeze",
        "mom is 70", "years old", "senior citizen",
        "disabled homeowner", "tax break for",
        "70 and can't pay", "can't pay property tax",
        # From 311: Tax Relief for Older Adults keywords
        "elderly tax relief", "disabled tax relief", "oads", "oadp",
        "tax credit", "aging adult", "disabled person",
    ],
    "real_estate_tax_wrong": [
        "assessment", "appeal", "wrong", "incorrect", "too high",
        "property value", "assessor", "bill wrong", "tax wrong",
        "bill seems wrong", "bill is wrong",
        "tax bill wrong", "tax bill incorrect",
        "dispute", "overvalued", "dispute my tax",
        "appeal real estate", "how to appeal",
        # From 311: Real Estate Taxes keywords
        "refund", "missing tax payment", "penalty waiver",
        "mortgage company", "escrow", "address change",
    ],
    "personal_property_tax_car": [
        "car tax", "car", "vehicle", "pptra", "personal property",
        "auto", "registration", "car tax bill",
        # From 311: Vehicle Personal Property keywords
        "truck", "automobile", "boat", "trailer",
    ],
    "utility_bill_help": [
        "utility", "water bill", "gas bill", "metrocare", "promisepay",
        "disconnected", "shut off", "utility bill", "can't pay water",
        "can't pay gas", "utility assistance",
        "lights off", "power off", "water turned off", "shut off notice",
        "disconnection", "about to lose",
        # From simulation fixes
        "turned back on", "turn back on", "reconnect", "reconnection",
        "water back on", "turn water on", "turn my water",
        # Pay keywords
        "pay my water bill", "pay my bill", "pay utility bill",
        "where to pay my water", "pay DPU",
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
        # From simulation fixes
        "didnt use that much", "didn't use that much", "not using that much",
        "overcharge", "bill is $", "500 bill",
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
        # From simulation fixes
        "cant afford medicine", "can't afford medicine", "afford my medicine",
        "no health insurance", "need health insurance", "doctor",
        "prescription", "afford medication",
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
        "pothole", "pot hole", "road needs repair",
        "report a pothole", "pothole on my",
        "pothole repair", "asphalt", "pavement",
        "pothole on road", "pothole on street",
        "crater", "crater in the road",
        "big hole in the road", "big hole in the street",
        "pothole damaged", "pothole damage",
    ],
    "trash_recycling": [
        "trash", "garbage", "recycling", "bulk pickup", "pickup",
        "collection", "missed trash", "trash pickup",
        # From 311: Missed Trash/Recycling/Bulk keywords
        "missed collection", "missed garbage", "missed recycling",
        "bulk trash", "appliance pickup", "junk pickup",
        "garbage truck", "trash can", "supercan", "trash cart",
    ],
    "business_license": [
        "business license", "bpol", "start business", "business permit",
        "small business", "home business",
        # From 311: Business Licenses keywords
        "renew business license", "new business", "closing business",
        "open business", "obtain business license",
    ],
    "free_internet_computer": [
        "internet", "computer", "wifi", "library", "print",
        "online access", "free internet", "free wifi", "free computer",
        # From simulation fixes
        "library hours", "library location", "nearest library",
    ],
    "pay_parking_ticket": [
        "parking", "parking ticket", "citation", "fine",
        "parking violation",
        # From 311: Parking Citation keywords
        "contest ticket", "contest citation", "appeal ticket",
        "dmv hold", "broken meter", "stolen plates",
        "parking ticket hold", "delinquent parking",
    ],
    "emergency_alerts": [
        "emergency", "alert", "notification", "richmond ready",
        "warning", "emergency alerts", "water alerts",
        # From 311: Storm-Related keywords
        "severe storm", "severe weather", "thunderstorm", "high winds",
        "downed trees", "tree down", "blocked road",
    ],
    "childcare_help": [
        "childcare", "daycare", "child care", "babysitter",
        "head start", "pre-k", "preschool", "can't afford daycare",
    ],
    "animal_control": [
        "animal", "stray", "dog", "cat", "loose dog", "stray dog", "stray cat",
        "animal control", "animal cruelty", "dangerous animal", "animal shelter",
        "loose animal", "barking", "dead animal", "dead animal removal",
        # From 311: Animal Care/Dead Animal keywords
        "animal abuse", "animal neglect", "vicious", "roadkill",
        "carcass", "snake", "chickens", "rabbit",
        # From simulation fixes
        "bit", "bite", "biting", "bit someone", "dead deer",
        "dead raccoon", "picks up dead", "running loose",
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
        # From 311: Aging and Disability keywords
        "medical transport", "medical transportation", "ride share",
        "elderly programs", "disability benefits", "soup kitchens",
    ],
    "towed_vehicle": [
        "towed", "tow", "towing", "car towed", "car was towed", "vehicle towed",
        "abandoned car", "abandoned vehicle", "tow lot",
        "find my car", "car missing",
        # From 311: Abandoned Vehicle keywords
        "inoperable vehicle", "stranded vehicle", "no tags",
        "improperly tagged",
    ],
    "legal_aid": [
        "legal aid", "legal help", "lawyer", "attorney", "tenant rights",
        "landlord", "eviction court", "free lawyer", "free legal",
        "landlord tenant", "tenant dispute",
    ],
    "road_sidewalk_repair": [
        "sidewalk", "sidewalk repair", "alley repair", "curb", "gutter",
        "bridge repair", "cobblestone", "road repair",
        "crumbling sidewalk", "broken sidewalk", "ramp repair",
        "side walk", "pedestrian walkway", "ADA ramp",
        "handicap ramp", "curb ramp", "gravel alley", "asphalt alley",
        "cobblestone alley", "concrete alley",
        "crumbling pavement", "missing stones",
        "repair sidewalk", "repair alley",
        "cobblestone road", "repair road", "repair street",
        "fix this street", "fix the street", "fix the road", "fix my street",
        "road is falling apart", "road falling apart",
        "paving", "repaving", "needs paving", "needs repaving",
    ],
    "report_sinkhole": [
        "sinkhole", "sink hole", "cave-in", "caved-in", "caving in",
        "cave in", "ground collapsing", "ground is collapsing", "road collapsing",
        "road is sinking", "street is sinking", "ground caving",
        "road caving", "hole opening up", "ground sinking",
    ],
    "traffic_signs_signals": [
        "traffic signal", "traffic light", "stop sign", "stop light",
        "street sign", "sign down", "signal out", "signal not working",
        "traffic sign", "intersection safety", "roadway safety",
        "stop sign down", "stop sign missing", "need a stop sign",
        # From 311: Traffic Signs/Signals keywords
        "red light", "traffic light out", "traffic signal out",
        "signal timing", "school flasher", "pedestrian signal",
        "yield sign", "speed limit sign", "damaged sign",
        "traffic emergency", "signal repair", "replace sign",
    ],
    "streetlight_new_repair": [
        "streetlight", "streetlight repair", "new streetlight", "light pole",
        "dark street", "streetlight out", "flickering light",
        "request streetlight", "street lamp", "light out",
        "street light", "streetlight on my block",
        # From 311: Streetlight keywords
        "light blinking", "pole damaged", "pole broken",
        "wires hanging", "cable hanging",
    ],
    "tree_vegetation": [
        "tree", "tree trimming", "tree planting", "stump", "stump removal",
        "overgrown vegetation", "fallen tree", "dead tree", "branches",
        "tree removal", "plant a tree", "street tree",
        # From 311: Trees/Vegetation keywords
        "pruning", "dead limbs", "falling limbs", "dropping limbs",
        "tree hazard", "dying tree", "damaged tree", "limbs",
        "struck by lightning", "bushes blocking", "overgrown",
        "tree maintenance", "inspect tree", "evaluate tree",
        "replace tree", "overhanging",
    ],
    "parks_trails": [
        "park", "trail", "playground", "park bench", "park equipment",
        "community garden", "park maintenance", "richmond park",
        "park trail", "park issue",
        # From 311: Parks/Trails/Garden keywords
        "swampy", "muddy trail", "flooded trail", "tree down trail",
        "trail marker", "trail sign", "kiosk", "poison ivy",
        "downed tree", "overgrown trail", "neighborhood garden",
    ],
    "stormwater_flooding": [
        "flooding", "standing water", "stormwater", "storm drain",
        "drain clogged", "drainage", "flooded street",
        "stormwater drain", "water pooling", "drain blocked",
        # From 311: Stormwater/Drainage keywords
        "catch basin", "culvert", "ditch", "erosion",
        "inlet", "stormsewer", "stagnant water",
        "dirty drain", "debris in drain",
        # From simulation fixes
        "creek", "water running down", "driveway flooding",
        "water running", "flooded driveway",
    ],
    "sewer_issues": [
        "sewer", "sewage", "sewer backup", "sewer overflow", "sewer odor",
        "sewage backup", "sewer smell", "basement flooding sewage",
        "sewage in my", "sewer line", "sewer problem",
        "sewer manhole", "sewage smell",
        # From simulation fixes
        "coming up from the ground", "water coming up",
        "manhole cover", "missing manhole", "covers the pipes",
    ],
    "code_enforcement": [
        "code violation", "code enforcement", "property maintenance",
        "abandoned building", "unsafe building", "structural condition",
        "construction without permit", "overgrown yard", "junk yard",
        "property violation", "vacant building",
        # From 311: Code Enforcement keywords
        "dilapidated", "peeling paint", "lead paint", "unsafe stairs",
        "broken fence", "squatters", "vagrants", "weeds",
        "old tires", "hand railing", "stairwell",
        "fire alarms", "plumbing",
        "roof damage", "without permit", "remodeling",
        "occupy illegally", "too many units",
        "airbnb", "short-term rental", "illegal business",
        "boarding house", "commercial vehicles",
        # From simulation fixes
        "building falling down", "building gonna collapse",
        "about to collapse", "unsafe structure", "condemned",
        "building falling apart",
    ],
    "illegal_dumping_graffiti": [
        "illegal dumping", "dumping", "graffiti", "litter", "vandalism",
        "trash dumped", "junk dumped", "spray paint",
        "dumped in alley", "dumped on property",
        # From 311: Dumping/Graffiti/Litter keywords
        "gang tags", "tagged", "graffiti removal", "clean graffiti",
        "neighborhood dumping", "overflowing trash",
        "trash accumulation", "litter accumulation",
        "debris in bike lane", "city trashcan",
    ],
    "pest_control": [
        "rats", "rat", "mice", "mouse", "roaches", "cockroach",
        "mosquitoes", "mosquito", "infestation", "vermin", "pest",
        "rodent", "pest control", "pest problem",
        # From 311: Infestation/Vermin/Mosquito keywords
        "bees", "wasps", "bugs", "insects",
        "mosquitoes breeding", "mosquito breeding",
        "stagnant water mosquito",
        # Boost for common queries
        "rats in my", "mice in my", "roaches in my",
    ],
    "residential_parking": [
        "parking permit", "residential parking", "residential parking permit",
        "parking violation", "scooter", "scooter blocking",
        "fire hydrant parking", "blocking driveway",
        "illegal parking", "parking decal",
        # From 311: Parking Permit/Violations keywords
        "loading zone", "blocking crosswalk", "bus stop parking",
        "fan parking", "carver parking",
    ],
    "report_speeding_safety": [
        "speeding", "speed enforcement", "reckless driving",
        "gas leak", "smell gas", "speed bumps",
        "cars keep speeding", "traffic safety",
        # From 311: Speed Violations/Gas Leak keywords
        "racing", "dangerous driving", "wreckless",
        "exceeding speed limit", "natural gas", "gas smell",
    ],
}



# Words too generic to be useful for matching — they appear in every kind of message
# and cause cross-intent score pollution.
STOP_WORDS_INDEX = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can",
    "had", "her", "was", "one", "our", "out", "has", "his", "how",
    "its", "may", "new", "now", "old", "see", "way", "who", "did",
    "get", "got", "let", "say", "she", "too", "use", "from", "with",
    "have", "this", "will", "your", "been", "call", "come", "each",
    "make", "like", "long", "look", "many", "some", "than", "them",
    "then", "what", "when", "where", "which", "about", "could",
    "after", "every", "first", "found", "their", "there", "these",
    "think", "those", "would", "know", "want",
    "just", "here", "much", "that", "they", "very", "also",
    "back", "been", "city", "does", "done", "down", "going",
    "good", "into", "keep", "next", "over", "take",
    "door", "doing", "looks", "someone", "near", "right",
    "ground", "house", "block", "live", "been",
    "neighborhood",
}


class IntentMatcher:
    """Keyword-based intent matcher. No external API calls."""

    def __init__(self, questions: list[dict]):
        self.questions = questions
        self._intent_by_id = {q["id"]: q for q in questions}
        self._intent_by_name = {q["intent"]: q for q in questions}
        self.keyword_map: dict[str, list[int]] = {}
        self._keyword_patterns: dict[str, re.Pattern] = {}
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
                # Skip stop words (only for single words extracted from sample questions)
                if ' ' not in kw and kw in STOP_WORDS_INDEX:
                    continue
                if kw not in self.keyword_map:
                    self.keyword_map[kw] = []
                self.keyword_map[kw].append(q["id"])

        # Pre-compile word-boundary patterns for single-word keywords
        for kw in self.keyword_map:
            if ' ' in kw:
                self._keyword_patterns[kw] = None  # multi-word: use substring
            else:
                self._keyword_patterns[kw] = re.compile(r'\b' + re.escape(kw) + r'\b')

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

    def _score(self, msg_lower: str) -> dict[int, int]:
        """Score all intents by keyword overlap using word-boundary matching."""
        scores: dict[int, int] = {}
        for kw, intent_ids in self.keyword_map.items():
            pattern = self._keyword_patterns[kw]
            if pattern is None:
                # Multi-word keyword: use substring matching
                matched = kw in msg_lower
            else:
                # Single-word keyword: use word-boundary matching
                matched = bool(pattern.search(msg_lower))

            if matched:
                weight = len(kw)  # longer = more specific = higher weight
                for iid in intent_ids:
                    scores[iid] = scores.get(iid, 0) + weight
        return scores

    def match(self, message: str) -> tuple[dict | None, float]:
        """
        Score each intent by keyword overlap.
        Returns (best_match_entry, confidence) or (None, 0.0).
        """
        msg_lower = self.normalize_message(message)
        scores = self._score(msg_lower)

        if not scores:
            return None, 0.0

        best_id = max(scores, key=scores.get)
        best_score = scores[best_id]

        if best_score < 5:
            return None, best_score / 10.0

        # Normalize confidence: 5-30 range mapped to 0.5-1.0
        confidence = min(1.0, 0.5 + (best_score - 5) / 50.0)
        return self._intent_by_id[best_id], confidence

    def match_with_related(self, message: str) -> dict:
        """
        Three-tier matching: full match, partial match with related topics, or no match.
        Returns {match, confidence, related}.
        """
        msg_lower = self.normalize_message(message)
        scores = self._score(msg_lower)

        if not scores:
            return {"match": None, "confidence": 0.0, "related": []}

        best_id = max(scores, key=scores.get)
        best_score = scores[best_id]

        if best_score >= 5:
            # Check if this is a real match or a coin flip
            # If the #2 intent is within 30% of #1, keywords are guessing — lower confidence
            sorted_all = sorted(scores.values(), reverse=True)
            second_score = sorted_all[1] if len(sorted_all) > 1 else 0
            gap = (best_score - second_score) / best_score if best_score > 0 else 1.0

            if gap < 0.3:
                # Close race — keywords can't distinguish, signal low confidence for LLM
                confidence = min(0.55, 0.3 + gap)
            else:
                # Clear winner
                confidence = min(1.0, 0.5 + (best_score - 5) / 50.0)

            # Runner-ups must score at least 70% of the winner to be shown
            min_related_score = max(5, int(best_score * 0.7))
            other_ids = sorted(
                [iid for iid in scores if iid != best_id and scores[iid] >= min_related_score],
                key=scores.get, reverse=True
            )[:3]
            related = []
            for iid in other_ids:
                q = self._intent_by_id[iid]
                related.append({
                    "title": q["sample_questions"][0],
                    "answer_preview": q["answer"].split(".")[0] + ".",
                    "sources": q.get("sources", []),
                    "category": q.get("category"),
                })
            return {"match": self._intent_by_id[best_id], "confidence": confidence, "related": related}

        # Partial match — collect top 5 related intents
        sorted_ids = sorted(scores, key=scores.get, reverse=True)[:5]
        related = []
        for iid in sorted_ids:
            q = self._intent_by_id[iid]
            related.append({
                "title": q["sample_questions"][0],
                "answer_preview": q["answer"].split(".")[0] + ".",
                "sources": q.get("sources", []),
                "category": q.get("category"),
            })
        return {"match": None, "confidence": best_score / 10.0, "related": related}
