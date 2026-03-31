"""
Chat endpoint — all web/widget surfaces hit this.
POST /api/chat
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict
from typing import Optional, Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from server.services.engine_instance import get_engine

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    channel: str = "web"
    context: Optional[Dict] = None
    language: Optional[str] = None
    session_id: Optional[str] = None


# Rate limiter — scoped to this module
class _RateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
        # Evict stale IPs to prevent unbounded memory growth
        if not self.requests[ip]:
            del self.requests[ip]
            self.requests[ip] = []  # re-create for the append below
        if len(self.requests[ip]) >= self.max_requests:
            return False
        self.requests[ip].append(now)
        return True


_rate_limiter = _RateLimiter(max_requests=30, window_seconds=60)


@router.post("/api/chat")
async def chat(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not _rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please wait a moment and try again."},
        )

    body = await request.json()
    req = ChatRequest(**body)
    eng = get_engine()

    # Run synchronous engine in thread pool to avoid blocking the event loop
    result = await asyncio.to_thread(
        eng.respond,
        message=req.message[:500],
        channel=req.channel if req.channel != "sms" else "web",
        context=req.context,
        language=req.language,
    )
    return result
