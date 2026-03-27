#!/usr/bin/env python3
"""
RVA Hey804 — Knowledge Base Builder
Scrapes city pages, structures them for RAG, outputs chunked JSON.

USAGE:
  python kb_builder.py                    # Scrape all sources, build KB
  python kb_builder.py --check-freshness  # Flag stale entries
  python kb_builder.py --export-csv       # Export for team review

WHAT THIS DOES (and doesn't do):
  - Fetches official rva.gov and virginia.gov pages
  - Extracts text, strips nav/footer junk
  - Chunks into RAG-friendly segments with metadata
  - Does NOT replace the curated Q&A in knowledge_base.json
  - Supplements it with raw page content for the RAG retriever
"""

import json
import hashlib
import re
from datetime import datetime
from urllib.parse import urljoin
from pathlib import Path

# ── Sources to scrape ────────────────────────────────────────────────
# These are the ~30 pages that cover 90% of what 311 callers ask about.
# Ordered by estimated call volume impact.

SOURCES = [
    # FINANCE / TAX (biggest 311 category)
    {
        "url": "https://www.rva.gov/finance/real-estate",
        "category": "finance",
        "intents": ["real_estate_tax_wrong", "tax_bill_cant_pay"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/finance/delinquent-collections",
        "category": "finance",
        "intents": ["tax_bill_cant_pay"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/finance/oapd-relief",
        "category": "finance",
        "intents": ["senior_disabled_tax_relief"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/finance/assistance",
        "category": "finance",
        "intents": ["personal_property_tax_car", "senior_disabled_tax_relief"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/online-payments",
        "category": "finance",
        "intents": ["pay_parking_ticket", "tax_bill_cant_pay"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/finance/online-payment",
        "category": "finance",
        "intents": ["business_license"],
        "priority": 2,
    },

    # UTILITIES (second biggest)
    {
        "url": "https://www.rva.gov/public-utilities/billing",
        "category": "utilities",
        "intents": ["utility_bill_cant_pay", "utility_bill_wrong"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/PublicUtilities/FAQ",
        "category": "utilities",
        "intents": ["utility_bill_cant_pay", "utility_bill_wrong"],
        "priority": 1,
    },
    {
        "url": "https://rva.gov/mayors-office/2025-water-crisis",
        "category": "utilities",
        "intents": ["water_safety"],
        "priority": 1,
    },

    # SOCIAL SERVICES / BENEFITS
    {
        "url": "https://www.rva.gov/social-services/social-services-main",
        "category": "social_services",
        "intents": ["apply_snap_food", "apply_medicaid", "rent_help", "where_to_go_in_person"],
        "priority": 1,
    },
    {
        "url": "https://commonhelp.virginia.gov/",
        "category": "social_services",
        "intents": ["apply_snap_food", "apply_medicaid", "benefits_status_check", "childcare_help"],
        "priority": 1,
    },
    {
        "url": "https://www.dss.virginia.gov/benefit/snap.cgi",
        "category": "social_services",
        "intents": ["apply_snap_food"],
        "priority": 1,
    },
    {
        "url": "https://coverva.dmas.virginia.gov/apply/how-to-apply/",
        "category": "social_services",
        "intents": ["apply_medicaid"],
        "priority": 1,
    },
    {
        "url": "https://www.dss.virginia.gov/benefit/",
        "category": "social_services",
        "intents": ["apply_snap_food", "energy_heating_assistance", "childcare_help"],
        "priority": 2,
    },

    # CITY SERVICES
    {
        "url": "https://www.rva.gov/citizen-service-and-response/about-rva-311",
        "category": "city_services",
        "intents": ["report_pothole_streetlight", "trash_recycling"],
        "priority": 1,
    },
    {
        "url": "https://www.rva.gov/mayors-office/community-resources",
        "category": "city_services",
        "intents": ["free_internet_computer"],
        "priority": 2,
    },

    # EMERGENCY
    {
        "url": "https://www.rva.gov/common/were-here-help",
        "category": "emergency",
        "intents": ["emergency_alerts"],
        "priority": 1,
    },
]


def chunk_text(text, max_chars=800, overlap=100):
    """Split text into overlapping chunks for RAG retrieval."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) > max_chars and current:
            chunks.append(current.strip())
            # Keep overlap
            words = current.split()
            overlap_text = " ".join(words[-20:]) if len(words) > 20 else ""
            current = overlap_text + " " + sentence
        else:
            current += " " + sentence

    if current.strip():
        chunks.append(current.strip())

    return chunks


def clean_page_text(raw_text):
    """Remove navigation, footer, and boilerplate from scraped text."""
    # Remove common rva.gov boilerplate
    boilerplate_patterns = [
        r"RVA\.gov usa Google Translate.*?3-1-1\.",
        r"City of Richmond\s+900 E Broad St.*?23219",
        r"Skip to main content",
        r"Search\s+Search",
        r"Menu\s+Close",
    ]
    cleaned = raw_text
    for pattern in boilerplate_patterns:
        cleaned = re.sub(pattern, "", cleaned, flags=re.DOTALL | re.IGNORECASE)

    # Collapse whitespace
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    cleaned = re.sub(r' {2,}', ' ', cleaned)
    return cleaned.strip()


def build_chunk_record(chunk_text, source, chunk_index):
    """Create a structured record for one chunk."""
    return {
        "id": hashlib.md5(f"{source['url']}_{chunk_index}".encode()).hexdigest()[:12],
        "text": chunk_text,
        "source_url": source["url"],
        "category": source["category"],
        "intents": source["intents"],
        "priority": source["priority"],
        "scraped_at": datetime.now().isoformat(),
        "char_count": len(chunk_text),
    }


def build_rag_corpus(scraped_pages):
    """
    Takes dict of {url: page_text} and returns list of chunk records.
    This is what your RAG retriever indexes.
    """
    corpus = []
    for source in SOURCES:
        url = source["url"]
        if url not in scraped_pages:
            print(f"  SKIP (not fetched): {url}")
            continue

        raw = scraped_pages[url]
        cleaned = clean_page_text(raw)
        chunks = chunk_text(cleaned)

        for i, chunk in enumerate(chunks):
            record = build_chunk_record(chunk, source, i)
            corpus.append(record)

        print(f"  OK: {url} → {len(chunks)} chunks")

    return corpus


# ── For hackathon: simplified fetch using requests ────────────────
# In the real prototype, you'd use this with aiohttp or scrapy.
# For the hackathon MVP, you can also just manually paste page content.

def fetch_with_requests():
    """
    Fetch all source URLs. Returns {url: text} dict.
    Requires: pip install requests beautifulsoup4
    """
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print("Install deps: pip install requests beautifulsoup4")
        return {}

    pages = {}
    for source in SOURCES:
        url = source["url"]
        try:
            resp = requests.get(url, timeout=15, headers={
                "User-Agent": "RVA-Hey804-Hackathon/0.1 (civic project)"
            })
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove script, style, nav, footer
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            pages[url] = text
            print(f"  FETCHED: {url} ({len(text)} chars)")
        except Exception as e:
            print(f"  FAIL: {url} — {e}")

    return pages


# ── Main ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("RVA Hey804 — Knowledge Base Builder")
    print("=" * 60)

    # Load curated Q&A
    kb_path = Path("knowledge_base.json")
    if kb_path.exists():
        with open(kb_path) as f:
            curated_kb = json.load(f)
        print(f"\nLoaded {len(curated_kb['questions'])} curated Q&A entries")
    else:
        print("\nWARNING: knowledge_base.json not found")
        curated_kb = None

    if "--check-freshness" in sys.argv:
        # Just report which sources need updating
        print("\nSource URLs to verify:")
        for s in SOURCES:
            print(f"  [{s['priority']}] {s['category']:20s} {s['url']}")
        print(f"\nTotal: {len(SOURCES)} sources")
        sys.exit(0)

    if "--export-csv" in sys.argv and curated_kb:
        # Export curated KB for team review
        import csv
        with open("kb_review.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "Category", "Intent", "Sample Question", "Answer Preview", "Source URLs"])
            for q in curated_kb["questions"]:
                writer.writerow([
                    q["id"],
                    q["category"],
                    q["intent"],
                    q["sample_questions"][0],
                    q["answer"][:150] + "...",
                    " | ".join(s["url"] for s in q["sources"])
                ])
        print("Exported to kb_review.csv")
        sys.exit(0)

    # Scrape and build
    print("\nFetching source pages...")
    pages = fetch_with_requests()

    if pages:
        print(f"\nBuilding RAG corpus from {len(pages)} pages...")
        corpus = build_rag_corpus(pages)

        # Save
        output_path = "rag_corpus.json"
        with open(output_path, "w") as f:
            json.dump({
                "meta": {
                    "built_at": datetime.now().isoformat(),
                    "source_count": len(pages),
                    "chunk_count": len(corpus),
                    "builder_version": "0.1-hackathon",
                },
                "chunks": corpus,
            }, f, indent=2)
        print(f"\nSaved {len(corpus)} chunks to {output_path}")

        # Stats
        by_cat = {}
        for c in corpus:
            by_cat[c["category"]] = by_cat.get(c["category"], 0) + 1
        print("\nChunks by category:")
        for cat, count in sorted(by_cat.items()):
            print(f"  {cat}: {count}")
    else:
        print("\nNo pages fetched. You can manually add content to the corpus.")
        print("See SOURCES list in this script for URLs to scrape.")

    print("\n✓ Done.")
