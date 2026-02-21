from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime


# ── Telemetry ──────────────────────────────────────────────────────────────────
class TelemetryInput(BaseModel):
    temperature: float = Field(..., ge=-10, le=60, description="Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Humidity %")
    vibration: float = Field(..., ge=0, le=5, description="Vibration in G")
    ethylene: float = Field(default=12.0, ge=0, description="Ethylene ppm")
    co2: float = Field(default=450.0, ge=0, description="CO2 ppm")
    door_status: Literal["open", "closed"] = "closed"
    battery_level: int = Field(default=100, ge=0, le=100)
    signal_strength: int = Field(default=100, ge=0, le=100)
    session_id: Optional[str] = None


class TelemetryRecord(TelemetryInput):
    id: Optional[str] = None
    created_at: Optional[datetime] = None


# ── ML Prediction ──────────────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    temp_c: float = Field(..., ge=-10, le=60)
    humidity_pct: float = Field(..., ge=0, le=100)
    vibration_g: float = Field(..., ge=0, le=5)
    distance_km: float = Field(..., ge=0)
    dist_a_km: float = Field(default=50.0, ge=0)
    dist_b_km: float = Field(default=100.0, ge=0)
    road_a: Literal["Clear", "Traffic", "Construction", "Blocked"] = "Clear"
    road_b: Literal["Clear", "Traffic", "Construction", "Blocked"] = "Traffic"
    cap_a_pct: float = Field(default=70.0, ge=0, le=100)
    cap_b_pct: float = Field(default=50.0, ge=0, le=100)


class SurvivalMargins(BaseModel):
    sm_original: float
    sm_a: float
    sm_b: float


class PredictionResult(BaseModel):
    predicted_shelf_life_days: float
    predicted_shelf_life_hours: float
    recommended_center: str
    survival_margins: SurvivalMargins
    stress_index: float
    market_pivot_trigger: bool
    risk_level: Literal["safe", "warning", "critical"]


# ── Routes ─────────────────────────────────────────────────────────────────────
class RouteData(BaseModel):
    id: Optional[str] = None
    route_id: str
    name: str
    origin: str
    destination: str
    eta: int  # minutes
    survival_margin: int  # minutes
    distance: float
    status: Literal["on-track", "delayed", "critical"]
    road_condition: Literal["Clear", "Traffic", "Construction", "Blocked"] = "Clear"


# ── Facilities ─────────────────────────────────────────────────────────────────
class FacilityData(BaseModel):
    id: Optional[str] = None
    name: str
    temperature: float
    humidity: float
    power_status: Literal["normal", "backup", "critical"]
    storage_capacity: int
    current_load: int
    last_updated: Optional[str] = None


# ── Trip Logs ──────────────────────────────────────────────────────────────────
class TripLog(BaseModel):
    id: Optional[str] = None
    trip_id: str
    date: str
    route: str
    cargo: str
    duration: str
    temp_range: str
    status: Literal["completed", "incident", "aborted"]
    shelf_life_used: int


# ── Rescue Points ──────────────────────────────────────────────────────────────
class RescuePoint(BaseModel):
    id: Optional[str] = None
    name: str
    distance: float
    recovery_chance: int
    type: Literal["cold-storage", "market", "processing"]
    available: bool
    eta: int


# ── AI Recommendations ─────────────────────────────────────────────────────────
class AIRecommendation(BaseModel):
    id: Optional[str] = None
    rec_id: str
    type: Literal["reroute", "speed-adjust", "alert", "market-pivot"]
    severity: Literal["low", "medium", "high", "critical"]
    message: str
    status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: Optional[datetime] = None


class RecommendationAction(BaseModel):
    action: Literal["approve", "reject"]


# ── Agent ──────────────────────────────────────────────────────────────────────
class AgentMessage(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str


class AgentChatRequest(BaseModel):
    message: str
    telemetry: Optional[TelemetryInput] = None
    session_id: Optional[str] = None
    history: Optional[List[AgentMessage]] = []


class AgentAnalyzeRequest(BaseModel):
    telemetry: TelemetryInput
    prediction: Optional[PredictionInput] = None
    session_id: Optional[str] = None


class AgentResponse(BaseModel):
    message: str
    recommendations: Optional[List[AIRecommendation]] = None
    prediction: Optional[PredictionResult] = None
    action_required: bool = False
    session_id: Optional[str] = None
