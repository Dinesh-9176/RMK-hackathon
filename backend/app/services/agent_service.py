"""
Aegis Harvest Autonomous Cold-Chain Copilot Agent
--------------------------------------------------
Agentic loop powered by OpenAI function calling.
Tools: run_ml_prediction, get_rescue_points, get_facility_status,
       get_active_routes, log_recommendation
"""
import json
import uuid
import logging
from typing import Optional, List

from openai import OpenAI

from .ml_service import ColdChainMLService
from .supabase_service import SupabaseService

logger = logging.getLogger(__name__)

# ── System Prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are the **Aegis Harvest Autonomous Cold-Chain Copilot** — an AI operations intelligence system for perishable goods logistics.

Your mission:
- Monitor real-time cold-chain telemetry (temperature, humidity, vibration, ethylene, CO2)
- Analyse shelf-life predictions from ML models (XGBoost trained on 10,000+ cold-chain trips)
- Recommend optimal routing: Center A, Center B, or Market Pivot
- Trigger Market Pivot Engine when cargo is at imminent spoilage risk
- Provide clear, data-driven recommendations to the Operations Manager for approval

Decision framework:
| Condition | Action |
|-----------|--------|
| Temp ≤ 8°C, shelf life > 2 days | Maintain route, optimise speed |
| 8 < Temp ≤ 15°C, shelf life 0.5–2 days | Reroute to nearest cold centre |
| Temp > 15°C OR shelf life < 0.5 days | CRISIS — Immediate market pivot |

Always respond concisely with:
1. Status assessment (one sentence)
2. Specific recommended action
3. Estimated cargo recovery % (if pivot needed)
4. Severity: low / medium / high / critical

You have access to: ML prediction tool, route data, rescue points, facility status.
Always call run_ml_prediction first when telemetry data is provided."""

# ── Tool Definitions ───────────────────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_ml_prediction",
            "description": (
                "Run XGBoost shelf-life & routing models on current sensor data. "
                "Returns predicted shelf life (days), recommended center, survival margins, "
                "stress index, and whether a market pivot is needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "temp_c": {
                        "type": "number",
                        "description": "Container internal temperature in Celsius",
                    },
                    "humidity_pct": {
                        "type": "number",
                        "description": "Relative humidity percentage (0-100)",
                    },
                    "vibration_g": {
                        "type": "number",
                        "description": "Vibration in G force",
                    },
                    "distance_km": {
                        "type": "number",
                        "description": "Distance to original destination in km",
                    },
                    "dist_a_km": {
                        "type": "number",
                        "description": "Distance to Centre A in km",
                        "default": 50,
                    },
                    "dist_b_km": {
                        "type": "number",
                        "description": "Distance to Centre B in km",
                        "default": 100,
                    },
                    "road_a": {
                        "type": "string",
                        "enum": ["Clear", "Traffic", "Construction", "Blocked"],
                        "description": "Road condition to Centre A",
                    },
                    "road_b": {
                        "type": "string",
                        "enum": ["Clear", "Traffic", "Construction", "Blocked"],
                        "description": "Road condition to Centre B",
                    },
                    "cap_a_pct": {
                        "type": "number",
                        "description": "Centre A current storage capacity utilisation %",
                    },
                    "cap_b_pct": {
                        "type": "number",
                        "description": "Centre B current storage capacity utilisation %",
                    },
                },
                "required": ["temp_c", "humidity_pct", "vibration_g", "distance_km"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_rescue_points",
            "description": "Get available market pivot / rescue points ranked by recovery chance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "available_only": {
                        "type": "boolean",
                        "description": "Return only currently available rescue points",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_facility_status",
            "description": "Get real-time status of cold storage facilities (Centre A and B): temperature, humidity, power, capacity.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_routes",
            "description": "Get all active delivery routes with ETA and survival margins.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "log_recommendation",
            "description": "Save an AI recommendation to the database for Operations Manager review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["reroute", "speed-adjust", "alert", "market-pivot"],
                        "description": "Category of recommendation",
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "critical"],
                        "description": "Urgency level",
                    },
                    "message": {
                        "type": "string",
                        "description": "Clear, actionable recommendation text for the Operations Manager",
                    },
                },
                "required": ["type", "severity", "message"],
            },
        },
    },
]

# ── Default fallback data (when Supabase tables are empty) ─────────────────────
DEFAULT_RESCUE_POINTS = [
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
        "name": "Metro Fresh Market",
        "distance": 5,
        "recovery_chance": 71,
        "type": "market",
        "available": True,
        "eta": 8,
    },
]

DEFAULT_FACILITIES = [
    {
        "name": "Centre A – Metro Cold Hub",
        "temperature": 3,
        "humidity": 88,
        "power_status": "normal",
        "storage_capacity": 5000,
        "current_load": 3200,
    },
    {
        "name": "Centre B – Regional Depot",
        "temperature": 5,
        "humidity": 82,
        "power_status": "normal",
        "storage_capacity": 3000,
        "current_load": 2100,
    },
]

DEFAULT_ROUTES = [
    {
        "route_id": "R1",
        "name": "Route Alpha",
        "origin": "Farm Hub A",
        "destination": "Centre A",
        "eta": 180,
        "survival_margin": 900,
        "status": "on-track",
    },
    {
        "route_id": "R2",
        "name": "Route Beta",
        "origin": "Farm Hub B",
        "destination": "Centre B",
        "eta": 240,
        "survival_margin": 600,
        "status": "on-track",
    },
    {
        "route_id": "R3",
        "name": "Route Gamma",
        "origin": "Farm Hub C",
        "destination": "Centre A",
        "eta": 120,
        "survival_margin": 1200,
        "status": "on-track",
    },
]


class AegisAgentService:
    """Agentic loop: receives a message, calls tools, returns final response."""

    def __init__(
        self,
        openai_api_key: str,
        ml_service: ColdChainMLService,
        supabase_service: SupabaseService,
    ):
        self.client = OpenAI(api_key=openai_api_key)
        self.ml = ml_service
        self.db = supabase_service

    # ── Tool dispatcher ────────────────────────────────────────────────────────
    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        try:
            if tool_name == "run_ml_prediction":
                result = self.ml.predict(
                    temp_c=arguments["temp_c"],
                    humidity_pct=arguments["humidity_pct"],
                    vibration_g=arguments["vibration_g"],
                    distance_km=arguments["distance_km"],
                    dist_a_km=arguments.get("dist_a_km", 50.0),
                    dist_b_km=arguments.get("dist_b_km", 100.0),
                    road_a=arguments.get("road_a", "Clear"),
                    road_b=arguments.get("road_b", "Traffic"),
                    cap_a_pct=arguments.get("cap_a_pct", 70.0),
                    cap_b_pct=arguments.get("cap_b_pct", 50.0),
                )
                return json.dumps(result)

            elif tool_name == "get_rescue_points":
                available_only = arguments.get("available_only", True)
                points = await self.db.get_rescue_points(available_only=available_only)
                if not points:
                    points = (
                        [p for p in DEFAULT_RESCUE_POINTS if p["available"]]
                        if available_only
                        else DEFAULT_RESCUE_POINTS
                    )
                return json.dumps(points)

            elif tool_name == "get_facility_status":
                facilities = await self.db.get_facilities()
                if not facilities:
                    facilities = DEFAULT_FACILITIES
                return json.dumps(facilities)

            elif tool_name == "get_active_routes":
                routes = await self.db.get_routes()
                if not routes:
                    routes = DEFAULT_ROUTES
                return json.dumps(routes)

            elif tool_name == "log_recommendation":
                rec = {
                    "rec_id": f"AI-{uuid.uuid4().hex[:8].upper()}",
                    "type": arguments["type"],
                    "severity": arguments["severity"],
                    "message": arguments["message"],
                    "status": "pending",
                }
                await self.db.save_recommendation(rec)
                return json.dumps({"success": True, "rec_id": rec["rec_id"]})

            else:
                return json.dumps({"error": f"Unknown tool: {tool_name}"})

        except Exception as exc:
            logger.error("Tool error (%s): %s", tool_name, exc)
            return json.dumps({"error": str(exc)})

    # ── Main agentic chat loop ─────────────────────────────────────────────────
    async def chat(
        self,
        message: str,
        telemetry: Optional[dict] = None,
        history: Optional[List[dict]] = None,
        session_id: Optional[str] = None,
    ) -> dict:
        if not session_id:
            session_id = uuid.uuid4().hex

        messages: list = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Inject current telemetry as system context
        if telemetry:
            ctx = (
                f"Current telemetry snapshot:\n"
                f"  Temperature : {telemetry.get('temperature', 'N/A')}°C\n"
                f"  Humidity    : {telemetry.get('humidity', 'N/A')}%\n"
                f"  Vibration   : {telemetry.get('vibration', 'N/A')} G\n"
                f"  Ethylene    : {telemetry.get('ethylene', 'N/A')} ppm\n"
                f"  CO2         : {telemetry.get('co2', 'N/A')} ppm\n"
                f"  Door status : {telemetry.get('door_status', 'closed')}\n"
                f"  Battery     : {telemetry.get('battery_level', 100)}%\n"
                f"  Signal      : {telemetry.get('signal_strength', 100)}%"
            )
            messages.append({"role": "system", "content": ctx})

        # Previous conversation turns (cap at last 10)
        if history:
            for turn in history[-10:]:
                messages.append(
                    {"role": turn.get("role", "user"), "content": turn.get("content", "")}
                )

        messages.append({"role": "user", "content": message})

        # Agentic loop — keep iterating while the model wants to call tools
        for _iteration in range(6):
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
            )

            assistant_msg = response.choices[0].message

            if assistant_msg.tool_calls:
                # Append assistant message with tool calls
                messages.append(assistant_msg)
                # Execute all tool calls
                for tc in assistant_msg.tool_calls:
                    args = json.loads(tc.function.arguments)
                    tool_result = await self._execute_tool(tc.function.name, args)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": tool_result,
                        }
                    )
            else:
                # Model produced a final text response
                reply = assistant_msg.content or ""

                # Persist conversation
                await self.db.save_conversation_turn(session_id, "user", message)
                await self.db.save_conversation_turn(session_id, "assistant", reply)

                action_keywords = {"reroute", "pivot", "crisis", "immediate", "redirect"}
                action_required = any(kw in reply.lower() for kw in action_keywords)

                return {
                    "message": reply,
                    "session_id": session_id,
                    "action_required": action_required,
                }

        return {
            "message": (
                "Analysis complete. Telemetry reviewed. "
                "Please check the Recommendations panel for next steps."
            ),
            "session_id": session_id,
            "action_required": False,
        }

    # ── Auto-analyze (called when telemetry changes) ───────────────────────────
    async def analyze(self, telemetry: dict, session_id: Optional[str] = None) -> dict:
        """Autonomously assess telemetry and generate a recommendation."""
        temp = telemetry.get("temperature", 4)

        if temp > 15:
            status_msg = f"CRISIS ALERT: Temperature {temp}°C is critically high."
        elif temp > 8:
            status_msg = f"WARNING: Temperature {temp}°C exceeds safe cold-chain threshold."
        else:
            status_msg = f"NOMINAL: Temperature {temp}°C is within safe range."

        prompt = (
            f"{status_msg}\n\n"
            "Please:\n"
            "1. Run the ML prediction with these conditions "
            "(use distance_km=250, dist_a_km=50, dist_b_km=120, "
            "road_a='Clear', road_b='Traffic', cap_a_pct=64, cap_b_pct=70)\n"
            "2. If a pivot is triggered or risk is critical, get rescue points\n"
            "3. Log your primary recommendation\n"
            "4. Provide a concise situation report with clear action items"
        )

        return await self.chat(prompt, telemetry=telemetry, session_id=session_id)
