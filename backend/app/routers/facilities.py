"""
/api/facilities — cold storage facility status.
"""
from fastapi import APIRouter, Depends

from ..database import get_supabase_client
from ..models.schemas import FacilityData
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])

_DEFAULT_FACILITIES = [
    {
        "name": "Center A – Metro Cold Hub",
        "temperature": 3.1,
        "humidity": 88,
        "power_status": "normal",
        "storage_capacity": 5000,
        "current_load": 3200,
        "last_updated": "2 min ago",
    },
    {
        "name": "Center B – Regional Depot",
        "temperature": 4.8,
        "humidity": 82,
        "power_status": "normal",
        "storage_capacity": 3000,
        "current_load": 2100,
        "last_updated": "1 min ago",
    },
]


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.get("/")
async def get_facilities(svc: SupabaseService = Depends(_get_svc)):
    """Return all facility statuses."""
    facilities = await svc.get_facilities()
    if not facilities:
        facilities = _DEFAULT_FACILITIES
    return {"facilities": facilities, "count": len(facilities)}


@router.put("/{name}")
async def update_facility(
    name: str,
    body: FacilityData,
    svc: SupabaseService = Depends(_get_svc),
):
    """Update a facility's sensor readings."""
    updates = {
        "temperature": body.temperature,
        "humidity": body.humidity,
        "power_status": body.power_status,
        "current_load": body.current_load,
    }
    saved = await svc.update_facility(name, updates)
    return {"success": True, "facility": saved}
