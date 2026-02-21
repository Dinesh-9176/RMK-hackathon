"""
/api/rescue — Market Pivot Engine rescue points.
"""
from fastapi import APIRouter, Depends

from ..database import get_supabase_client
from ..models.schemas import RescuePoint
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/rescue", tags=["Market Pivot / Rescue"])

_DEFAULT_RESCUE_POINTS = [
    {
        "name": "QuickFreeze Depot",
        "distance": 12,
        "recovery_chance": 92,
        "type": "cold-storage",
        "available": True,
        "eta": 18,
    },
    {
        "name": "FreshMart Outlet",
        "distance": 8,
        "recovery_chance": 78,
        "type": "market",
        "available": True,
        "eta": 12,
    },
    {
        "name": "AgriProcess Plant",
        "distance": 22,
        "recovery_chance": 65,
        "type": "processing",
        "available": True,
        "eta": 30,
    },
    {
        "name": "ColdChain Hub B2",
        "distance": 35,
        "recovery_chance": 88,
        "type": "cold-storage",
        "available": False,
        "eta": 45,
    },
    {
        "name": "Metro Fresh Market",
        "distance": 5,
        "recovery_chance": 71,
        "type": "market",
        "available": True,
        "eta": 8,
    },
]


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.get("/")
async def get_rescue_points(
    available_only: bool = False,
    svc: SupabaseService = Depends(_get_svc),
):
    """Return rescue points ranked by recovery chance."""
    points = await svc.get_rescue_points(available_only=available_only)
    if not points:
        points = _DEFAULT_RESCUE_POINTS
        if available_only:
            points = [p for p in points if p["available"]]
    return {"rescue_points": points, "count": len(points)}


@router.get("/best")
async def get_best_rescue_point(svc: SupabaseService = Depends(_get_svc)):
    """Return the single best available rescue point."""
    points = await svc.get_rescue_points(available_only=True)
    if not points:
        points = [p for p in _DEFAULT_RESCUE_POINTS if p["available"]]
    if not points:
        return {"rescue_point": None}
    best = max(points, key=lambda p: p.get("recovery_chance", 0))
    return {"rescue_point": best}
