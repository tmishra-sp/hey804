# Hey804

**Instant city service navigation for Richmond, VA residents — via text, web, or any partner site.**

Richmond's 311 system handles 163,000+ calls per year. Most are people trying to find the right department: *How do I report a sinkhole? Where do I apply for SNAP? Is the water safe?* Hey804 routes them to the exact right form, phone number, and department — in seconds.

[Live Demo](https://hey804-production.up.railway.app) | [Widget Demo](https://hey804-production.up.railway.app/widget-demo.html) | [SMS: 804-808-1083](sms:8048081083)

---

## The Problem

Residents arrive at rva.gov or RVA311 with genuine needs but lack clarity about departmental responsibilities. The city's architecture prioritizes departments over citizens, leading to:

- **Misdirected submissions** — a sinkhole report goes to the pothole form (wrong department, wrong urgency)
- **Staff redirects** — 311 agents spend time re-routing instead of resolving
- **Abandoned requests** — residents give up navigating 14 service groups and 89 sub-services

## The Solution

Hey804 is a **routing engine, not a chatbot**. Citizens describe their issue in plain language. The engine classifies it to the correct department and links them to the exact RVA311 request form. Every phone number, URL, and deadline comes from verified city sources — never AI-generated.

```
Citizen: "there's a sinkhole on my street"

Hey804:  → Department of Public Utilities (not Public Works)
         → Response time: 12 hours (not 14 days like a pothole)
         → [Report Sinkhole at rva311.com ↗] (direct link to correct form)
         → Emergency: call 804-646-4646 press 1
```

---

## How It Works

```
  SMS (Twilio)    Web App    Widget Embed    QR Codes
       |             |            |              |
       +-------------+------------+--------------+
                      |
               POST /api/chat
                      |
    ┌─────────────────┼─────────────────┐
    │           Priority Layers          │
    │  Emergency → Crisis → Redirect     │
    │  (911)      (DV/abuse)  (police)   │
    └─────────────────┼─────────────────┘
                      |
    ┌─────────────────┼─────────────────┐
    │        Hybrid Classification       │
    │  Keywords (instant, 70% of queries)│
    │  + LLM (ambiguous 30%, ~1.2s)     │
    │  Response ALWAYS from curated KB   │
    └─────────────────┼─────────────────┘
                      |
              Knowledge Base
           (42 intents, 84 rva311.com
            URLs from official 311 API)
```

**Why hybrid?** Keywords handle obvious queries instantly ("report a pothole" → pothole form). The LLM handles ambiguous language ("water is leaking from the street" — is that stormwater, sewer, or a billing issue?). But the LLM only *classifies* which intent to use — it never writes the answer. Every fact comes from the curated knowledge base.

---

## Key Features

### Correct Department Routing
Pothole → Public Works (14-day repair). Sinkhole → Public Utilities (12-hour emergency response). Different departments, different urgency, different phone numbers. The system distinguishes them based on RVA311's own service definitions.

### Emergency & Crisis Priority
"Gas leak in my building" → **Call 911 immediately** (before any intent matching runs). "Domestic violence help" → National DV Hotline 1-800-799-7233. These override everything else.

### Honest When Unsure
Vague queries ("water") show contextual options: "Did you mean: Is the water safe to drink? / Can't pay my water bill? / My water bill is too high." Off-topic queries ("what's the weather") get an honest "That's not something I can help with" — never a wrong answer.

### Multilingual
Input is detected and translated via Google Translate API. Responses are translated back. Tested with Spanish, French, German — works with any language Google supports.

### Every Answer Cited
Every response includes the source URL (rva.gov, rva311.com) so citizens and city staff can verify. No invented information.

---

## Surfaces

| Surface | How | Use Case |
|---------|-----|----------|
| **SMS** | Text 804-808-1083 | Any phone, no internet needed |
| **Web App** | Browse at hey804-production.up.railway.app | Desktop, mobile, library kiosks |
| **Widget** | One-line embed on partner sites | Nonprofits, community orgs, city pages |
| **QR Codes** | Scan a poster, get context-aware help | Libraries, city offices |
| **Admin** | Broadcast alerts + view stats | City staff, emergency comms |

**Embed the widget on any site:**
```html
<script src="https://hey804-production.up.railway.app/widget.js" data-partner="your-org"></script>
```

---

## Coverage

42 intents across 6 categories, sourced from RVA311 service catalog (84 of 89 service URLs carried over):

- **Finance** — tax payment/lookup, senior/disabled relief, car tax, parking tickets, assessment appeals
- **Social Services** — SNAP, Medicaid, rent/eviction help, childcare, heating assistance, school enrollment, legal aid, senior services
- **Utilities** — bill payment & assistance, water safety, billing disputes
- **City Services** — trash/recycling, business licenses, permits, voter registration, jury duty, vital records
- **Infrastructure** — potholes, sinkholes, sidewalks, streetlights, traffic signals, trees, parks, stormwater, sewer, code enforcement, dumping/graffiti, pest control, parking
- **Safety** — emergency (911), crisis (DV, suicide, elder/child abuse, homelessness), redirects (police, Dominion Energy, DMV, plumber)

5 suspended/discontinued programs intentionally excluded to prevent dead links.

---

## Accuracy

Tested with 439 automated tests + 77 edge-case stress tests:

| Test | Result |
|------|--------|
| Core intent matching (42 intents) | 42/42 (100%) |
| Sample question round-trip (374 queries) | 374/374 (100%) |
| Adversarial/colloquial tests | 20/20 (100%) |
| Department routing (based on 311 DO-NOT-USE rules) | 35/36 (97%) |
| Judge stress test (dual intent, sarcasm, typos, Spanish, edge cases) | 75/77 (97%) citizen trust |
| Off-topic rejection | 100% — never sends off-topic queries to wrong department |

### Hard Constraints Met
- Integrates with existing systems (rva311.com, rva.gov) — doesn't replace them
- Relies only on verified city data — no invented answers
- Declines confident responses when uncertain — shows options or says "I'm not sure"
- Does not claim official City status or authority
- Does not depend on post-2018 RVA311 request data (uses service catalog only)

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Backend | FastAPI (Python) | Async, fast prototyping |
| SMS | Twilio | Industry standard, webhook-based |
| LLM | Anthropic Claude Sonnet | Classification only — never generates answers |
| Translation | Google Translate API | Any language, on the fly |
| Database | SQLite (WAL mode) | Zero config, ships in one file |
| Frontend | Vanilla JS | No framework, embeddable anywhere |
| Widget | Shadow DOM + Web Speech API | Style isolation, voice input |
| Deploy | Docker on Railway | One-click deploy, auto-deploy from GitHub |

---

## Architecture

```
server/
  config.py                 # Environment + path config
  main.py                   # FastAPI app, middleware, rate limiting
  models/
    database.py             # SQLite schema, subscriber/conversation CRUD
  routers/
    chat.py                 # POST /api/chat (web, widget, QR)
    sms.py                  # POST /api/sms/incoming (Twilio webhook)
    broadcast.py            # POST /api/broadcast (emergency alerts)
  services/
    engine.py               # Core orchestrator — priority layers, hybrid matching, _finalize()
    intent_matcher.py       # Keyword scoring with word-boundary matching, stop words, 684 boost keywords
    response_formatter.py   # Channel-aware output (SMS vs web)
    safety.py               # PII redaction, citation validation, URL corruption prevention
    language.py             # Google Translate: detect + translate
  data/
    knowledge_base.json     # 42 intents with answers, steps, sources, deadlines, handoff triggers
    data-311.json           # Raw RVA311 service catalog (89 services, 14 groups)
web/
  index.html                # Main web app
  app.js                    # Card-based UI with 7 category cards
  widget.js                 # Embeddable widget (Shadow DOM, voice, smart fallback)
  widget-demo.html          # Widget sandbox on mock rva.gov page
  admin.html                # Stats dashboard + broadcast trigger
scripts/
  test_all_intents.py       # 439-test suite (Tier 0/A/B/C)
  get-311-service-links.py  # Fetch RVA311 service catalog from API
```

### Design Decisions

- **Hybrid keyword + LLM over pure RAG** — Keywords handle the obvious 70% instantly. LLM catches the ambiguous 30%. When keywords tie (e.g., "water" matches 7 intents), the system detects the tie and defers to LLM. Response always comes from curated KB.
- **Priority layers before intent matching** — Emergency (911), crisis (DV/suicide/abuse hotlines), and redirect (police/DMV/Dominion) patterns run first as regex. Instant, no API call, no false classification.
- **Source reranking** — "sinkhole" shows the Sinkhole form. "sidewalk" shows the Sidewalk form. Same intent, different primary action based on what the citizen typed.
- **Single `_finalize()` exit** — Every response flows through one method. Translation, logging, and any future post-processing hooks in one place.

---

## Quick Start

```bash
git clone https://github.com/tmishra-sp/hey804.git
cd hey804
cp .env.example .env    # Fill in Twilio, Anthropic, and Google Translate keys
pip install -r requirements.txt
uvicorn server.main:app --reload --port 8000
```

Open `http://localhost:8000` for the web app, or `http://localhost:8000/widget-demo.html` for the widget.

### Run Tests
```bash
python3 -m scripts.test_all_intents
```

---

## API

### `POST /api/chat`

```json
{
  "message": "there's a sinkhole on my street",
  "channel": "web",
  "context": { "partner": "southside-community-center" }
}
```

Returns: `answer`, `action_steps`, `deadlines`, `sources`, `department`, `confidence`, `related`, `handoff_message`.

### `POST /api/sms/incoming`
Twilio webhook — receives SMS, responds via TwiML.

### `POST /api/broadcast`
Emergency alert push to all opted-in subscribers. Requires `Authorization: Bearer <ADMIN_TOKEN>`.

---

## Team

Built for **Hack for RVA 2026** (March 27-29) | **Pillar 1: A Thriving City Hall**

Addresses the challenge: *"How might we use technology to help Richmond residents quickly determine the right next step when interacting with City services — so that issues are routed correctly the first time?"*

---

## License

MIT
