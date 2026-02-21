"""
/api/routes — active delivery routes with survival margins.
"""
from fastapi import APIRouter, Depends

from ..database import get_supabase_client
from ..models.schemas import RouteData
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/routes", tags=["Routes"])

# Default fallback data
_DEFAULT_ROUTES = [
    {
        "route_id": "R1",
        "name": "Route Alpha",
        "origin": "Farm Hub A",
        "destination": "Center A",
        "eta": 180,
        "survival_margin": 900,
        "distance": 245.0,
        "status": "on-track",
        "road_condition": "Clear",
    },
    {
        "route_id": "R2",
        "name": "Route Beta",
        "origin": "Farm Hub B",
        "destination": "Center B",
        "eta": 240,
        "survival_margin": 600,
        "distance": 312.0,
        "status": "on-track",
        "road_condition": "Traffic",
    },
    {
        "route_id": "R3",
        "name": "Route Gamma",
        "origin": "Farm Hub C",
        "destination": "Center A",
        "eta": 120,
        "survival_margin": 1200,
        "distance": 178.0,
        "status": "on-track",
        "road_condition": "Clear",
    },
    {
        "route_id": "R4",
        "name": "Route Delta",
        "origin": "Farm Hub A",
        "destination": "Market D",
        "eta": 300,
        "survival_margin": 300,
        "distance": 405.0,
        "status": "delayed",
        "road_condition": "Construction",
    },
]


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.get("/")
async def get_routes(svc: SupabaseService = Depends(_get_svc)):
    """Return active routes. Falls back to default data if DB is empty."""
    routes = await svc.get_routes()
    if not routes:
        routes = _DEFAULT_ROUTES
    return {"routes": routes, "count": len(routes)}


@router.post("/")
async def upsert_route(
    body: RouteData,
    svc: SupabaseService = Depends(_get_svc),
):
    """Create or update a route record."""
    route_dict = body.model_dump(exclude_none=True)
    saved = await svc.upsert_route(route_dict)
    return {"success": True, "route": saved}


@router.get("/{route_id}")
async def get_route(route_id: str, svc: SupabaseService = Depends(_get_svc)):
    """Get a single route by ID."""
    routes = await svc.get_routes()
    for r in routes:
        if r.get("route_id") == route_id:
            return r
    # Fallback to default
    for r in _DEFAULT_ROUTES:
        if r["route_id"] == route_id:
            return r
    return {"error": "Route not found"}
