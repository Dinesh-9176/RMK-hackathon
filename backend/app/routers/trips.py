"""
/api/trips — historical trip log records.
"""
from fastapi import APIRouter, Depends

from ..database import get_supabase_client
from ..models.schemas import TripLog
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/trips", tags=["Trip Logs"])

_DEFAULT_TRIPS = [
    {
        "trip_id": "T001",
        "date": "2026-02-20",
        "route": "Route Alpha",
        "cargo": "Mangoes – 2.4 tons",
        "duration": "3h 12m",
        "temp_range": "2.1°C – 4.8°C",
        "status": "completed",
        "shelf_life_used": 18,
    },
    {
        "trip_id": "T002",
        "date": "2026-02-19",
        "route": "Route Beta",
        "cargo": "Tomatoes – 1.8 tons",
        "duration": "4h 05m",
        "temp_range": "3.2°C – 6.1°C",
        "status": "completed",
        "shelf_life_used": 24,
    },
    {
        "trip_id": "T003",
        "date": "2026-02-18",
        "route": "Route Gamma",
        "cargo": "Leafy Greens – 0.9 tons",
        "duration": "2h 30m",
        "temp_range": "1.8°C – 3.5°C",
        "status": "completed",
        "shelf_life_used": 12,
    },
    {
        "trip_id": "T004",
        "date": "2026-02-17",
        "route": "Route Delta",
        "cargo": "Dairy – 3.1 tons",
        "duration": "5h 20m",
        "temp_range": "4.5°C – 12.3°C",
        "status": "incident",
        "shelf_life_used": 45,
    },
    {
        "trip_id": "T005",
        "date": "2026-02-16",
        "route": "Route Alpha",
        "cargo": "Berries – 1.2 tons",
        "duration": "3h 00m",
        "temp_range": "1.5°C – 3.0°C",
        "status": "completed",
        "shelf_life_used": 15,
    },
    {
        "trip_id": "T006",
        "date": "2026-02-15",
        "route": "Route Beta",
        "cargo": "Fish – 2.0 tons",
        "duration": "4h 45m",
        "temp_range": "6.0°C – 18.5°C",
        "status": "aborted",
        "shelf_life_used": 72,
    },
]


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.get("/")
async def get_trips(
    limit: int = 50,
    status: str = None,
    svc: SupabaseService = Depends(_get_svc),
):
    """Return trip logs, newest first. Optionally filter by status."""
    trips = await svc.get_trip_logs(limit=limit)
    if not trips:
        trips = _DEFAULT_TRIPS
    if status:
        trips = [t for t in trips if t.get("status") == status]
    return {"trips": trips, "count": len(trips)}


@router.post("/")
async def add_trip(
    body: TripLog,
    svc: SupabaseService = Depends(_get_svc),
):
    """Record a new trip."""
    trip_dict = body.model_dump(exclude_none=True)
    saved = await svc.add_trip_log(trip_dict)
    return {"success": True, "trip": saved}
