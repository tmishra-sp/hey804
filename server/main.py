"""
Hey804 — FastAPI server entry point.
Civic information infrastructure for Richmond, VA.
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from server.models.database import init_db, get_active_alert, get_stats
from server.routers import sms, chat, broadcast
from server.config import LOG_LEVEL, ENVIRONMENT, ADMIN_TOKEN

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
        if len(self.requests[ip]) >= self.max_requests:
            return False
        self.requests[ip].append(now)
        return True


rate_limiter = RateLimiter(max_requests=30, window_seconds=60)

app = FastAPI(
    title="Hey804",
    description="Civic information infrastructure for Richmond, VA",
    version="0.1.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url=None,
)

# CORS — open for widget embeds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Allow iframe embedding for widget (SAMEORIGIN instead of DENY)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Don't cache API responses, but allow static assets
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# --- API Routes (must be registered BEFORE static mount) ---

# Rate-limited chat endpoint
chat.router.routes.clear()


@chat.router.post("/api/chat")
async def chat_endpoint(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please wait a moment and try again."},
        )
    body = await request.json()
    req = chat.ChatRequest(**body)
    eng = chat.get_engine()
    result = eng.respond(
        message=req.message[:500],
        channel=req.channel if req.channel != "sms" else "web",
        context=req.context,
        language=req.language,
    )
    return result


app.include_router(sms.router)
app.include_router(chat.router)
app.include_router(broadcast.router)


# Alerts endpoint (public — polled by web app)
@app.get("/api/alerts/active")
async def active_alert():
    alert = get_active_alert()
    return {"alert": alert}


# Admin stats endpoint
@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        return JSONResponse(status_code=403, content={"error": "Unauthorized"})
    return get_stats()


@app.on_event("startup")
async def startup():
    init_db()
    logger.info(f"Hey804 started (env={ENVIRONMENT})")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "hey804", "version": "0.1.0"}


# --- Redirect root to widget demo ---
@app.get("/")
async def root():
    return RedirectResponse(url="/widget-demo.html")


# --- Static files (MUST be last — catch-all for web app) ---
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
if WEB_DIR.exists():
    app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="static")
