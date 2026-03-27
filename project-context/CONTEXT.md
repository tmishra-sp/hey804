# CONTEXT.md — Hey804

## ALWAYS READ THIS FILE BEFORE WRITING CODE OR MAKING DECISIONS.

This file contains the complete context for the Hey804 project: the research, the demo strategy, the user behavior, all the data sources, the hackathon rules, and the political landscape. If you're about to make an architecture decision, check this file first. If you're about to write a response template, check this file first. If you're about to pick a library, check this file first.

---

## 1. The product in two sentences

A single text line that turns Richmond's most stressful government interactions — benefits, taxes, bills, "what do I do next" — into an instant action plan on any phone, sourced from real city data. The same channel that helps you navigate a tax bill on Tuesday sends you a boil water advisory in your language on Saturday.

### The platform concept

Hey804 is civic information infrastructure — not an app. One API, one knowledge base, one citation chain, multiple surfaces: SMS, a card-based web app, an embeddable widget any partner can add with one line of code, and QR posters that open location-aware help. When crisis hits, every surface lights up simultaneously with the same alert. Build the engine once, plug it in everywhere.

---

## 2. The hackathon

### Event: Hack for RVA
- **Dates:** March 27-29, 2026 (Friday-Sunday)
- **Location:** VCU School of Business, 301 W Main St, Richmond, VA 23284
- **Format:** Friday kickoff with Mayor's remarks → Saturday all-day hacking (submissions due 5pm) → Sunday top 5 present to Mayor
- **Website:** https://rvahacks.org
- **One-pager:** https://rvahacks.org/team-pages/one-pager.html
- **Hosted by:** City of Richmond, AI Ready RVA, Plan RVA, VCU School of Business

### Awards (total pool: $14,500+)
- **Mayor's Choice Award:** $5,000 — selected by committee, presented by Mayor Avula
- **Moonshot Award:** $2,500 — selected by public vote
- **7 MAP Pillar Prizes:** $1,000 each — one outstanding team per pillar

### The 7 pillars (tracks) — Mayor Avula's Mayoral Action Plan (MAP)
1. **City Hall that gets things done** — operations, 311, billing, trust
2. **Neighborhoods that meet housing needs** — housing, affordability, unhoused
3. **Families where every child can succeed** — pre-K, schools, child support
4. **An economy that leaves no one behind** — jobs, wealth building, small business
5. **Inclusive communities where everyone's rights are protected** — rights, equity, LGBTQ+
6. **A sustainable built environment** — infrastructure, climate, transit
7. **Storytelling that heals** — history, arts, Shockoe, reckoning

Each track has a 3-person judging committee: civic leader, nonprofit rep, for-profit rep. Ranked-choice voting.

### Judging realities (what actually wins)
- Best tech alone won't win. Judges want solutions grounded in lived experience that can be adopted without heroic effort.
- Assign to one pillar (we recommend #4 Economy) but touch 2-3 others in narrative.
- Bias toward measurable operational impact — judges are city leaders who think in budget and trust.
- Solutions are owned by City of Richmond.

### Hey804 hits these pillars:
- **Pillar 1 (City Hall):** Reduces 311 call volume, improves service delivery
- **Pillar 3 (Families):** Navigates childcare, SNAP, Medicaid for families
- **Pillar 4 (Economy):** PRIMARY TRACK — economic support navigation for residents and small businesses
- **Pillar 5 (Inclusive):** Multilingual, SMS-first for low-broadband, accessible

---

## 3. Richmond — the numbers that matter

### Population and demographics (Census ACS 2020-2024)
- Population: 233,655
- Households: 104,321
- Households with a computer: 94.4%
- Households with broadband: 86.2% → **~14,000 households lack broadband**
- Language other than English at home (age 5+): 12.1%

Source: https://www.census.gov/quickfacts/fact/table/richmondcityvirginia/PST045224

### The digital divide is not evenly distributed
- City Council approved a "Digital Equity Implementation Plan" declaring high-speed internet a public necessity
- Census tract near Mosby/Upper Shockoe: 66.2% of households without broadband, 47.7% without smartphone
- Census tract near Mary Munford: only 4.2% without broadband
- Source: Richmond Free Press (Sept 2024), Axios Richmond (Aug 2024)

### RVA 311 — the user research dataset
- 2024: 163,000+ calls (~13,500/month, 600-1,000/day)
- **65-75% of call-center calls are Social Services or Finance inquiries**
- Supported 83,000+ requests across 20+ city agencies
- Added callback feature in 2024 (evidence of hold-time pain at scale)
- Sources: https://www.rva.gov/citizen-service-and-response/about-rva-311

### What this means for the product
The highest-impact civic AI in Richmond is NOT a pothole detector. It's a money-and-benefits navigation system. Build for the person on hold at 311 trying to figure out how to pay their tax bill or apply for SNAP.

---

## 4. The water crisis — the emotional backbone of the pitch

### What happened
- January 6, 2025: blizzard causes power outage at Richmond's 100-year-old water treatment plant
- Plant was operating in "Winter mode" — single power source as cost-saving measure
- Switchgear failed (hadn't been replaced in 20 years, 3 bids for upgrade since 2016 — never completed)
- Backup generators never activated (not connected in Winter mode)
- SCADA system crashed → valves didn't close → basement flooded → destroyed electrical equipment
- 230,000+ people affected across Richmond, Henrico, Hanover, Goochland
- Boil water advisory: Jan 6-11 (5 days)
- Schools closed for a week, hundreds of businesses shuttered, General Assembly session delayed

### The communication failure (THIS IS OUR PITCH ANGLE)
- Power outage at 5:50 AM. City didn't alert residents until 4:30 PM — **over 10 hours later**
- Mayor's office didn't know severity until 1 PM briefing
- Henrico was told "generators activated" (they weren't — misinformation)
- Hanover wasn't notified for 8+ hours
- RVA 311 was giving OUTDATED information — "relying on unofficial sources"
- City relied on Instagram for updates (not accessible to all)
- Showers were set up at churches but the city never told the public
- Staff didn't know how to use Richmond Ready Alerts

### It happened AGAIN
- May 27, 2025: filter clog → boil water advisory for parts of city
- April 23, 2025: fluoride pump installation → 5-hour fluoride spike

### VDH verdict
"The water crisis was completely avoidable and should not have happened."
"Culture of complacency" — officials normalized broken systems.
$63 million+ in needed infrastructure improvements identified.

### Sources
- https://rva.gov/mayors-office/2025-water-crisis
- https://en.wikipedia.org/wiki/Timeline_of_the_January_2025_Richmond_water_crisis
- https://www.vdh.virginia.gov/news/richmond-water-plant-response/
- https://www.wtvr.com/news/local-news/richmond-water-crisis-report-june-12-2025
- https://www.wric.com/news/local-news/richmond/water-crisis-emergency-response-assessment/
- https://www.axios.com/local/richmond/2025/01/13/richmond-water-crisis-timeline

### How to use in the pitch
DO: Frame as "the water crisis showed why information infrastructure is as critical as physical infrastructure. Hey804 is that information infrastructure."
DON'T: Frame as "the city failed." Avula walked into this crisis on day 6. He ordered the reviews, fired the DPU director, pushed for transparency. Let him be the hero.

---

## 5. Mayor Danny Avula — know your audience

- Took office January 2025 (literally days before the water crisis)
- Background: public health expert, led Richmond-Henrico Health District during COVID
- Moved to Church Hill in 2004 — community-oriented, equity-focused
- Released 25-page Mayoral Action Plan (MAP) in October 2025
- Key emphasis: transparency, accountability, measurable metrics, public dashboard
- The MAP is the organizing framework for the hackathon
- He will hear the top 5 pitches on Sunday and select Mayor's Choice Award

### What Avula cares about (based on MAP and public statements)
- "Real progress happens when we're clear about what we're trying to achieve"
- Fixing City Hall operations (billing accuracy, 311 improvement, employee training)
- Digital equity and broadband access
- Equitable access to city services regardless of language or technology access
- Measurable outcomes with a public dashboard

### His water crisis quote pattern
He's been transparent about inheriting the problem and committed to fixing it. Don't embarrass him — empower him.

Source: https://rva.gov/press-releases-and-announcements/news/mayor-danny-avula-launches-mayoral-action-plan-map

---

## 6. Demo strategy — the 3-minute pitch

### The platform concept (say this in your head before walking on stage)

Hey804 is NOT a chatbot. It's civic information infrastructure. One brain that answers the same way whether you text it, tap a card on a website, scan a QR code at the library, or use a widget on a nonprofit's page. And when crisis hits, it pushes alerts to every surface at once.

### The winning moments (plural — you have three)

**Moment 1:** A judge texts the SMS number from their own phone. It buzzes back in 3-5 seconds. No other team will do this.

**Moment 2:** You hold up a QR poster. A judge scans it. Same brain, location-aware web UI opens. They realize it's the same system on a different surface.

**Moment 3:** The broadcast flip. Every phone that texted AND every web user gets a simultaneous emergency alert. "January 6th. Minutes, not 12 hours."

### Pitch flow (timed)

**0:00 — The hook (30 sec)**
"January 6th, 2025. 230,000 people lost water. The city didn't send an alert until 4:30 PM. But the number that shocked us: 311 handled 163,000 calls last year. 65-75% were people trying to figure out money, benefits, and bills. That's not a pothole problem — that's a survival problem."

**0:30 — The product (30 sec)**
"Hey804 is civic information infrastructure. Text a number — get an action plan. Scan a QR code at the library — same answer. Any nonprofit can add it to their website with one line of code — same answer. Real phone numbers, real deadlines, sourced from rva.gov. Same brain, every surface."

**1:00 — Live demo: SMS (20 sec)**
"The number is on the screen. Text it. Try 'I got a tax bill I can't pay.'"
Wait. Judge's phone buzzes.

**1:20 — Live demo: QR flip (20 sec)**
Hold up the printed QR poster. "This took 5 minutes to make. Scan it."
Judge scans → location-aware web app opens. Same answer, different surface.

**1:40 — Live demo: broadcast (20 sec)**
"Everyone who interacted? They're now reachable. Watch."
Click broadcast. All phones + web get: "BOIL WATER ADVISORY — nearest water: [address]. Reply 1 for Spanish."

**2:00 — The platform vision (20 sec)**
"This isn't an app. It's infrastructure. One script tag and any partner's site has it. Same engine serves SMS, web, widget, QR. When crisis hits, every surface lights up."

**2:20 — The numbers (20 sec)**
"86% broadband means 14% don't. SMS covers them. 12% speak another language. We handle that. 20 question types. Every answer sourced. $100/month to run."

**2:40 — The ask (10 sec)**
"Pilot through 5 libraries for 90 days. Measure: did avoidable calls drop?"

**2:50 — The close (10 sec)**
"163,000 calls. Most are people trying to keep their lights on. They shouldn't need to wait on hold. Thank you."

### What to demo live vs. mention in pitch vs. save for Q&A

| Show live | Mention in pitch | Save for Q&A only |
|-----------|-----------------|-------------------|
| SMS text → response | Widget embed (show the script tag) | Spanish translation |
| QR scan → location-aware web | WhatsApp/Messenger as future | RAG architecture |
| Broadcast to all phones | Staff copilot concept | Privacy implementation |
| Card-based web (briefly) | 200+ intent expansion | Cost breakdown |

### Demo risks and mitigations
- **Bad cell signal at VCU:** Teammate on WiFi showing incoming text as backup
- **QR won't scan:** Have the URL typed in a browser as backup
- **Twilio delay:** Pre-test at VCU lobby Saturday evening
- **Unknown question:** Honest "I don't know" + 311 handoff (not embarrassing)
- **Server crash:** Twilio Studio backup with static responses
- **300 people text at once:** Keyword path handles 80% with zero API calls

---

## 7. Top 10 judge questions and answers

**Q: How do you prevent hallucinations?**
A: We only answer from an approved source corpus plus deterministic rules. If confidence is low, we say "I don't know" and generate a script for calling 311. Hallucination is worse than no answer.

**Q: How do you handle privacy?**
A: We follow the city's own posture — no PII exposed publicly, sensitive requests treated as private, minimal retention, option for anonymous use.

**Q: How is this inclusive?**
A: SMS-first (works on any phone), multilingual, designed for accessibility. WCAG AA aligned with the city's stated direction.

**Q: Won't this replace 311 jobs?**
A: No — it reduces avoidable calls. Staff spend less time on "what are my options" and more on complex cases where humans matter.

**Q: How do you measure impact?**
A: Deflection rate (resolved without handoff), time-to-first-action, and in pilot: handle-time changes on targeted intents.

**Q: What's your adoption plan?**
A: Libraries and community hubs — the city already points people there for internet access. We're adding a text line.

**Q: What does this cost to run?**
A: Twilio at $0.0079/message. 1,000 conversations/month = under $100/month. The city currently spends staff hours on 13,000 calls/month.

**Q: What about residents without smartphones?**
A: SMS works on any phone that can text. Plus library kiosks.

**Q: How does this relate to digital equity?**
A: The city is actively pursuing broadband strategy. Hey804 is an immediate, low-cost layer that works today while infrastructure catches up.

**Q: What's your long-term standard?**
A: Open311-style interoperability patterns used by cities like Boston.

---

## 8. Official data sources — the canonical URL list

### ALWAYS cite these. NEVER invent data.

**Finance / Tax**
- Real estate taxes: https://www.rva.gov/finance/real-estate
- Delinquent collections: https://www.rva.gov/finance/delinquent-collections
- OAPD tax relief: https://www.rva.gov/finance/oapd-relief
- Finance assistance (car tax, PPTRA): https://www.rva.gov/finance/assistance
- Online payments: https://www.rva.gov/online-payments
- Finance dept payments: https://www.rva.gov/finance/online-payment

**Utilities**
- DPU billing (MetroCare, PromisePay, payment options): https://www.rva.gov/public-utilities/billing
- DPU FAQ: https://www.rva.gov/PublicUtilities/FAQ
- Water crisis page: https://rva.gov/mayors-office/2025-water-crisis
- DPU account lookup: https://apps.richmondgov.com/applications/DPUAccountLookUp

**Social Services / Benefits**
- Richmond Social Services main: https://www.rva.gov/social-services/social-services-main
- Virginia CommonHelp (apply for SNAP, Medicaid, TANF, energy): https://commonhelp.virginia.gov/
- SNAP details: https://www.dss.virginia.gov/benefit/snap.cgi
- Medicaid application: https://coverva.dmas.virginia.gov/apply/how-to-apply/
- Virginia DSS benefits overview: https://www.dss.virginia.gov/benefit/

**City Services**
- RVA 311 about: https://www.rva.gov/citizen-service-and-response/about-rva-311
- RVA 311 helpful numbers: https://rva.gov/citizen-service-and-response/rva-311-helpful-numbers
- Community resources (libraries): https://www.rva.gov/mayors-office/community-resources
- Were here to help: https://www.rva.gov/common/were-here-help
- Open data portal: https://www.rva.gov/information-technology/open-data-portal
- Accessibility statement: https://rva.gov/Accessibility

**Hackathon / MAP**
- Hack for RVA: https://rvahacks.org
- One-pager: https://rvahacks.org/team-pages/one-pager.html
- MAP launch press release: https://rva.gov/press-releases-and-announcements/news/mayor-danny-avula-launches-mayoral-action-plan-map
- MAP PDF: https://rva.gov/sites/default/files/2025-10/2025-MAP-Oct15_F.pdf

**Census / Demographics**
- Richmond QuickFacts: https://www.census.gov/quickfacts/fact/table/richmondcityvirginia/PST045224

---

## 9. Key phone numbers (verified March 2026)

These are the ONLY phone numbers the system should ever include in responses:

| Number | Service | Hours |
|--------|---------|-------|
| 804-646-7000 (or dial 311) | RVA 311 — city services | Mon-Fri 8am-7pm, Sat 9am-1pm |
| 804-646-4646 | DPU — water/gas/utility billing | Business hours |
| 804-646-7046 | Social Services — LIHEAP/energy | Business hours |
| 804-646-7405 | Social Services — general | Business hours |
| 888-832-3858 | Social Services — after hours emergency | After hours |
| 855-635-4370 | Virginia Enterprise Customer Service (CommonHelp) | Business hours |
| 804-646-7223 | Richmond Public Library | Varies by branch |
| 866-534-5243 | Virginia Legal Aid | Business hours |
| 211 (or 2-1-1) | Virginia 211 — referrals | 24/7 |

**NEVER output a phone number that is not in this list or in the knowledge base. NEVER.**

---

## 10. User behavior — how real people will text

### They won't type "apply_snap_food." They'll type:

```
"I need food stamps"
"how do i get snap"
"cant afford groceries"
"my kids are hungry"
"lost my job need food help"
"EBT card how"
"food assistance richmond"
"donde puedo obtener ayuda con comida"
```

### Patterns to expect:
- **Typos and abbreviations:** "tx bill" = tax bill, "govt" = government, "ss office" = social services
- **Emotional framing:** "I'm scared I'll lose my house" = tax delinquency
- **Multiple needs in one message:** "Need help with rent AND food stamps" → answer the first, offer to help with the second
- **Follow-up questions:** "What documents do I need?" → if the KB entry has action steps about docs, surface those
- **PII in messages:** "My SSN is 123-45-6789 and I need help" → answer the question, DO NOT echo the SSN
- **Abusive/test messages:** "You suck" / "are you a robot" → respond kindly or with fallback, never combatively
- **STOP/HELP/CANCEL:** Handle per Twilio compliance requirements
- **Just "hi" or "hello":** Respond with: "Hi! I'm Hey804 — I help Richmond residents navigate city services. What do you need help with? You can ask about taxes, benefits, utility bills, or text HELP for options."

### Response tone
- **Clear, not bureaucratic.** Say "you can" not "residents may." Say "call this number" not "contact the relevant department."
- **Action-first.** Lead with what to DO, not background information.
- **Honest about limits.** "I'm not sure about that — here's who can help" is better than a guess.
- **Respectful of stress.** These people are often in crisis. Don't be chirpy. Be steady and helpful.
- **Short.** SMS is not the place for paragraphs. 4-6 lines max for the main answer, then numbered steps.

---

## 11. Competitive landscape (mention in pitch if asked)

- **Boston 311:** Multi-channel (phone, app, Twitter), Open311 support, measurable channel shift. Mature pattern. We can align with Open311 standards.
- **NYC 311:** Largest municipal 311 system. Has chatbot but primarily for routing, not action plans.
- **Other hackathon teams:** Will likely build chatbots, dashboards, or data visualizations. Our differentiator: it works on a judge's phone RIGHT NOW. SMS-first, dual-use (help + alerts), real data, and a working demo.

---

## 12. Technical constraints to remember

- **Twilio free trial:** 1 msg/sec rate limit, trial watermark on messages ("Sent from a Twilio trial account"). Upgrade to paid ($20) to remove.
- **Anthropic API:** Rate limits vary by plan. For hackathon, request capacity if needed. Always have keyword-only fallback.
- **VCU WiFi:** May require authentication. Bring a mobile hotspot as backup for the demo.
- **SQLite concurrent writes:** Use WAL mode. One writer at a time is fine for our scale.
- **SMS character encoding:** UTF-8 supported but non-GSM characters (emoji, special chars) reduce segment size from 160 to 70 chars. Avoid emoji in programmatic messages.

---

## 13. What "done" looks like on Sunday morning

Before walking on stage, verify:

**SMS (the must-have)**
- [ ] Text from a new phone → response in <5 seconds
- [ ] "I got a tax bill I can't pay" → correct response with 804-646-7000
- [ ] "food stamps" → correct response with CommonHelp URL
- [ ] "STOP" → opt-out confirmation, no future messages
- [ ] Gibberish → fallback with 311, not a hallucination
- [ ] Spanish message → response in Spanish

**Web app (the backup + demo surface)**
- [ ] Card-based entry screen loads on mobile in <2 seconds
- [ ] Tap "Money & taxes" → sub-topics appear
- [ ] Tap a sub-topic → action plan card with source link
- [ ] "Ask anything" free-text → same engine, same answers
- [ ] URL with `?location=southside` → location-aware greeting

**Widget + QR (the pitch multipliers)**
- [ ] `widget.js` loads on a test HTML page → compact Hey804 appears
- [ ] QR code for "southside" scans → web app opens with context
- [ ] 3 QR posters printed and ready for Sunday

**Broadcast (the emotional moment)**
- [ ] Trigger broadcast → all SMS subscribers receive message
- [ ] Web app shows alert banner when broadcast is active
- [ ] Broadcast completes in <30 seconds for all recipients

**Data integrity (the credibility)**
- [ ] All phone numbers in responses match the verified list in section 9
- [ ] All URLs in responses resolve with 200 status
- [ ] No response contains a phone number or URL not in the knowledge base

---

## 14. Post-hackathon vision (for pitch deck only — don't build)

**Platform expansion (3 months)**
- 50+ intent types covering all 311 request categories
- WhatsApp + Facebook Messenger as additional surfaces
- Voice channel via Twilio Voice with ASR
- Library kiosk mode (full-screen, large buttons, auto-timeout)
- Partner analytics: "Your widget helped 23 residents this week"
- Appointment scheduling hooks ("request a 311 callback")

**City integration (6 months)**
- QR codes at every library branch, bus shelter, social services office
- Integration with city's forthcoming MAP tracking dashboard
- "Questions we couldn't answer" feed → guides city content improvement
- Open311-style API for interoperability with other cities

**Scale (12 months)**
- Multi-city template: package for other cities with 311 systems
- Community partner self-service: orgs sign up, get a widget, see their own analytics
- Proactive outreach: "Your tax bill is due in 14 days. Need help?" based on calendar triggers

---

## 15. One more thing — the emotional truth

This project isn't about AI. It's about a grandmother who got a tax bill she can't pay and doesn't know what to do. It's about a family that just lost their SNAP benefits and doesn't know they can reapply online in 10 minutes. It's about the 230,000 people who lost water and didn't find out for 12 hours.

Build for them. Not for the judges. Not for the tech. For the person who needs the answer most and has the fewest resources to find it.

If you build for that person, the judges will see it.
