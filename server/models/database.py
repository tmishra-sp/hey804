"""
SQLite database setup with WAL mode for concurrent reads.
"""
from __future__ import annotations

import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "hey804.db"


def get_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            language TEXT DEFAULT 'en',
            opted_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_message_at TIMESTAMP,
            message_count INTEGER DEFAULT 0,
            opted_out INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            direction TEXT NOT NULL,
            message_text TEXT NOT NULL,
            intent_matched TEXT,
            confidence REAL,
            channel TEXT DEFAULT 'sms',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS broadcasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_en TEXT NOT NULL,
            message_es TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            recipient_count INTEGER,
            broadcast_type TEXT
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_en TEXT NOT NULL,
            message_es TEXT,
            alert_type TEXT DEFAULT 'emergency',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_subs_phone ON subscribers(phone_number);
        CREATE INDEX IF NOT EXISTS idx_convos_phone ON conversations(phone_number);
        CREATE INDEX IF NOT EXISTS idx_convos_time ON conversations(created_at);
        CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
    """)
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")


def upsert_subscriber(phone: str, language: str = "en") -> bool:
    """
    Insert or update subscriber. Returns True if this is a NEW subscriber
    (first message ever), False if existing.
    """
    conn = get_db()
    try:
        cursor = conn.execute("SELECT id, opted_out FROM subscribers WHERE phone_number = ?", (phone,))
        row = cursor.fetchone()

        if row is None:
            conn.execute(
                "INSERT INTO subscribers (phone_number, language, last_message_at, message_count) VALUES (?, ?, CURRENT_TIMESTAMP, 1)",
                (phone, language),
            )
            conn.commit()
            return True
        else:
            # Re-opt-in if they were opted out and texted again
            conn.execute(
                "UPDATE subscribers SET last_message_at = CURRENT_TIMESTAMP, message_count = message_count + 1, opted_out = 0, language = ? WHERE phone_number = ?",
                (language, phone),
            )
            conn.commit()
            return False
    finally:
        conn.close()


def opt_out_subscriber(phone: str):
    conn = get_db()
    conn.execute("UPDATE subscribers SET opted_out = 1 WHERE phone_number = ?", (phone,))
    conn.commit()
    conn.close()


def log_conversation(phone: str, direction: str, message: str, intent: str | None = None, confidence: float | None = None, channel: str = "sms"):
    conn = get_db()
    conn.execute(
        "INSERT INTO conversations (phone_number, direction, message_text, intent_matched, confidence, channel) VALUES (?, ?, ?, ?, ?, ?)",
        (phone, direction, message, intent, confidence, channel),
    )
    conn.commit()
    conn.close()


def create_alert(message_en: str, message_es: str | None = None, alert_type: str = "emergency") -> int:
    conn = get_db()
    # Deactivate previous alerts
    conn.execute("UPDATE alerts SET is_active = 0 WHERE is_active = 1")
    cursor = conn.execute(
        "INSERT INTO alerts (message_en, message_es, alert_type) VALUES (?, ?, ?)",
        (message_en, message_es, alert_type),
    )
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id


def get_active_alert() -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT id, message_en, message_es, alert_type, created_at FROM alerts WHERE is_active = 1 ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    if row is None:
        return None
    return {"id": row["id"], "message": row["message_en"], "message_es": row["message_es"], "alert_type": row["alert_type"], "created_at": row["created_at"]}


def get_opted_in_subscribers() -> list:
    conn = get_db()
    rows = conn.execute("SELECT phone_number, language FROM subscribers WHERE opted_out = 0").fetchall()
    conn.close()
    return [{"phone": r["phone_number"], "language": r["language"]} for r in rows]


def get_stats() -> dict:
    conn = get_db()
    subs = conn.execute("SELECT COUNT(*) as c FROM subscribers WHERE opted_out = 0").fetchone()["c"]
    convos = conn.execute("SELECT COUNT(*) as c FROM conversations").fetchone()["c"]
    top_intents_rows = conn.execute(
        "SELECT intent_matched, COUNT(*) as c FROM conversations WHERE intent_matched IS NOT NULL AND direction='inbound' GROUP BY intent_matched ORDER BY c DESC LIMIT 5"
    ).fetchall()
    conn.close()
    return {
        "total_subscribers": subs,
        "total_conversations": convos,
        "top_intents": {r["intent_matched"]: r["c"] for r in top_intents_rows},
    }
