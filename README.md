# Hey804

### Richmond's 311 gets 163,000 calls a year. Most are people trying to keep their lights on, feed their kids, or fix their street. They shouldn't have to navigate 14 departments and 89 forms to get help.

**Hey804 routes residents to the exact right city service — in seconds, in any language, on any phone.**

[Live Demo](https://hey804-production.up.railway.app/widget-demo.html)

---

## What happens when a resident types "sinkhole on my street"

| Without Hey804 | With Hey804 |
|---|---|
| Go to rva311.com | Type "sinkhole" |
| Browse 14 service groups | Get one button: **Report Sinkhole** |
| Pick "Roads, Alleys, Sidewalks" | Routed to **Dept of Public Utilities** |
| Choose from 11 sub-options | See: **12-hour emergency response** |
| Maybe pick "Pothole" (wrong form, wrong dept) | Link goes to the exact right form |
| Request sits in wrong queue for 14 days | DPU responds within 12 hours |

**That's the difference.** A pothole goes to Public Works. A sinkhole goes to Public Utilities. Different departments. Different urgency. Different phone numbers. Hey804 knows which is which — because the city's own 311 data told us.

---

## How it works

```
Citizen describes their issue (text, web, or widget)
              |
     ┌────────┴────────┐
     │ Safety-first:    │  "gas leak" → Call 911
     │ Emergency?       │  "domestic violence" → DV Hotline
     │ Crisis?          │  "someone stole my car" → Call Police
     │ Not city service?│  (runs BEFORE any classification)
     └────────┬────────┘
              |
     ┌────────┴────────┐
     │ Hybrid matching: │  Keywords handle 70% instantly
     │ Keywords + LLM   │  LLM resolves the ambiguous 30%
     │                  │  ("water is leaking" → sewer? stormwater? billing?)
     └────────┬────────┘
              |
     ┌────────┴────────┐
     │ Response from    │  Every phone number, URL, deadline
     │ curated KB only  │  comes from rva.gov / rva311.com
     │ (never AI text)  │  Verified. Cited. Never invented.
     └────────┬────────┘
              |
     Answer + exact rva311.com form link
     + department name + response timeline
```

**This is a routing engine, not a chatbot.** The AI classifies the question. The answer comes from the city's own data. When it's not sure, it says so.

---

## Why this matters for Richmond

**14,000 households** in Richmond lack broadband. Hey804 works over SMS — any phone, no internet.

**12% of residents** speak a language other than English at home. Hey804 translates on the fly — Spanish, French, Vietnamese, any language.

**January 2025 water crisis**: the city took 10+ hours to communicate a boil-water advisory. Hey804's broadcast system reaches every opted-in resident simultaneously — SMS, web, and widget.

**65-75% of 311 calls** are the same questions about taxes, benefits, and utilities. Hey804 answers them instantly so 311 agents can focus on complex cases.

---

## What it covers

**42 verified intents** built from the official RVA311 service catalog (84 of 89 service URLs carried over directly from the API):

| Category | Examples |
|----------|----------|
| **Finance** | Tax payment, senior relief, car tax, parking tickets |
| **Benefits** | SNAP, Medicaid, rent help, childcare, heating assistance |
| **Utilities** | Bill payment, water safety, billing disputes |
| **City Services** | Trash, permits, voter registration, vital records |
| **Infrastructure** | Potholes, sinkholes, streetlights, sewer, stormwater, trees, code violations |
| **Safety** | 911 emergencies, DV/abuse hotlines, police redirects, shelter assistance |

5 suspended/discontinued programs intentionally excluded so residents never land on a dead form.

---

## Accuracy

| What we tested | Result |
|---|---|
| Correct intent matching (42 intents, 374 sample queries) | **100%** |
| Department routing (pothole vs sinkhole, sewer vs stormwater, etc.) | **97%** |
| Edge cases (dual intent, sarcasm, typos, Spanish, vague queries) | **97% citizen trust** |
| Off-topic queries ("what's the weather", "is the mayor doing a good job") | **100% honest fallback** |
| Emergency detection (gas leak, shooting, DV, child abuse) | **100% immediate routing** |

**Zero cases of sending a citizen to the wrong department in 77 stress-test queries.**

When uncertain, the system shows contextual options ("Did you mean: Is the water safe? / Can't pay my water bill?") or says "That's not something I can help with." It never guesses confidently and gets it wrong.

---

## Surfaces

| Surface | How it works | Who it serves |
|---------|-------------|---------------|
| **Web widget** | One `<script>` tag on any site | Partner orgs, city pages, community centers |
| **SMS** | Text a question, get an answer | Residents without broadband (14K households) |
| **Web app** | Browse by category | Desktop users, library kiosks |
| **QR posters** | Scan at a library or city office | Walk-in residents |
| **Emergency broadcast** | One click → all subscribers | City staff during crises |

**Embed on any website:**
```html
<script src="https://hey804-production.up.railway.app/widget.js" data-partner="your-org"></script>
```

*SMS is fully functional for demo/testing. Public availability pending Twilio A2P 10DLC registration.*

---

## Hard constraints met

From the [challenge document](https://github.com/hack4rva/pillar-thriving-city-hall/blob/main/CHALLENGE.md):

| Constraint | How we handle it |
|---|---|
| "Integrate with existing systems, don't replace them" | Links to rva311.com forms and rva.gov pages. Doesn't modify either. |
| "Rely only on verified City data — no invented answers" | Every answer from curated KB. AI only classifies, never generates facts. |
| "Decline confident responses when information is uncertain" | Vague → contextual options. Off-topic → "I can't help with that." Never a wrong confident answer. |
| "Avoid claiming official City status" | Widget says "Your Richmond Navigator" not "Official City Service" |
| "Post-2018 RVA311 data has no public API; do not depend on it" | We use the service catalog (what services exist), not request data (who submitted what) |

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | FastAPI (Python) | Async, one file deploys, quick iteration |
| SMS | Twilio | Webhook-based, works on any phone |
| AI | Anthropic Claude Sonnet | Classification only — never writes answers |
| Translation | Google Translate API | Any language, on the fly |
| Database | SQLite (WAL) | Zero config, handles concurrent reads |
| Frontend | Vanilla JS, Shadow DOM | No framework, embeddable anywhere |
| Deploy | Railway (Docker) | Auto-deploy from GitHub |

---

## Quick start

```bash
git clone https://github.com/tmishra-sp/hey804.git
cd hey804
cp .env.example .env    # Add your Twilio, Anthropic, and Google API keys
pip install -r requirements.txt
uvicorn server.main:app --reload --port 8000
```

Open `http://localhost:8000/widget-demo.html` to try the widget.

```bash
# Run the test suite
python3 -m scripts.test_all_intents
# 439/439 tests passing
```

---

## The ask

**Pilot 5 library branches. 90 days. One metric: do avoidable 311 calls decrease?**

The widget embeds with one line of code. The knowledge base updates in one JSON file. No IT migration. No staff training. Just better routing from day one.

---

## Architecture

```
server/
  services/
    engine.py               # Priority layers → hybrid matching → _finalize() for translation
    intent_matcher.py       # 684 keywords, word-boundary matching, confidence gap detection
    response_formatter.py   # SMS (< 1000 chars) vs web (full detail)
    safety.py               # PII redaction, citation validation
    language.py             # Detect + translate (Google API)
  data/
    knowledge_base.json     # 42 intents, curated answers, 84 rva311.com URLs
    data-311.json           # Raw service catalog from RVA311 API
  routers/
    chat.py                 # POST /api/chat
    sms.py                  # Twilio webhook
    broadcast.py            # Emergency alerts
web/
  widget.js                 # Embeddable widget (Shadow DOM, voice input, smart fallback)
scripts/
  test_all_intents.py       # 439 automated tests
```

---

Built for **Hack for RVA 2026** | **Pillar 1: A Thriving City Hall**

*"How might we use technology to help Richmond residents quickly determine the right next step when interacting with City services — so that issues are routed correctly the first time?"*

MIT License
