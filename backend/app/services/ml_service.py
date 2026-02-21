"""
ML Service — wraps the pre-trained XGBoost spoilage & routing models.
Feature engineering exactly mirrors the training script (model (1).py).
"""
import pickle
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

ROAD_MAPPING = {
    "Clear": 1.0,
    "Traffic": 1.5,
    "Construction": 1.8,
    "Blocked": 5.0,
}

AVG_SPEED_KMPH = 60  # km/h assumed trunk speed


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Replicates feature engineering from the training script exactly."""
    df = df.copy()
    # Temperature Deviation (target cold = 4°C)
    df["Temp_Deviation"] = df["Temp_C"] - 4.0
    # Exponential Temperature Risk (Q10 model with base 2)
    df["Exp_Temp_Risk"] = 2.0 ** ((df["Temp_C"] - 4.0) / 10.0)
    # Vibration Flag
    df["Vibration_Flag"] = (df["Vibration_G"] > 0.5).astype(int)
    # Stress Index
    df["Stress_Index"] = df["Exp_Temp_Risk"] * (1 + 0.5 * df["Vibration_Flag"])
    # Road Multipliers
    df["Road_A_Mult"] = df["Road_A"].map(ROAD_MAPPING).fillna(1.0)
    df["Road_B_Mult"] = df["Road_B"].map(ROAD_MAPPING).fillna(1.0)
    return df


class ColdChainMLService:
    """Singleton wrapper around both pre-trained XGBoost models."""

    def __init__(self, models_dir: str = "./models"):
        self._models_dir = Path(models_dir)
        self._spoilage_model = None
        self._routing_model = None
        self._le_road = None
        self._le_center = None
        self._clf_features: list = []
        self._loaded = False

    def _load(self):
        if self._loaded:
            return

        primary_path = self._models_dir / "spoilage_model.pkl"
        secondary_path = self._models_dir / "routing_model.pkl"

        if not primary_path.exists():
            raise FileNotFoundError(f"Spoilage model not found: {primary_path}")
        if not secondary_path.exists():
            raise FileNotFoundError(f"Routing model not found: {secondary_path}")

        with open(primary_path, "rb") as f:
            self._spoilage_model = pickle.load(f)
        logger.info("Spoilage model loaded from %s", primary_path)

        with open(secondary_path, "rb") as f:
            pkg = pickle.load(f)
            self._routing_model = pkg["model"]
            self._le_road = pkg["le_road"]
            self._le_center = pkg["le_center"]
            self._clf_features = pkg["features"]
        logger.info("Routing model loaded from %s", secondary_path)
        self._loaded = True

    def predict(
        self,
        temp_c: float,
        humidity_pct: float,
        vibration_g: float,
        distance_km: float,
        dist_a_km: float = 50.0,
        dist_b_km: float = 100.0,
        road_a: str = "Clear",
        road_b: str = "Traffic",
        cap_a_pct: float = 70.0,
        cap_b_pct: float = 50.0,
    ) -> dict:
        self._load()

        # Build a single-row DataFrame matching training schema
        df = pd.DataFrame([{
            "Temp_C": temp_c,
            "Humidity_Pct": humidity_pct,
            "Vibration_G": vibration_g,
            "Distance_KM": distance_km,
            "Dist_A_KM": dist_a_km,
            "Dist_B_KM": dist_b_km,
            "Road_A": road_a,
            "Road_B": road_b,
            "Cap_A_Pct": cap_a_pct,
            "Cap_B_Pct": cap_b_pct,
        }])
        df = _engineer_features(df)

        # ── 1. Shelf-life prediction ──────────────────────────────────────────
        reg_features = [
            "Temp_C", "Humidity_Pct", "Vibration_G", "Distance_KM",
            "Temp_Deviation", "Exp_Temp_Risk", "Vibration_Flag", "Stress_Index",
        ]
        pred_days: float = float(self._spoilage_model.predict(df[reg_features])[0])
        pred_days = max(0.0, pred_days)  # clamp to non-negative
        df["Predicted_Days_Left"] = pred_days

        # ── 2. Survival margins ───────────────────────────────────────────────
        travel_orig = (distance_km / AVG_SPEED_KMPH) / 24
        travel_a = (dist_a_km / AVG_SPEED_KMPH * float(df["Road_A_Mult"].iloc[0])) / 24
        travel_b = (dist_b_km / AVG_SPEED_KMPH * float(df["Road_B_Mult"].iloc[0])) / 24

        sm_original = float(pred_days - travel_orig)
        sm_a = float(pred_days - travel_a)
        sm_b = float(pred_days - travel_b)

        # ── 3. Routing recommendation ─────────────────────────────────────────
        road_a_enc = int(self._le_road.transform([road_a])[0])
        road_b_enc = int(self._le_road.transform([road_b])[0])
        df["Road_A_Encoded"] = road_a_enc
        df["Road_B_Encoded"] = road_b_enc

        clf_inputs = df[self._clf_features]
        center_encoded = int(self._routing_model.predict(clf_inputs)[0])
        best_center: str = str(self._le_center.inverse_transform([center_encoded])[0])

        # Market pivot = not sending to original destination and not dumping
        pivot_trigger = best_center not in ("Original", "Dump")

        # ── 4. Risk level ─────────────────────────────────────────────────────
        stress = float(df["Stress_Index"].iloc[0])
        if temp_c > 15 or pred_days < 0.5:
            risk_level = "critical"
        elif temp_c > 8 or pred_days < 2.0:
            risk_level = "warning"
        else:
            risk_level = "safe"

        return {
            "predicted_shelf_life_days": pred_days,
            "predicted_shelf_life_hours": pred_days * 24.0,
            "recommended_center": best_center,
            "survival_margins": {
                "SM_Original": sm_original,
                "SM_A": sm_a,
                "SM_B": sm_b,
            },
            "stress_index": stress,
            "market_pivot_trigger": pivot_trigger,
            "risk_level": risk_level,
        }


# ── Singleton ──────────────────────────────────────────────────────────────────
_ml_service: Optional[ColdChainMLService] = None


def get_ml_service(models_dir: str = "./models") -> ColdChainMLService:
    global _ml_service
    if _ml_service is None:
        _ml_service = ColdChainMLService(models_dir)
    return _ml_service
