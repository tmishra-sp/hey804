import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
# Check server/data first (deployed), fall back to project-context (local dev)
_kb_deployed = Path(__file__).resolve().parent / "data" / "knowledge_base.json"
_kb_local = BASE_DIR / "project-context" / "knowledge_base.json"
KB_PATH = _kb_deployed if _kb_deployed.exists() else _kb_local

# Twilio
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# Anthropic
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# App
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
PORT = int(os.getenv("PORT", "8000"))

# Admin
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
if not ADMIN_TOKEN and ENVIRONMENT == "production":
    raise ValueError("ADMIN_TOKEN must be set in production")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'hey804.db'}")

# LLM
MAX_LLM_CONCURRENT = int(os.getenv("MAX_LLM_CONCURRENT", "10"))
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "8"))
