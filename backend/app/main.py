"""
Aegis Harvest — FastAPI Backend
================================
Cold-chain logistics intelligence platform.

Start:
    cd backend
    uvicorn app.main:app --reload --port 8000
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import (
    telemetry,
    prediction,
    routes_router,
    facilities,
    trips,
    rescue,
    recommendations,
    agent,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("aegis")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the ML models at startup so the first request is fast."""
    settings = get_settings()
    logger.info("Aegis Harvest backend starting…")
    try:
        from .services.ml_service import get_ml_service
        ml = get_ml_service(settings.models_dir)
        ml._load()
        logger.info("ML models loaded successfully.")
    except Exception as exc:
        logger.warning("ML model pre-load failed (will retry on first request): %s", exc)
    yield
    logger.info("Aegis Harvest backend shutting down.")


app = FastAPI(
    title="Aegis Harvest API",
    description="Autonomous Cold-Chain Copilot — ML predictions, agentic routing, and real-time telemetry.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow Next.js frontend) ──────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(telemetry.router)
app.include_router(prediction.router)
app.include_router(routes_router.router)
app.include_router(facilities.router)
app.include_router(trips.router)
app.include_router(rescue.router)
app.include_router(recommendations.router)
app.include_router(agent.router)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "Aegis Harvest API",
        "version": "1.0.0",
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Aegis Harvest Autonomous Cold-Chain Copilot API",
        "docs": "/docs",
        "health": "/health",
    }
