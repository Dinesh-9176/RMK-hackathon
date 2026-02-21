"""
/api/predict — run the XGBoost ML models on live telemetry.
"""
from fastapi import APIRouter, Depends, HTTPException

from ..config import get_settings
from ..database import get_supabase_client
from ..models.schemas import PredictionInput, PredictionResult, SurvivalMargins
from ..services.ml_service import get_ml_service, ColdChainMLService
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/predict", tags=["ML Prediction"])


def _get_ml() -> ColdChainMLService:
    return get_ml_service(get_settings().models_dir)


def _get_svc() -> SupabaseService:
    return SupabaseService(get_supabase_client())


@router.post("/", response_model=PredictionResult)
async def predict(
    body: PredictionInput,
    ml: ColdChainMLService = Depends(_get_ml),
    svc: SupabaseService = Depends(_get_svc),
):
    """
    Run shelf-life + routing prediction.
    Logs the prediction to Supabase and returns the full result.
    """
    try:
        result = ml.predict(
            temp_c=body.temp_c,
            humidity_pct=body.humidity_pct,
            vibration_g=body.vibration_g,
            distance_km=body.distance_km,
            dist_a_km=body.dist_a_km,
            dist_b_km=body.dist_b_km,
            road_a=body.road_a,
            road_b=body.road_b,
            cap_a_pct=body.cap_a_pct,
            cap_b_pct=body.cap_b_pct,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ML prediction failed: {exc}")

    # Async log to DB (fire-and-forget)
    await svc.log_prediction(body.model_dump(), result)

    margins_raw = result["survival_margins"]
    return PredictionResult(
        predicted_shelf_life_days=result["predicted_shelf_life_days"],
        predicted_shelf_life_hours=result["predicted_shelf_life_hours"],
        recommended_center=result["recommended_center"],
        survival_margins=SurvivalMargins(
            sm_original=margins_raw["SM_Original"],
            sm_a=margins_raw["SM_A"],
            sm_b=margins_raw["SM_B"],
        ),
        stress_index=result["stress_index"],
        market_pivot_trigger=result["market_pivot_trigger"],
        risk_level=result["risk_level"],
    )


@router.post("/quick")
async def quick_predict(
    temperature: float,
    humidity: float = 85.0,
    vibration: float = 0.3,
    distance: float = 250.0,
    ml: ColdChainMLService = Depends(_get_ml),
):
    """
    Quick single-parameter prediction endpoint for the Simulation Lab slider.
    Only requires temperature; other params use sensible defaults.
    """
    try:
        result = ml.predict(
            temp_c=temperature,
            humidity_pct=humidity,
            vibration_g=vibration,
            distance_km=distance,
        )
        return {
            "shelf_life_hours": result["predicted_shelf_life_hours"],
            "shelf_life_days": result["predicted_shelf_life_days"],
            "risk_level": result["risk_level"],
            "stress_index": result["stress_index"],
            "market_pivot_trigger": result["market_pivot_trigger"],
            "recommended_center": result["recommended_center"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
