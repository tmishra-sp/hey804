"""
Unified chat endpoint — all surfaces (web, widget, QR) hit this.
POST /api/chat
"""

import logging
from typing import Optional, Dict
from fastapi import APIRouter
from pydantic import BaseModel

from server.services.engine import Hey804Engine
from server.config import KB_PATH

logger = logging.getLogger(__name__)

router = APIRouter()

engine = None


def get_engine() -> Hey804Engine:
    global engine
    if engine is None:
        engine = Hey804Engine(KB_PATH)
    return engine


class ChatRequest(BaseModel):
    message: str
    channel: str = "web"
    context: Optional[Dict] = None
    language: Optional[str] = None
    session_id: Optional[str] = None


@router.post("/api/chat")
async def chat(req: ChatRequest):
    eng = get_engine()
    result = eng.respond(
        message=req.message,
        channel=req.channel if req.channel != "sms" else "web",
        context=req.context,
        language=req.language,
    )
    return result
