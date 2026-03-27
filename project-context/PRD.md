# RVA Hey804 — Product Requirements Document

## Read CONTEXT.md first. Always. Before writing any code, read CONTEXT.md for the full background on why this exists, who the users are, what the demo looks like, and what every data source is.

---

## 1. What this is (in two sentences)

A single text line that turns Richmond's most stressful government interactions — benefits, taxes, bills, "what do I do next" — into an instant action plan on any phone, sourced from real city data. The same channel that helps you navigate a tax bill on Tuesday sends you a boil water advisory in your language on Saturday.

---

## 2. Why this exists

Richmond's RVA 311 handled 163,000+ calls in 2024. 65-75% of call-center calls were Social Services or Finance inquiries — people trying to figure out how to pay a tax bill, apply for SNAP, get utility assistance, or avoid losing their house. This is not a pothole problem. This is a survival navigation problem.

14% of Richmond households (~14,000) lack broadband. 12.1% speak a language other than English at home. The city's website uses Google Translate as a band-aid and explicitly says it doesn't replace professional translation.

Hey804 exists because the people with the least bandwidth, the least time, and the most stress should not have to wait on hold to figure out their next step.

---

## 3. What we're building for the hackathon (48 hours — scope is sacred)

### The platform concept: one engine, every surface

Hey804 is NOT a chatbot. It is a **civic information API** with a brain. Every surface — SMS, web, embeddable widget, QR poster — hits the same `POST /api/chat` endpoint with the same knowledge base, the same safety rails, and the same citation chain. The engine doesn't care how you got there.

This is the pitch multiplier. Instead of "we built a chatbot," you say: "We built civic information infrastructure. Any partner in Richmond can plug into it."

### In scope (MUST ship by Saturday 5pm)

**Core engine (the brain)**
1. **Unified API** — single `POST /api/chat` endpoint serving all surfaces
2. **Knowledge base** of 20 curated intents covering the top 311 call types
3. **Intent matcher** — keyword scoring + LLM fallback + safety rails
4. **Channel-aware response formatting** — same answer, shaped for SMS vs web vs widget

**Surfaces (the plugs)**
5. **SMS** via Twilio — text the number, get an answer. THE demo moment.
6. **Card-based web app** — NOT a chatbot with bubbles. Tappable topic cards → narrowing → action plan card. Works on old phones, low bandwidth, library kiosks. Accessible without typing.
7. **Embeddable widget** — `<script src="hey804.js"></script>` — one line of code, any partner site gets Hey804. It's an iframe with a `?partner=` param. Trivial to build, huge in the pitch.
8. **QR code posters** — generated URLs with baked-in context (`?location=southside&topic=benefits`). Scan at the Southside office → Hey804 already knows where you are. "Looks like you're at Hull Street. Are you here for benefits or tax help?"

**Dual-use (the killer feature)**
9. **Emergency broadcast** — one-click push to ALL opted-in subscribers across ALL surfaces (SMS push + web notification + widget alert banner)
10. **Admin dashboard** — broadcast trigger + subscriber count + conversation log + stats

### Out of scope (do NOT build)
- Voice/IVR
- WhatsApp / Facebook Messenger (mention in pitch as future surface)
- Native mobile app
- Staff copilot (mention in pitch, don't build)
- Deep integrations with city systems
- User accounts or authentication
- Payment processing
- Actual eligibility determinations (we screen, we don't decide)

---

## 4. Architecture

### High-level system diagram

```
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ SMS      │  │ Web App  │  │ Widget   │  │ QR Code  │
    │ (Twilio) │  │ (React)  │  │ (iframe) │  │ (URL)    │
    └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘
          │             │             │              │
          │    ┌────────▼─────────────▼──────────────▼┐
          │    │                                      │
          └───►│   Unified API: POST /api/chat        │
               │   {message, channel, context,        │
               │    language, session_id}              │
               │                                      │
               │  ┌────────────────────────────────┐  │
               │  │ Hey804 Engine            │  │
               │  │                                │  │
               │  │  Intent Matcher (keyword+LLM)  │  │
               │  │  Response Generator            │  │
               │  │  Channel Formatter (SMS/web)   │  │
               │  │  Context Handler (QR/widget)   │  │
               │  │  Safety Rails (PII + citation) │  │
               │  └────────────────────────────────┘  │
               │                                      │
               │  ┌──────────┐  ┌───────────────┐    │
               │  │ KB (JSON)│  │ Subscribers   │    │
               │  │ 20 intents│  │ (SQLite)      │    │
               │  └──────────┘  └───────┬───────┘    │
               │                        │            │
               │  ┌─────────────────────▼──────────┐ │
               │  │ Broadcast Engine               │ │
               │  │ Push to SMS + web + widget      │ │
               │  └────────────────────────────────┘ │
               └─────────────────────────────────────┘
```

### The unified API contract

Every surface hits the SAME endpoint. The only difference is the `channel` and `context` fields:

```
POST /api/chat
{
  "message": "I can't pay my tax bill",     // user's text (or selected card ID)
  "channel": "sms|web|widget|qr",           // how they got here
  "context": {                               // optional, from QR/widget
    "location": "southside",                 // baked into QR URL
    "topic": "benefits",                     // pre-selected topic
    "partner": "salvation_army",             // which org embedded the widget
    "referrer": "https://partner-site.org"   // where the widget lives
  },
  "language": "en",                          // detected or explicit
  "session_id": "uuid"                       // for web/widget conversation continuity
}
```

The engine uses `context` to personalize: if `location=southside`, prepend "You're near the Southside office at 4100 Hull Street." If `partner=library`, adjust tone for kiosk usage. If `topic=benefits`, skip the "what do you need help with?" and go straight to benefits intents.

SMS doesn't send `context` (it's just a text message), but the engine handles that gracefully — it just asks what they need.

### Tech stack decisions (and why)

| Component | Choice | Why |
|-----------|--------|-----|
| Backend | **FastAPI (Python)** | Team knows Python. Async for concurrent SMS. Quick to prototype. |
| SMS | **Twilio** | Industry standard. Webhook-based. $0.0079/msg. Free trial has enough credits for demo. |
| LLM | **Anthropic Claude Sonnet** | Sponsor alignment (AI Ready RVA). Best instruction-following for grounded answers. |
| Database | **SQLite** | Zero config. Handles 300 concurrent reads fine. Ship in one file. |
| Web UI | **React (Vite)** | Fast to scaffold. Can embed in single page for demo. |
| Hosting | **Railway / Render / Fly.io** | One-click deploy from Git. Free tier works for demo. HTTPS included. |
| Admin | **Simple React page behind basic auth** | Just needs broadcast button + log viewer. |

### Why NOT a vector database / full RAG

For 20 curated intents, keyword matching + LLM fallback is faster, more reliable, and zero-config. A vector DB adds complexity (embedding pipeline, similarity threshold tuning, chunk management) with zero demo benefit. The LLM handles fuzzy matching as fallback. If a query doesn't match keywords AND the LLM can't classify it, we give an honest "I don't know" with a 311 handoff. That's better than a hallucinated RAG answer.

Add a vector store post-hackathon when scaling to 200+ intents.

---

## 5. Data architecture

### 5.1 Knowledge Base (the brain)

File: `knowledge_base.json`

This is the single source of truth. Every answer the system gives comes from this file. It is NOT auto-generated. Every entry was manually curated from official city sources and verified.

```json
{
  "meta": {
    "version": "0.1",
    "last_updated": "2026-03-24",
    "fallback_message": "I don't have a confident answer for that yet. Here's what I'd suggest: Call RVA 311 at 804-646-7000 (Mon-Fri 8am-7pm, Sat 9am-1pm) or submit a request at rva311.com. Want me to help you prepare what to say when you call?"
  },
  "questions": [
    {
      "id": 1,
      "category": "finance|utilities|social_services|city_services|emergency",
      "intent": "snake_case_intent_name",
      "sample_questions": ["array of 3-5 natural phrasings"],
      "answer": "Grounded answer with real data. Every phone number, URL, deadline, and eligibility criterion is from an official source.",
      "action_steps": ["Numbered, actionable steps"],
      "deadlines": "Specific dates if applicable, null if not",
      "sources": [
        {
          "title": "Page title",
          "url": "https://exact.url.from.rva.gov"
        }
      ],
      "handoff_trigger": "Condition under which to stop answering and route to human. Null if always safe to answer."
    }
  ]
}
```

### 5.2 The 20 intents (by category and priority)

**FINANCE (5) — highest 311 volume**
| ID | Intent | Sample question | Key data |
|----|--------|-----------------|----------|
| 1 | `tax_bill_cant_pay` | "I got a tax bill I can't pay" | Payment plans via 311, delinquent collections process |
| 2 | `senior_disabled_tax_relief` | "I'm a senior, can I get tax relief?" | OAPD program, Sept 30 deadline, expanded Freeze |
| 3 | `real_estate_tax_wrong` | "My tax bill seems wrong" | Assessment appeal vs billing error distinction |
| 4 | `personal_property_tax_car` | "How do I pay my car tax?" | PPTRA, mileage reassessment forms |
| 18 | `pay_parking_ticket` | "How to pay a parking ticket" | Online portal, contesting instructions |

**UTILITIES (3) — second highest volume**
| ID | Intent | Sample question | Key data |
|----|--------|-----------------|----------|
| 5 | `utility_bill_cant_pay` | "Can't pay my water bill" | MetroCare ($1,500/yr), PromisePay, LIHEAP |
| 6 | `water_safety` | "Is the water safe?" | Current advisory status, Richmond Ready Alerts |
| 7 | `utility_bill_wrong` | "My bill doubled for no reason" | DPU account lookup, dispute process |

**SOCIAL SERVICES (7) — most complex, highest stress**
| ID | Intent | Sample question | Key data |
|----|--------|-----------------|----------|
| 8 | `apply_snap_food` | "How do I get food stamps?" | CommonHelp, 855-635-4370, Southside office |
| 9 | `apply_medicaid` | "Need health insurance" | CommonHelp, CoverVA, FAMIS for kids |
| 10 | `rent_help` | "About to be evicted" | 211, Legal Aid 866-534-5243, emergency 888-832-3858 |
| 11 | `benefits_status_check` | "Is my application approved?" | CommonHelp login, SNAP 30-day / Medicaid 45-day windows |
| 12 | `where_to_go_in_person` | "Where's the welfare office?" | 300 E Franklin (downtown), 4100 Hull St (southside) |
| 13 | `energy_heating_assistance` | "Can't afford heat" | LIHEAP, EnergyShare, MetroCare for gas |
| 20 | `childcare_help` | "Need help paying for daycare" | Child Care Subsidy, Head Start |

**CITY SERVICES (4)**
| ID | Intent | Sample question | Key data |
|----|--------|-----------------|----------|
| 14 | `report_pothole_streetlight` | "Pothole on my street" | RVA311 app, call, or web |
| 15 | `trash_recycling` | "Missed trash pickup" | 311 for makeup, bulk pickup request |
| 16 | `business_license` | "Need a business license" | BPOL, RVA Business Portal |
| 17 | `free_internet_computer` | "Where's free WiFi?" | Library locations, 804-646-7223 |

**EMERGENCY (1) — critical for dual-use pitch**
| ID | Intent | Sample question | Key data |
|----|--------|-----------------|----------|
| 19 | `emergency_alerts` | "How to get emergency alerts?" | Richmond Ready Alerts signup |

### 5.3 Subscriber store (SQLite)

```sql
CREATE TABLE subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,     -- E.164 format: +18041234567
    language TEXT DEFAULT 'en',            -- ISO 639-1: en, es, etc.
    opted_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    opted_out INTEGER DEFAULT 0           -- respect STOP messages
);

CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL,               -- 'inbound' or 'outbound'
    message_text TEXT NOT NULL,
    intent_matched TEXT,                   -- null if fallback
    confidence REAL,                       -- 0.0-1.0 from matcher
    channel TEXT DEFAULT 'sms',            -- 'sms' or 'web'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_en TEXT NOT NULL,
    message_es TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recipient_count INTEGER,
    broadcast_type TEXT                    -- 'emergency', 'reminder', 'test'
);

CREATE INDEX idx_subs_phone ON subscribers(phone_number);
CREATE INDEX idx_convos_phone ON conversations(phone_number);
CREATE INDEX idx_convos_time ON conversations(created_at);
```

---

## 6. API design

### 6.1 Twilio webhook (inbound SMS)

```
POST /api/sms/incoming
```

Twilio sends form-encoded data. Key fields:
- `From`: sender phone number (E.164)
- `Body`: message text
- `To`: our Twilio number

Response: TwiML XML with our reply. Twilio handles delivery.

**Processing pipeline:**
1. Parse inbound message
2. Check if `Body` is "STOP" → mark opted_out, respond with confirmation, done
3. Check if `Body` is "HELP" → respond with human contact info, done
4. Upsert subscriber (auto opt-in on first message)
5. Detect language (simple heuristic: if message contains common Spanish words → es, else → en)
6. Match intent (keyword scorer → LLM fallback if low confidence)
7. Generate response from KB entry
8. Log conversation
9. Return TwiML response

**Critical: response time budget.** Twilio expects a response within 15 seconds or it retries. The full pipeline must complete in <10s. If using LLM, use streaming and set a 8-second timeout with keyword-only fallback.

### 6.2 Web chat endpoint

```
POST /api/chat
Content-Type: application/json

{
  "message": "I can't pay my tax bill",
  "session_id": "uuid",
  "language": "en"
}

Response:
{
  "answer": "...",
  "action_steps": ["...", "..."],
  "sources": [{"title": "...", "url": "..."}],
  "deadlines": "...",
  "category": "finance",
  "intent": "tax_bill_cant_pay",
  "handoff_available": true,
  "handoff_message": "Call RVA 311 at 804-646-7000"
}
```

### 6.3 Broadcast endpoint (admin only)

```
POST /api/broadcast
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "message_en": "BOIL WATER ADVISORY — Your area is affected. Nearest water distribution point: [address]. Reply ES for Spanish.",
  "message_es": "AVISO DE HERVIR AGUA — Su área está afectada. Punto de distribución más cercano: [dirección]. Responda EN para inglés.",
  "broadcast_type": "emergency"
}

Response:
{
  "broadcast_id": 1,
  "recipients_queued": 47,
  "estimated_delivery_seconds": 12
}
```

**Broadcast rate limiting:** Twilio allows ~1 message/second per number on trial, ~30/second on paid. For 300 people, that's 10 seconds on paid tier. Queue messages through Twilio's Messaging Service for parallel delivery.

### 6.4 Admin stats endpoint

```
GET /api/admin/stats
Authorization: Bearer {ADMIN_TOKEN}

Response:
{
  "total_subscribers": 47,
  "total_conversations": 183,
  "intents_matched": {
    "tax_bill_cant_pay": 34,
    "apply_snap_food": 28,
    ...
  },
  "fallback_rate": 0.12,
  "languages": {"en": 41, "es": 6},
  "avg_response_time_ms": 2340
}
```

---

## 7. Intent matching system

### Layer 1: Keyword scoring (fast, no API call)

```python
def match_intent(message: str) -> tuple[KBEntry | None, float]:
    """
    Score each intent by keyword overlap.
    Returns (best_match, confidence) or (None, 0.0).
    """
```

Each intent has a curated list of high-signal keywords (see knowledge_base.json `sample_questions`). Score = sum of matched keyword lengths. Threshold: score >= 5 to return a match. This handles 70-80% of queries with zero latency.

### Layer 2: LLM classification (when keywords fail)

If keyword score < 5, call Claude Sonnet with a classification prompt:

```
System: You are classifying a Richmond VA resident's message.
Pick the BEST matching intent from this list, or respond "NONE":
[list of 20 intent names]
Respond with ONLY the intent name or "NONE".

User: {message}
```

This adds 1-3 seconds but catches paraphrases, typos, and conversational language that keywords miss.

### Layer 3: LLM response generation (when we have a match)

Once we have a KB entry, optionally use Claude to generate a natural-language response grounded in the KB data:

```
System: You are Hey804, a helpful assistant for Richmond, Virginia residents.

RULES:
- ONLY use information from the provided knowledge base entry.
- NEVER invent phone numbers, URLs, deadlines, or eligibility criteria.
- If a fact is not in the KB entry, do NOT state it. Say "I'm not sure about that specific detail" and route to 311.
- Include specific action steps.
- For SMS: keep under 300 words.
- Always end with an offer for more help or 311 handoff.

KNOWLEDGE BASE ENTRY:
{json.dumps(kb_entry)}

User: {message}
```

### Layer 4: Fallback (when nothing matches)

If keyword score < 5 AND LLM returns "NONE":

```
I don't have a confident answer for that yet. Here's what I'd suggest:
Call RVA 311 at 804-646-7000 (Mon-Fri 8am-7pm, Sat 9am-1pm)
or submit a request at rva311.com.

Want me to help you prepare what to say when you call?
```

This fallback is NOT random. It's a curated message that still provides value (311 hours, number, and an offer to help prep the call).

---

## 8. Data extraction and citation requirements

### CRITICAL RULE: No information is served without a source.

Every answer traces back to an official URL. The system must NEVER generate facts, phone numbers, deadlines, or eligibility criteria that aren't in the knowledge base.

### How to extract and verify data

**Step 1: Scrape official pages**

Use `kb_builder.py` (provided in repo). It has 17 source URLs covering:
- rva.gov/finance/* (tax, payments, delinquent collections, OAPD)
- rva.gov/public-utilities/* (billing, FAQ, water crisis)
- rva.gov/social-services/* (main page, benefits)
- commonhelp.virginia.gov (state benefits portal)
- dss.virginia.gov/benefit/* (SNAP, TANF, energy)
- coverva.dmas.virginia.gov (Medicaid)
- rva.gov/citizen-service-and-response/* (311)

**Step 2: Manual verification**

For each KB entry, one team member must:
1. Open the source URL
2. Confirm the phone number/deadline/URL is still live
3. Check the "last updated" date on the page
4. Add to the sources array with exact URL

**Step 3: Freshness stamp**

Each KB entry has a `last_updated` in meta. The system should display this: "This information was verified on March 27, 2026. For the latest, visit [source URL]."

### What to do when information might be stale

Add to every response: a source link the user can click. If the info is time-sensitive (deadlines, advisory status), add: "Check [url] for the latest or call 311."

---

## 9. SMS-specific requirements

### Message formatting

SMS has a 1600-character limit per segment (Twilio concatenates automatically, but aim for <1000 chars for readability on small screens).

**Format template:**
```
[2-3 sentence answer]

NEXT STEPS:
1. [First action — most important]
2. [Second action]
3. [Third action]
4. [Fourth action if needed]

⏰ [Deadline if applicable]

Source: [shortened URL]

Reply HELP for a person, or ask another question.
```

### Auto opt-in for broadcasts

When a user texts the number for the first time:
1. Upsert into `subscribers` table
2. The FIRST response should include a brief opt-in notice:

```
[normal answer]

---
You'll also get emergency alerts from the City at this number.
Reply STOP anytime to opt out.
```

This is legally required under TCPA for non-transactional messages (emergency alerts). Keep it one line, tacked onto the end.

### STOP/HELP handling

Twilio has built-in STOP word handling, but we should also handle:
- "STOP", "UNSUBSCRIBE", "CANCEL", "QUIT" → mark opted_out, confirm
- "HELP", "INFO" → "Hey804 helps Richmond residents navigate city services. Text your question or call RVA 311 at 804-646-7000."
- "HOLA", "ESPAÑOL", "SPANISH", "ES" → switch language preference to Spanish

### Language detection

Simple heuristic for SMS (don't burn API calls):
```python
SPANISH_INDICATORS = ['hola', 'ayuda', 'necesito', 'como', 'puedo', 'pagar', 'impuestos', 'agua', 'comida', 'español']

def detect_language(text: str) -> str:
    words = text.lower().split()
    spanish_count = sum(1 for w in words if w in SPANISH_INDICATORS)
    if spanish_count >= 2 or text.lower().strip() in ['es', 'español', 'spanish']:
        return 'es'
    return 'en'
```

For Spanish responses: use the LLM to translate the KB answer. Add: "Traducción profesional disponible: llame al 804-646-7000."

---

## 10. Broadcast system

### How it works

1. Admin hits broadcast button (or API endpoint)
2. System queries all subscribers WHERE opted_out = 0
3. Groups by language preference
4. Sends message_en to English subscribers, message_es to Spanish
5. Uses Twilio Messaging Service for parallel delivery
6. Logs broadcast with recipient count

### Rate handling for 300 people

Twilio free trial: 1 msg/second → 300 messages = 5 minutes. Too slow for demo.

**Solutions (pick one):**
- **Option A:** Upgrade to paid Twilio ($20 credit) + Messaging Service → 30 msg/second → 10 seconds
- **Option B:** For demo purposes, pre-register only 5-10 phones. The demo shows the broadcast hitting 5 phones simultaneously. In the pitch, say "scales to 300,000."
- **Option C:** Use Twilio's Notify service for batch sending

**Recommended for hackathon: Option B.** Register team phones + a few volunteers before the pitch. Demo is real but controlled.

### Emergency broadcast message template

```
🚨 BOIL WATER ADVISORY
Your area may be affected. 
Nearest water distribution: [address]
Updates: rva.gov/water-crisis
Reply ES para español
Reply STOP to opt out
```

---

## 11. Surfaces — how each entry point works

### 11.1 SMS (Twilio) — the demo moment

Already detailed in sections 6.1 and 9. This is the primary demo surface. A judge texts the number and their phone buzzes back.

### 11.2 Card-based web app — NOT a chatbot

The web experience must NOT be a chatbot with bubbles. Most civic chatbots feel like talking to a broken FAQ. We're building something different.

**Entry screen:** 4-6 large tappable cards, one per category:
```
┌─────────────────────┐  ┌─────────────────────┐
│  💰 Money & taxes   │  │  🍎 Food & benefits  │
│  Bills, relief,     │  │  SNAP, Medicaid,     │
│  payment plans      │  │  childcare help      │
└─────────────────────┘  └─────────────────────┘
┌─────────────────────┐  ┌─────────────────────┐
│  🏠 Housing & rent  │  │  💧 Utilities        │
│  Rent help, eviction│  │  Water, gas, billing │
│  assistance         │  │  MetroCare           │
└─────────────────────┘  └─────────────────────┘
┌─────────────────────┐  ┌─────────────────────┐
│  🏛️ City services   │  │  💬 Ask anything     │
│  311, trash, permits│  │  Free-text input     │
│  libraries          │  │  for other questions │
└─────────────────────┘  └─────────────────────┘
```

**Tap a card → sub-topics:** e.g. "Money & taxes" shows:
- "I got a tax bill I can't pay"
- "I'm a senior / disabled — tax relief"
- "My bill looks wrong"
- "Car / personal property tax"
- "Parking ticket"

**Tap a sub-topic → action plan card:**
```
┌─────────────────────────────────────────┐
│  Payment plans for tax bills            │
│                                         │
│  You can set up a payment arrangement   │
│  even BEFORE taxes are past due.        │
│                                         │
│  NEXT STEPS                             │
│  1. Call RVA 311: 804-646-7000          │
│  2. Ask for a payment arrangement       │
│  3. If 65+/disabled: ask about OAPD    │
│                                         │
│  ⏰ Due: Jan 14 (1st half),            │
│     Jun 14 (2nd half)                   │
│                                         │
│  📎 Source: rva.gov/finance/real-estate │
│                                         │
│  [Call 311]  [Share this]  [Ask more]   │
└─────────────────────────────────────────┘
```

**Why cards, not chat:**
- Works without typing (accessibility, low literacy, nervousness about what to write)
- Works on old phones and slow connections (no JS chat framework to load)
- Works at a library kiosk where someone might be standing
- Still has a free-text "Ask anything" option for open questions
- Every path leads to the same KB entry + the same citations

**The "Ask anything" card** opens a simple text input that hits the same API. This is the traditional chatbot path, but it's one option among six, not the default.

**Technical implementation:**
- Single-page React app (or plain HTML+JS for speed)
- Mobile-first: 320px minimum, large touch targets (48px+)
- No images except the Richmond city logo (optional)
- Loads in <2 seconds on 3G (inline CSS, minimal JS, no frameworks if possible)
- Progressive: entry cards render instantly, API calls happen on tap
- URL routing: `hey804.app/taxes/cant-pay` → deep links to specific cards
- Share button generates a link to that specific action plan card

### 11.3 Embeddable widget — one line of code

Any community partner adds this to their site:
```html
<script src="https://hey804.app/widget.js" data-partner="salvation-army"></script>
```

**What happens:**
1. A small "Need help with city services?" button appears in the bottom-right corner
2. Click → opens an iframe overlay with the card-based UI
3. The `data-partner` attribute is passed as `context.partner` to the API
4. Conversations are logged with the partner tag (so you can report: "Salvation Army's widget helped 23 residents this week")

**Technical implementation:**
- `widget.js` is a ~2KB script that injects an iframe
- The iframe loads the same web app with `?embed=true&partner=salvation-army`
- In embed mode: no header/footer, compact layout, "Powered by Hey804" footer link
- CSP-safe: no eval, no document.write
- Widget respects `prefers-color-scheme` for dark mode
- Close button returns to the partner's site

**Why this matters for the pitch:**
"Any nonprofit, church, or community org in Richmond can add Hey804 to their website in 30 seconds. We're not asking residents to find us — we're going where they already are."

### 11.4 QR code posters — location-aware entry points

Generate QR codes that encode context into the URL:
```
https://hey804.app/?location=southside&topic=benefits
https://hey804.app/?location=downtown-library&topic=general
https://hey804.app/?location=bus-stop-broad-st&topic=general
```

**What happens when scanned:**
1. Web app opens with context already loaded
2. If `location=southside`: "You're near the Southside office (4100 Hull St). What do you need help with?" + the entry cards are reordered to prioritize benefits (since that's what people go to Southside for)
3. If `topic=benefits`: skip the entry cards, go straight to benefits sub-topics
4. Always offer: "Or text us at [number] and we'll help you there too"

**QR generation (build Saturday morning):**
```python
import qrcode
locations = {
    "southside": {"name": "Southside Office", "address": "4100 Hull St", "default_topic": "benefits"},
    "downtown-library": {"name": "Main Library", "address": "101 E Franklin St", "default_topic": "general"},
    "city-hall": {"name": "City Hall", "address": "900 E Broad St", "default_topic": "taxes"},
}
for slug, info in locations.items():
    url = f"https://hey804.app/?location={slug}"
    img = qrcode.make(url)
    img.save(f"qr_{slug}.png")
```

**For the demo:** Print 3 QR posters on Saturday. Place one on the presentation table. A judge scans it, the web app opens with location context. "We printed this in 5 minutes. Imagine one at every library branch, every bus shelter, every social services waiting room."

### 11.5 How broadcast works across surfaces

When admin triggers a broadcast:

| Surface | How the alert arrives |
|---------|---------------------|
| SMS subscribers | Push text message via Twilio |
| Web app (open) | Alert banner appears at top of page (WebSocket or polling) |
| Widget (open) | Same alert banner in the iframe |
| Widget (closed) | Button pulses red with "Emergency alert" badge |
| QR / not currently connected | They get it next time they interact (stored alert) |

For the hackathon MVP, SMS broadcast is the must-have. Web/widget alert banner is nice-to-have (and easy — just poll `/api/alerts/active` every 30 seconds).

---

## 12. Concurrency and resilience

### 300 people texting at once during demo

**Scenario:** You show the number on screen at VCU School of Business. 200 people text it within 60 seconds.

**Bottlenecks:**
1. **Twilio webhook delivery:** Twilio queues and delivers webhooks reliably. Not a concern.
2. **API server:** FastAPI with uvicorn handles 1000+ req/sec for simple JSON responses. Fine.
3. **LLM API calls:** 200 concurrent calls to Claude = potential rate limit hit.

**Mitigation:**
- **Primary path (keyword match):** No API call needed. Handles 70-80% of messages with <50ms latency. This is the critical path — it must work with zero external dependencies.
- **LLM path:** Queue with max 10 concurrent calls. If queue is full, fall back to keyword-only matching with a note: "I'm getting a lot of questions right now — here's what I found. For more detail, text me again in a minute."
- **SQLite writes:** Use WAL mode (`PRAGMA journal_mode=WAL`) for concurrent reads during writes. One writer at a time is fine — message logging can be async.

**Deploy strategy:**
- Railway/Render: at least 512MB RAM, 1 vCPU
- Set uvicorn workers to 2-4
- Enable connection pooling for SQLite
- Pre-warm the keyword index on startup (it's in-memory)

### What if the server goes down during demo?

Have a Twilio Studio flow as backup. Twilio Studio runs on Twilio's infrastructure and can serve a static response tree independent of your server. Set it up Saturday morning as insurance:
- "I got a tax bill I can't pay" → static response from KB
- "food stamps" → static response from KB
- Default → "We're experiencing high demand. Call RVA 311 at 804-646-7000."

---

## 13. Privacy and safety

### Data minimization
- Store phone numbers (required for SMS delivery)
- Store message text (needed for conversation context)
- Do NOT store names, addresses, SSNs, or account numbers
- If a user sends PII in a message, do NOT echo it back. The response should never repeat SSNs, account numbers, etc.

### Retention
- Conversations: auto-delete after 30 days (in production; for hackathon, keep for demo)
- Subscribers: keep until opt-out, then hard delete
- Broadcasts: keep log indefinitely (audit trail)

### PII detection (simple)

```python
import re

PII_PATTERNS = [
    r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b',  # SSN
    r'\b\d{16}\b',                        # Credit card
    r'\b[A-Z]{1,2}\d{6,10}\b',           # Account numbers
]

def contains_pii(text: str) -> bool:
    return any(re.search(p, text) for p in PII_PATTERNS)
```

If PII detected in inbound message: process normally but do NOT store the raw message. Store a sanitized version: "User sent message containing PII (redacted). Intent: tax_bill_cant_pay."

### Safety rails for LLM responses

The system prompt includes:
1. "ONLY use information from the provided knowledge base entry"
2. "NEVER invent phone numbers, URLs, deadlines, or eligibility criteria"
3. "If uncertain, route to 311"

Additionally, every LLM response is post-processed:
- Check that any phone number in the response exists in the KB entry
- Check that any URL in the response exists in the KB entry
- If a phone number or URL is found that's NOT in the KB, strip it and append the 311 fallback

---

## 14. Testing requirements

### Before demo day (Saturday)

**Functional tests (must pass):**
1. Text "I can't pay my tax bill" → get response with payment plan info + 804-646-7000
2. Text "food stamps" → get response with CommonHelp URL + 855-635-4370
3. Text "Is the water safe" → get response with current status + advisory info
4. Text "STOP" → get opt-out confirmation, no future messages sent
5. Text "asdfkjasldf" (gibberish) → get fallback with 311 number, NOT a hallucinated answer
6. Text in Spanish "Necesito ayuda con mi factura" → get response in Spanish
7. Trigger broadcast → all opted-in numbers receive message within 30 seconds
8. Text from 10 different numbers within 60 seconds → all get responses (concurrency test)

**Source verification (must pass):**
9. Every phone number in the KB matches the live rva.gov page
10. Every URL in the KB resolves (200 status code)
11. Every deadline in the KB matches current official information

### Demo rehearsal (Saturday evening)

Run the exact demo flow 3 times:
1. Text "I got a tax bill I can't pay" from a phone not in the audience
2. Verify response arrives in <5 seconds
3. Trigger emergency broadcast
4. Verify all demo phones receive broadcast simultaneously
5. Time the full sequence: should be under 30 seconds total

---

## 15. File structure

```
hey804/
├── CONTEXT.md              # Background, research, demo strategy (READ FIRST)
├── PRD.md                  # This file
├── knowledge_base.json     # Curated Q&A (the brain)
├── kb_builder.py           # Scraper/chunker for expanding KB
│
├── server/
│   ├── main.py             # FastAPI app entry point
│   ├── config.py           # Environment variables, Twilio creds
│   ├── routers/
│   │   ├── sms.py          # Twilio webhook handler
│   │   ├── chat.py         # Unified chat API (all surfaces use this)
│   │   ├── broadcast.py    # Emergency broadcast API
│   │   ├── admin.py        # Admin stats + dashboard API
│   │   └── alerts.py       # Active alert polling endpoint
│   ├── services/
│   │   ├── engine.py           # THE CORE: intent match + response gen + safety
│   │   ├── intent_matcher.py   # Keyword + LLM matching
│   │   ├── response_gen.py     # Response formatting (SMS vs web vs widget)
│   │   ├── context_handler.py  # Process QR/widget context into personalization
│   │   ├── llm_client.py       # Anthropic API wrapper with timeout
│   │   ├── subscriber.py       # Subscriber CRUD (SMS + web opt-ins)
│   │   ├── broadcast.py        # Broadcast queue + delivery
│   │   └── safety.py           # PII detection + response validation
│   ├── models/
│   │   └── database.py         # SQLite setup + models
│   └── data/
│       └── knowledge_base.json # Symlink or copy
│
├── web/
│   ├── index.html          # Card-based web app (entry cards → sub-topics → action plans)
│   ├── embed.html          # Compact version for iframe widget
│   ├── admin.html          # Admin dashboard
│   ├── style.css           # Mobile-first styles, WCAG AA contrast
│   ├── app.js              # Card navigation + API calls + alert polling
│   └── widget.js           # The ~2KB embed script partners drop on their sites
│
├── posters/
│   ├── generate_qr.py      # Generate QR codes for each location
│   ├── poster_template.html # Printable poster with QR + SMS number
│   └── locations.json       # Location configs (name, address, default topic)
│
├── scripts/
│   ├── setup_twilio.py     # Configure Twilio number + webhook
│   ├── test_sms.py         # Send test messages
│   ├── test_all_surfaces.py # Hit /api/chat from each channel type
│   ├── seed_kb.py          # Load KB into SQLite
│   └── verify_sources.py   # Check all URLs still resolve
│
├── requirements.txt
├── .env.example
├── Dockerfile              # For Railway/Render deploy
└── README.md
```

---

## 16. Environment variables

```bash
# .env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1804XXXXXXX
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_TOKEN=randomly-generated-token-for-admin
DATABASE_URL=sqlite:///data/hey804.db
ENVIRONMENT=production  # or 'development'
LOG_LEVEL=INFO
MAX_LLM_CONCURRENT=10
LLM_TIMEOUT_SECONDS=8
```

---

## 17. Deployment checklist (Saturday morning)

1. [ ] Twilio account created, phone number purchased (804 area code preferred)
2. [ ] Webhook URL configured: `https://your-app.railway.app/api/sms/incoming`
3. [ ] Anthropic API key set
4. [ ] knowledge_base.json verified (run `verify_sources.py`)
5. [ ] SQLite database initialized
6. [ ] Web UI deployed and accessible
7. [ ] Admin dashboard accessible (test broadcast to own phone)
8. [ ] Test 5 different messages from 3 different phones
9. [ ] Verify STOP handling works
10. [ ] Load test: 10 messages in 30 seconds
11. [ ] Bookmark the admin URL on presenter's phone
12. [ ] Screenshot the broadcast working as backup

---

## 18. Build order (what to code first)

### Friday evening (hours 0-6): Core engine + SMS
1. FastAPI skeleton with health endpoint
2. Knowledge base loader
3. Keyword intent matcher
4. `engine.py` — the unified brain (intent match → response gen → format)
5. Channel-aware response formatter (SMS short, web rich)
6. Twilio webhook handler calling the engine
7. **MILESTONE: text the number, get a response. Stop here if behind.**

### Saturday morning (hours 6-12): Reliability + Web
8. SQLite subscriber store + conversation logging
9. LLM fallback classifier + response generator with safety rails
10. PII detection + response validation
11. STOP/HELP/language handling
12. Card-based web app (entry cards → sub-topics → action plan cards)
13. `/api/chat` endpoint serving the web app (same engine as SMS)
14. **MILESTONE: web app works on mobile. Same answers as SMS.**

### Saturday afternoon (hours 12-18): Surfaces + Broadcast
15. Embeddable widget (`widget.js` + `embed.html`)
16. Context handler — process `?location=` and `?partner=` params
17. QR code generator + print 3 demo posters
18. Broadcast endpoint + Twilio Messaging Service
19. Admin dashboard (broadcast button + stats)
20. Alert polling endpoint for web/widget
21. **MILESTONE: full demo flow — SMS + web + widget + QR + broadcast**

### Saturday evening (hours 18-24): Polish + Backup
22. Spanish language support (LLM translation layer)
23. Error handling and edge cases
24. Twilio Studio backup flow (static responses if server dies)
25. Source URL verification (`verify_sources.py`)
26. Deploy to production (Railway/Render)
27. `test_all_surfaces.py` — hit /api/chat from every channel type
28. Demo rehearsal x3 (SMS + web + QR scan + broadcast)
29. Print final QR posters for Sunday

---

## 19. Success metrics (what we show judges)

**On demo day:**
- Time from text to response: <5 seconds
- Accuracy: 20/20 curated intents return correct, sourced answers
- Fallback rate on unknown queries: honest "I don't know" with 311 handoff
- Broadcast delivery: all demo phones receive alert within 10 seconds

**In pitch deck (projected for pilot):**
- Target: 30% reduction in avoidable 311 calls for top 10 intent types
- Target: 80%+ self-serve completion rate (sessions ending without 311 handoff)
- Cost: ~$100/month Twilio + $50/month hosting = $150/month vs. staff hours on 13,000 monthly calls
- Equity: SMS reaches 14,000 households that don't have broadband
