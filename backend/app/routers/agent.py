"""
/api/agent — Aegis Harvest Autonomous Copilot endpoints.

POST /api/agent/chat     → conversational interface
POST /api/agent/analyze  → auto-analyze current telemetry (no user message needed)
GET  /api/agent/history  → fetch conversation history for a session
"""
from fastapi import APIRouter, Depends, HTTPException

from ..config import get_settings
from ..database import get_supabase_client
from ..models.schemas import AgentChatRequest, AgentAnalyzeRequest, AgentResponse
from ..services.agent_service import AegisAgentService
from ..services.ml_service import get_ml_service
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/agent", tags=["Aegis Copilot Agent"])


def _get_agent() -> AegisAgentService:
    settings = get_settings()
    ml = get_ml_service(settings.models_dir)
    svc = SupabaseService(get_supabase_client())
    return AegisAgentService(
        openai_api_key=settings.openai_api_key,
        ml_service=ml,
        supabase_service=svc,
    )


@router.post("/chat", response_model=AgentResponse)
async def agent_chat(
    body: AgentChatRequest,
    agent: AegisAgentService = Depends(_get_agent),
):
    """
    Send a message to the Aegis Copilot.
    Optionally attach current telemetry for context-aware analysis.
    """
    telemetry_dict = body.telemetry.model_dump() if body.telemetry else None
    history_dicts = (
        [h.model_dump() for h in body.history] if body.history else []
    )

    try:
        result = await agent.chat(
            message=body.message,
            telemetry=telemetry_dict,
            history=history_dicts,
            session_id=body.session_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}")

    return AgentResponse(
        message=result["message"],
        action_required=result.get("action_required", False),
        session_id=result.get("session_id"),
    )


@router.post("/analyze", response_model=AgentResponse)
async def agent_analyze(
    body: AgentAnalyzeRequest,
    agent: AegisAgentService = Depends(_get_agent),
):
    """
    Trigger autonomous analysis of current telemetry.
    The agent will run ML predictions, assess risk, and generate recommendations
    without requiring a user message — ideal for automated monitoring.
    """
    telemetry_dict = body.telemetry.model_dump()

    try:
        result = await agent.analyze(
            telemetry=telemetry_dict,
            session_id=body.session_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent analysis error: {exc}")

    return AgentResponse(
        message=result["message"],
        action_required=result.get("action_required", False),
        session_id=result.get("session_id"),
    )


@router.get("/history/{session_id}")
async def get_history(
    session_id: str,
    agent: AegisAgentService = Depends(_get_agent),
):
    """Retrieve conversation history for a given session."""
    history = await agent.db.get_conversation_history(session_id)
    return {"session_id": session_id, "history": history, "count": len(history)}
