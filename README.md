# Hey804

**Instant city service navigation for Richmond, VA residents — via text, web, or any partner site.**

Richmond's 311 system handles 163,000+ calls per year. 65-75% are people asking the same questions: *How do I pay my tax bill? Where do I apply for SNAP? Is the water safe?* Hey804 gives them answers in seconds — no hold time, no wrong transfers, no broadband required.

[Live Demo](https://hey804-production.up.railway.app) | [Widget Demo](https://hey804-production.up.railway.app/widget-demo.html)

---

## How It Works

One knowledge base. One engine. Four surfaces.

```
  SMS (Twilio)    Web App    Widget Embed    QR Codes
       |             |            |              |
       +-------------+------------+--------------+
                      |
               POST /api/chat
                      |
         +------------+------------+
         |            |            |
    Intent        Response      Safety
    Matcher       Formatter     Rails
   (keyword       (SMS vs       (PII
    scoring)       web)        redaction)
         |            |            |
         +------------+------------+
                      |
              Knowledge Base
             (30 curated intents)
```

**Text "I can't pay my tax bill" to the Twilio number** and get back the payment plan phone number, steps, deadlines, and source links — in under 5 seconds.

**Scan a QR poster at a library** and get location-aware help on your phone — no app download needed.

**Embed the widget on any partner site** with one line:
```html
<script src="https://hey804-production.up.railway.app/widget.js" data-partner="your-org"></script>
```

---

## Surfaces

| Surface | How | Use Case |
|---------|-----|----------|
| **SMS** | Text the Twilio number | Any phone, no internet needed |
| **Web App** | Browse categories at hey804 | Desktop, mobile, library kiosks |
| **Widget** | One-line embed on partner sites | Nonprofits, community orgs |
| **QR Codes** | Scan a poster, get context-aware help | Libraries, city offices |
| **Admin** | Broadcast alerts + view stats | City staff, emergency comms |

---

## What It Covers

30 curated intents across 5 categories, sourced from real RVA 311 call patterns:

- **Finance** — tax payment plans, senior/disabled relief, car tax, parking tickets, assessment appeals
- **Social Services** — SNAP, Medicaid, rent/eviction help, childcare, heating assistance, benefits status
- **Utilities** — bill assistance, water safety, billing disputes
- **City Services** — 311, trash pickup, business licenses, permits, voter registration, school enrollment
- **Emergency** — alert signup, emergency contacts, towed vehicles, legal aid

Every answer includes action steps, deadlines, official source URLs, and a handoff to RVA 311 when needed.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python 3.11) |
| SMS | Twilio webhooks |
| LLM Fallback | Anthropic Claude (for unmatched queries) |
| Database | SQLite with WAL mode |
| Frontend | Vanilla JS (web app + widget) |
| Widget | Shadow DOM, voice input via Web Speech API |
| Deploy | Docker on Railway |

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
    engine.py               # Core orchestrator — language detection, routing
    intent_matcher.py       # Keyword scoring with typo/abbreviation handling
    response_formatter.py   # Channel-aware output (SMS vs web)
    safety.py               # PII redaction, citation validation
  data/
    knowledge_base.json     # 30 intents with answers, steps, sources
web/
  index.html                # Main web app
  app.js                    # Card-based UI with category navigation
  widget.js                 # Embeddable widget (Shadow DOM, voice input)
  admin.html                # Stats dashboard + broadcast trigger
  style.css                 # Responsive styles
posters/
  generate_qr.py            # QR code generator with location context
  poster_template.html      # Printable poster template
```

**Design decisions:**
- **Keyword matching over RAG** — 30 curated intents don't need vector search. Keyword scoring is faster, deterministic, and requires zero infrastructure.
- **Channel-aware formatting** — SMS gets 2 sentences + 4 steps. Web gets the full response. Same engine, different output.
- **Safety-first** — PII is redacted before storage. Every phone number and URL in responses is validated against the knowledge base. When confidence is low, we route to 311 instead of guessing.

---

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/hey804.git
cd hey804

# Environment
cp .env.example .env
# Fill in your Twilio + Anthropic keys

# Install
pip install -r requirements.txt

# Run
uvicorn server.main:app --reload --port 8000
```

Open `http://localhost:8000` for the web app, or `http://localhost:8000/widget-demo.html` to see the embeddable widget.

---

## API

### `POST /api/chat`

```json
{
  "message": "I can't pay my tax bill",
  "channel": "web",
  "context": { "partner": "southside-community-center" }
}
```

Returns action steps, answer, deadlines, sources, and handoff info.

### `POST /api/sms/incoming`

Twilio webhook — receives SMS, responds via TwiML.

### `POST /api/broadcast`

Emergency alert push to all opted-in subscribers. Requires `Authorization: Bearer <ADMIN_TOKEN>`.

---

## Hackathon Context

Built for **Hack for RVA 2026** (March 27-29) under **Pillar 1: A Thriving City Hall** — helping residents navigate city services with plain-language answers.

Addresses Mayor Danny Avula's Mayoral Action Plan goal of white-glove service delivery and equitable access to city resources.

---

## License

MIT
