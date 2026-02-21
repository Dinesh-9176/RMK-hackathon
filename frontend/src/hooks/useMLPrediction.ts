"use client";

/**
 * useMLPrediction
 * ---------------
 * Calls the FastAPI /api/predict/quick endpoint whenever `temperature` changes
 * (debounced 400 ms) and dispatches SET_ML_PREDICTION + optional agent analysis.
 *
 * Usage in SimulationLab:
 *   const { loading, error } = useMLPrediction(state.temperature, state.telemetry);
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";

export function useMLPrediction(
  temperature: number,
  telemetry?: {
    humidity: number;
    vibration: number;
    ethylene: number;
    co2: number;
    door_status: string;
    battery_level: number;
    signal_strength: number;
  },
  autoAnalyze = false
) {
  const { dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPrediction = useCallback(
    async (temp: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.predict.quick(
          temp,
          telemetry?.humidity ?? 85,
          telemetry?.vibration ?? 0.3,
          250
        );

        dispatch({
          type: "SET_ML_PREDICTION",
          payload: {
            shelfLifeHours: result.shelf_life_hours,
            shelfLifeDays: result.shelf_life_days,
            riskLevel: result.risk_level,
            stressIndex: result.stress_index,
            marketPivotTrigger: result.market_pivot_trigger,
            recommendedCenter: result.recommended_center,
            survivalMarginA: 0,
            survivalMarginB: 0,
            survivalMarginOriginal: 0,
          },
        });

        // Autonomous agent analysis on crisis threshold
        if (autoAnalyze && (temp > 12 || result.market_pivot_trigger)) {
          try {
            const agentRes = await api.agent.analyze({
              telemetry: {
                temperature: temp,
                humidity: telemetry?.humidity ?? 85,
                vibration: telemetry?.vibration ?? 0.3,
                ethylene: telemetry?.ethylene ?? 12,
                co2: telemetry?.co2 ?? 450,
                door_status:
                  (telemetry?.door_status as "open" | "closed") ?? "closed",
                battery_level: telemetry?.battery_level ?? 100,
                signal_strength: telemetry?.signal_strength ?? 100,
              },
            });
            dispatch({ type: "SET_AGENT_MESSAGE", payload: agentRes.message });

            if (agentRes.action_required) {
              dispatch({
                type: "SET_CRISIS",
                payload: true,
              });
            }
          } catch {
            // Agent call failure is non-fatal
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, telemetry, autoAnalyze]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPrediction(temperature), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [temperature, runPrediction]);

  return { loading, error, runPrediction };
}
