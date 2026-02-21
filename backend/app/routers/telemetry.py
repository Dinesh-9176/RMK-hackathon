"""
/api/telemetry — log sensor readings and retrieve history.
"""
import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from ..database import get_supabase_client
from ..models.schemas import TelemetryInput
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.post("/log")
async def log_telemetry(
    body: TelemetryInput,
    svc: SupabaseService = Depends(_get_svc),
):
    """Persist a telemetry snapshot to Supabase."""
    data = {
        "temperature": body.temperature,
        "humidity": body.humidity,
        "vibration": body.vibration,
        "ethylene": body.ethylene,
        "co2": body.co2,
        "door_status": body.door_status,
        "battery_level": body.battery_level,
        "signal_strength": body.signal_strength,
        "session_id": body.session_id,
    }
    saved = await svc.log_telemetry(data)
    return {"success": True, "record": saved}


@router.get("/history")
async def get_telemetry_history(
    limit: int = 20,
    svc: SupabaseService = Depends(_get_svc),
):
    """Return recent telemetry readings (newest first)."""
    records = await svc.get_latest_telemetry(limit=limit)
    return {"records": records, "count": len(records)}


@router.get("/stream")
async def stream_telemetry():
    """
    Server-Sent Events stream — emits a simulated telemetry tick every 3 s.
    The frontend Simulation Lab can subscribe to keep the dashboard live.
    """
    import random

    async def generator():
        while True:
            payload = {
                "temperature": round(4 + random.gauss(0, 0.5), 2),
                "humidity": round(85 + random.gauss(0, 2), 1),
                "vibration": round(0.3 + random.uniform(0, 0.2), 3),
                "ethylene": round(12 + random.uniform(-2, 2), 1),
                "co2": round(450 + random.uniform(-30, 30), 1),
            }
            yield {"event": "telemetry", "data": json.dumps(payload)}
            await asyncio.sleep(3)

    return EventSourceResponse(generator())
