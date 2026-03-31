import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
KB_PATH = Path(__file__).resolve().parent / "data" / "knowledge_base.json"

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

# LLM
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "8"))

# Google API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
