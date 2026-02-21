"""
Supabase data layer — all DB operations go through this service.
Falls back to in-memory defaults when tables are empty or unreachable.
"""
import logging
from datetime import datetime
from typing import List, Optional
from supabase import Client

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self, client: Client):
        self.db = client

    # ── Telemetry ──────────────────────────────────────────────────────────────
    async def log_telemetry(self, data: dict) -> dict:
        try:
            res = self.db.table("telemetry_sessions").insert(data).execute()
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("log_telemetry error: %s", exc)
            return {}

    async def get_latest_telemetry(self, limit: int = 20) -> List[dict]:
        try:
            res = (
                self.db.table("telemetry_sessions")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error("get_latest_telemetry error: %s", exc)
            return []

    # ── ML Predictions ─────────────────────────────────────────────────────────
    async def log_prediction(self, input_data: dict, result: dict) -> dict:
        try:
            record = {
                "input_data": input_data,
                "predicted_shelf_life": result.get("predicted_shelf_life_days"),
                "recommended_center": result.get("recommended_center"),
                "survival_margins": result.get("survival_margins"),
                "stress_index": result.get("stress_index"),
                "market_pivot_trigger": result.get("market_pivot_trigger"),
            }
            res = self.db.table("ml_predictions").insert(record).execute()
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("log_prediction error: %s", exc)
            return {}

    # ── Routes ─────────────────────────────────────────────────────────────────
    async def get_routes(self) -> List[dict]:
        try:
            res = self.db.table("routes").select("*").execute()
            return res.data or []
        except Exception as exc:
            logger.error("get_routes error: %s", exc)
            return []

    async def upsert_route(self, route: dict) -> dict:
        try:
            res = self.db.table("routes").upsert(route).execute()
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("upsert_route error: %s", exc)
            return {}

    # ── Facilities ─────────────────────────────────────────────────────────────
    async def get_facilities(self) -> List[dict]:
        try:
            res = self.db.table("facilities").select("*").execute()
            return res.data or []
        except Exception as exc:
            logger.error("get_facilities error: %s", exc)
            return []

    async def update_facility(self, name: str, updates: dict) -> dict:
        try:
            res = (
                self.db.table("facilities")
                .update(updates)
                .eq("name", name)
                .execute()
            )
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("update_facility error: %s", exc)
            return {}

    # ── Trip Logs ──────────────────────────────────────────────────────────────
    async def get_trip_logs(self, limit: int = 50) -> List[dict]:
        try:
            res = (
                self.db.table("trip_logs")
                .select("*")
                .order("date", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error("get_trip_logs error: %s", exc)
            return []

    async def add_trip_log(self, trip: dict) -> dict:
        try:
            res = self.db.table("trip_logs").insert(trip).execute()
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("add_trip_log error: %s", exc)
            return {}

    # ── Rescue Points ──────────────────────────────────────────────────────────
    async def get_rescue_points(self, available_only: bool = False) -> List[dict]:
        try:
            q = self.db.table("rescue_points").select("*")
            if available_only:
                q = q.eq("available", True)
            res = q.order("recovery_chance", desc=True).execute()
            return res.data or []
        except Exception as exc:
            logger.error("get_rescue_points error: %s", exc)
            return []

    # ── AI Recommendations ─────────────────────────────────────────────────────
    async def save_recommendation(self, rec: dict) -> dict:
        try:
            res = self.db.table("ai_recommendations").insert(rec).execute()
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("save_recommendation error: %s", exc)
            return {}

    async def get_recommendations(self, limit: int = 20) -> List[dict]:
        try:
            res = (
                self.db.table("ai_recommendations")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error("get_recommendations error: %s", exc)
            return []

    async def update_recommendation_status(self, rec_id: str, status: str) -> dict:
        try:
            res = (
                self.db.table("ai_recommendations")
                .update({"status": status, "resolved_at": datetime.utcnow().isoformat()})
                .eq("rec_id", rec_id)
                .execute()
            )
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("update_recommendation_status error: %s", exc)
            return {}

    # ── Agent Conversations ────────────────────────────────────────────────────
    async def save_conversation_turn(
        self, session_id: str, role: str, content: str
    ) -> dict:
        try:
            res = (
                self.db.table("agent_conversations")
                .insert(
                    {"session_id": session_id, "role": role, "content": content}
                )
                .execute()
            )
            return res.data[0] if res.data else {}
        except Exception as exc:
            logger.error("save_conversation_turn error: %s", exc)
            return {}

    async def get_conversation_history(self, session_id: str) -> List[dict]:
        try:
            res = (
                self.db.table("agent_conversations")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at")
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error("get_conversation_history error: %s", exc)
            return []
