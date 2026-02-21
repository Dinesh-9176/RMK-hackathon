"""
/api/recommendations — manage AI-generated action recommendations.
"""
from fastapi import APIRouter, Depends, HTTPException

from ..database import get_supabase_client
from ..models.schemas import AIRecommendation, RecommendationAction
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.get("/")
async def get_recommendations(
    limit: int = 20,
    svc: SupabaseService = Depends(_get_svc),
):
    """Return latest AI recommendations."""
    recs = await svc.get_recommendations(limit=limit)
    return {"recommendations": recs, "count": len(recs)}


@router.post("/{rec_id}/action")
async def action_recommendation(
    rec_id: str,
    body: RecommendationAction,
    svc: SupabaseService = Depends(_get_svc),
):
    """Approve or reject a recommendation (human-in-the-loop)."""
    status = "approved" if body.action == "approve" else "rejected"
    updated = await svc.update_recommendation_status(rec_id, status)
    return {"success": True, "rec_id": rec_id, "status": status, "record": updated}
