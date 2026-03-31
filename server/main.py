"""
Hey804 — FastAPI server entry point.
Civic information infrastructure for Richmond, VA.
"""
from __future__ import annotations

import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from server.models.database import init_db, get_stats
from server.routers import sms, chat
from server.config import LOG_LEVEL, ENVIRONMENT, ADMIN_TOKEN

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

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
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# --- Routes ---

app.include_router(chat.router)
app.include_router(sms.router)


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


@app.get("/")
async def root():
    return RedirectResponse(url="/widget-demo.html")


# Static files (MUST be last — catch-all)
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
if WEB_DIR.exists():
    app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="static")
