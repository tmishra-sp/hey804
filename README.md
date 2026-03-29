# Hey804

### One front door to City Hall.

Richmond's 311 gets 163,000 calls a year. Most are people trying to keep their lights on, feed their kids, or fix their street. They shouldn't have to navigate 14 departments and 89 forms to get help.

**Hey804 routes residents to the exact right city service — in seconds, in any language, on any phone.** Trust starts when people can actually get answers from their own government.

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

## Why this matters for Richmond

**14,000 households** in Richmond lack broadband. Hey804 works over SMS — any phone, no internet.

**12% of residents** speak a language other than English at home. Hey804 translates on the fly — Spanish, French, Vietnamese, any language.

**January 2025 water crisis**: the city took 10+ hours to communicate a boil-water advisory. Hey804 already answers "Is the water safe to drink?" instantly — the infrastructure to push alerts to opted-in residents is a natural next step.

**65-75% of 311 calls** are the same questions about taxes, benefits, and utilities. Hey804 answers them instantly so 311 agents can focus on complex cases.

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

## Why it can't hallucinate facts

Most AI civic tools generate answers. Hey804 doesn't. The LLM is behind a wall — it can only point to an answer, never write one.

```
                    "I can't pay my water bill"
                                |
  ┌─────────────────────────────┼──────────────────────────────┐
  │   THE AI SIDE               ▼      (classification only)   │
  │                                                             │
  │    ┌─────────────┐     ┌──────────────┐                    │
  │    │   Keywords   │────▶│  LLM verify   │                    │
  │    │   (1,099)    │     │              │                    │
  │    └─────────────┘     └──────┬───────┘                    │
  │                               │                             │
  │   LLM can ONLY output:       │                             │
  │     • YES / NO                │  It cannot write sentences. │
  │     • "utility_bill_help"     │  It cannot invent facts.    │
  │     • NONE                    │  It can only pick a label.  │
  │                               │                             │
  ╞═══════════════════════════════╪═════════════════════════════╡
  │ ░░░░░░░░░░░░░░░ THE WALL ░░░░╪░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  ╞═══════════════════════════════╪═════════════════════════════╡
  │                               │                             │
  │   THE RESIDENT SIDE           │  Only a label               │
  │   (curated facts only)        │  crosses this wall.         │
  │                               ▼                             │
  │   ┌──────────────────────────────────────────────────┐     │
  │   │  Pre-written answer from knowledge base:          │     │
  │   │                                                   │     │
  │   │  "You have options. DPU offers MetroCare          │     │
  │   │   (up to 40% discount) and PromisePay             │     │
  │   │   (payment plans)."                               │     │
  │   │                                                   │     │
  │   │  Phone:    804-646-4646            <- verified     │     │
  │   │  URL:      rva.gov/public-utilities <- rva.gov    │     │
  │   │  Deadline: Before disconnection    <- from KB     │     │
  │   └──────────────────────────────────────────────────┘     │
  │                                                             │
  │   Every phone, URL, and fact was verified by a human.      │
  └─────────────────────────────────────────────────────────────┘
```

**What this means in practice:**

| Resident types | LLM output (hidden) | Resident sees |
|---|---|---|
| "I can't pay my tax bill" | `"tax_bill_help"` | Payment plans, 804-646-7000, rva.gov link |
| "agua no es segura" | `YES` (verified match) | Water safety info — in Spanish |
| "my kids are hungry" | `"apply_snap_food"` | SNAP application steps, CommonHelp link |
| "what's the weather" | `NONE` | "That's not something I can help with." + 311 handoff |

The AI decides *which* answer. A human decided *what* the answer says. The AI can pick the wrong answer — but it can never invent a wrong phone number, a fake URL, or a program that doesn't exist.

---

## What it covers

**42 verified intents** across 79 source URLs, built from the official RVA311 service catalog (52 rva311.com service links + 19 rva.gov pages + 8 state/federal resources):

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

**447 automated tests** across four tiers:

```
Tier 0 ──  42 intents, one representative query each     ── intent + phone + URL + length
Tier A ── 382 sample questions round-tripped against KB   ── every sample hits its own intent
Tier B ──  20 adversarial queries (typos, slang, emotion) ── "tx bill", "my kids are hungry"
Tier C ──   3 fallback tests (gibberish, greetings)       ── must NOT match a wrong intent
```

| What we tested | Result |
|---|---|
| Correct intent matching (42 intents, 382 sample queries) | **100%** |
| Department routing (pothole vs sinkhole, sewer vs stormwater, etc.) | **97%** |
| Adversarial inputs (typos, abbreviations, emotional phrasing, Spanish) | **100%** |
| Off-topic queries ("what's the weather", "is the mayor doing a good job") | **100% honest fallback** |
| Emergency detection (gas leak, shooting, DV, child abuse) | **100% immediate routing** |
| Phone number safety (every number in every response verified) | **100%** |
| URL safety (every link in every response exists in KB) | **100%** |

When uncertain, the system shows contextual options ("Did you mean: Is the water safe? / Can't pay my water bill?") or says "That's not something I can help with." It never guesses confidently and gets it wrong.

---

## Who this reaches

Richmond's digital divide is not evenly distributed. One census tract near Mosby Court: 66% without broadband, 48% without a smartphone. Hey804 was designed from the ground up for the residents with the fewest resources and the most at stake.

```
  No broadband?       →  SMS works on any phone. No internet needed.
  No smartphone?      →  Plain text. No app. No download.
  No English?         →  Detects language, responds in kind.
  No account?         →  Anonymous by default. Just text or scan.
  No tech confidence? →  Tap a card, don't type a question.
  No time?            →  Answer in seconds, not a phone tree.
  Crisis?             →  Detects emergencies, routes to 911/hotlines instantly.
```

No login. No download. No chatbot. No Wi-Fi required. No literacy assumed.

Every surface — SMS, web, widget, QR — hits the same engine. A resident texting from a prepaid flip phone gets the same verified answer as someone browsing on a laptop at the library.

---

## Surfaces

| Surface | How it works | Who it serves |
|---------|-------------|---------------|
| **Web widget** | One `<script>` tag on any site | Partner orgs, city pages, community centers |
| **SMS** | Text a question, get an answer | Residents without broadband (14K households) |
| **Web app** | Browse by category | Desktop users, library kiosks |
| **QR posters** | Scan at a library or city office | Walk-in residents |

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

## The ask

**Pilot 5 library branches. 90 days. One metric: do avoidable 311 calls decrease?**

```
  What it takes                          What it doesn't take
  ─────────────────────────────────────  ─────────────────────────────
  One <script> tag on a partner site     No IT migration
  One JSON file to update answers        No staff training
  QR posters printed at any office       No app for residents to install
  One person to review analytics         No new city infrastructure
                                         No vendor lock-in — fully open source
```

Platform-agnostic. Works on any phone, any browser, any partner's website. The knowledge base updates in one file. This could go live Monday.

---

## What the city learns

Hey804 isn't just a tool for residents. Every question is a signal.

By capturing what Richmonders actually ask — in their own words — the city gets real-time insight into what residents need, where they get stuck, and what information is missing. Over time, that data improves content on rva.gov, reduces repeat calls to 311, and helps city leaders prioritize what to fix first.

When a crisis hits, Hey804 is already on the front line — answering "Is the water safe to drink?" with accurate, timely, trusted data before 311 picks up the phone.

---

## Tech stack

Built for a weekend hackathon. Designed so every layer can swap into your environment.

| Layer | Hackathon | Swaps to |
|-------|-----------|----------|
| Backend | FastAPI (Python) | Azure Functions, AWS Lambda, any async framework |
| SMS | Twilio | Azure Communication Services, AWS Pinpoint, any SMS gateway |
| AI | Anthropic Claude Sonnet | Azure OpenAI, AWS Bedrock, Google Vertex — only needs to say YES/NO or pick from a list |
| Translation | Google Translate API | Azure Translator, AWS Translate, DeepL |
| Database | SQLite (WAL) | PostgreSQL, CosmosDB, AWS RDS — any SQL store |
| Frontend | Vanilla JS, Shadow DOM | Any framework — zero dependencies by design |
| Hosting | Railway (Docker) | Azure App Service, AWS ECS, GCP Cloud Run — standard container |

The knowledge base is a single JSON file. The engine is pure Python with no framework coupling. Swap any layer without touching the others.

---

## Architecture

```
server/
  services/
    engine.py               # Priority layers → hybrid matching → _finalize() for translation
    intent_matcher.py       # 1,099 keywords, word-boundary matching, confidence gap detection
    response_formatter.py   # SMS (< 1000 chars) vs web (full detail)
    safety.py               # PII redaction, citation validation
    language.py             # Detect + translate (Google API)
  data/
    knowledge_base.json     # 42 intents, curated answers, 79 verified source URLs
    data-311.json           # Raw service catalog from RVA311 API
  routers/
    chat.py                 # POST /api/chat
    sms.py                  # Twilio webhook
web/
  widget.js                 # Embeddable widget (Shadow DOM, voice input, smart fallback)
scripts/
  test_all_intents.py       # 447 automated tests across 4 tiers
```

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
# 447/447 tests passing
```

---

## Future state

Hey804 already tracks opted-in SMS subscribers. A natural extension is integrating with the city's existing emergency broadcast infrastructure — so the same system that answers "Is the water safe?" can push a boil-water advisory to every subscriber simultaneously across SMS, web, and widget. The plumbing for this exists in the codebase; it would need to be coordinated with the city's communications team before going live.

---

Built for **Hack for RVA 2026** | **Pillar 1: A Thriving City Hall**

*"How might we use technology to help Richmond residents quickly determine the right next step when interacting with City services — so that issues are routed correctly the first time?"*

**Hey804 navigates the bureaucracy so you don't have to.**

MIT License
