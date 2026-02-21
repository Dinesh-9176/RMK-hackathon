"use client";

import SimulationControls from "@/components/SimulationControls";
import { useAppContext } from "@/context/AppContext";
import { useMLPrediction } from "@/hooks/useMLPrediction";
import { FlaskConical, Activity, Gauge, AlertTriangle, Cpu, TrendingDown } from "lucide-react";

export default function SimulationLabPage() {
    const { state } = useAppContext();
    const { isCrisis, isRandomizerOn, telemetry, shelfLifeHours, mlPrediction } = state;

    // Wire real ML prediction on every temperature change
    const { loading: mlLoading, error: mlError } = useMLPrediction(
        state.temperature,
        {
            humidity: telemetry.humidity,
            vibration: telemetry.vibration,
            ethylene: telemetry.ethylene,
            co2: telemetry.co2,
            door_status: telemetry.doorStatus,
            battery_level: telemetry.batteryLevel,
            signal_strength: telemetry.signalStrength,
        },
        true // autoAnalyze: triggers agent analysis on crisis threshold
    );

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)" }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-red)", margin: "0 0 2px 0" }}>🚨 Crisis Simulation Active</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>All sensor data is operating in failure band. Navigate to Dashboard to observe real-time impact.</p>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Simulation Lab</h1>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Digital twin controls · real XGBoost ML predictions · cold-chain scenario testing</p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {mlLoading && (
                        <span className="badge badge-blue" style={{ padding: "6px 12px", fontSize: "0.72rem" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-blue)", display: "inline-block", animation: "pulse-dot 1s infinite", marginRight: 6 }} />
                            ML Predicting…
                        </span>
                    )}
                    {isRandomizerOn && (
                        <span className="badge badge-purple animate-pulse-green" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                            Digital Twin Simulation Running
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: Controls */}
                <SimulationControls />

                {/* Right: Live Preview + ML output */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34, 211, 238, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Activity size={20} style={{ color: "var(--accent-cyan)" }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Live Sensor Feed</h3>
                                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Real-time telemetry values</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            {[
                                { label: "Temperature", value: `${telemetry.temperature.toFixed(1)}°C`, color: telemetry.temperature > 8 ? "var(--accent-red)" : "var(--accent-blue)" },
                                { label: "Humidity", value: `${telemetry.humidity.toFixed(1)}%`, color: "var(--accent-cyan)" },
                                { label: "Vibration", value: `${telemetry.vibration.toFixed(2)}g`, color: telemetry.vibration > 0.6 ? "var(--accent-red)" : "var(--accent-green)" },
                                { label: "Ethylene", value: `${telemetry.ethylene.toFixed(1)} ppm`, color: telemetry.ethylene > 25 ? "var(--accent-red)" : "var(--accent-green)" },
                                { label: "CO₂", value: `${telemetry.co2.toFixed(0)} ppm`, color: "var(--accent-orange)" },
                                { label: "Battery", value: `${telemetry.batteryLevel}%`, color: "var(--accent-green)" },
                            ].map((item) => (
                                <div key={item.label} style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.label}</span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: item.color, fontFamily: "var(--font-mono)" }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* XGBoost ML Prediction Output */}
                    <div className={`card ${mlPrediction?.marketPivotTrigger ? "card-crisis" : ""}`} style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Cpu size={20} style={{ color: "var(--accent-purple)" }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>XGBoost ML Prediction</h3>
                                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                                    {mlLoading ? "Computing…" : mlPrediction ? "Live from backend model" : "Waiting for backend…"}
                                </p>
                            </div>
                            {mlError && (
                                <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--accent-yellow)", padding: "2px 8px", borderRadius: 4, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)" }}>
                                    Offline — using local estimate
                                </span>
                            )}
                        </div>

                        {mlPrediction ? (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                                    {[
                                        { label: "ML Shelf Life", value: `${mlPrediction.shelfLifeHours.toFixed(1)}h`, color: mlPrediction.riskLevel === "critical" ? "var(--accent-red)" : mlPrediction.riskLevel === "warning" ? "var(--accent-yellow)" : "var(--accent-green)" },
                                        { label: "Risk Level", value: mlPrediction.riskLevel.toUpperCase(), color: mlPrediction.riskLevel === "critical" ? "var(--accent-red)" : mlPrediction.riskLevel === "warning" ? "var(--accent-yellow)" : "var(--accent-green)" },
                                        { label: "Stress Index", value: mlPrediction.stressIndex.toFixed(3), color: mlPrediction.stressIndex > 2 ? "var(--accent-red)" : "var(--accent-cyan)" },
                                        { label: "Best Center", value: mlPrediction.recommendedCenter || "—", color: "var(--accent-purple)" },
                                    ].map((item) => (
                                        <div key={item.label} style={{ padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                            <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase" }}>{item.label}</p>
                                            <p style={{ fontSize: "1rem", fontWeight: 700, color: item.color, margin: 0, fontFamily: "monospace" }}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {mlPrediction.marketPivotTrigger && (
                                    <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-red)", margin: "0 0 2px 0" }}>
                                            🚨 Market Pivot Triggered by ML Model
                                        </p>
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>
                                            XGBoost recommends immediate reroute to {mlPrediction.recommendedCenter}. Navigate to Market Pivot Engine.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: "16px", background: "var(--bg-primary)", borderRadius: 8, textAlign: "center" }}>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                                    {mlLoading ? "⏳ Running XGBoost model…" : "Start backend (uvicorn) to enable live ML predictions"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Impact Preview */}
                    <div className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(250, 204, 21, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Gauge size={20} style={{ color: "var(--accent-yellow)" }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Impact Preview</h3>
                                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Predicted effects of current simulation</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { label: "Shelf Life Remaining", value: `${shelfLifeHours >= 1 ? Math.round(shelfLifeHours) + " hours" : (shelfLifeHours * 60).toFixed(0) + " min"}`, color: shelfLifeHours <= 3 ? "var(--accent-red)" : shelfLifeHours <= 12 ? "var(--accent-yellow)" : "var(--accent-green)" },
                                { label: "System Status", value: state.systemStatus.toUpperCase(), color: state.systemStatus === "crisis" ? "var(--accent-red)" : state.systemStatus === "warning" ? "var(--accent-yellow)" : "var(--accent-green)" },
                                { label: "Active Routes At Risk", value: `${state.routes.filter((r) => r.status === "critical").length} of ${state.routes.length}`, color: state.routes.some((r) => r.status === "critical") ? "var(--accent-red)" : "var(--accent-green)" },
                                { label: "Market Pivot", value: isCrisis || mlPrediction?.marketPivotTrigger ? "AUTO-ACTIVATED" : "Standby", color: isCrisis || mlPrediction?.marketPivotTrigger ? "var(--accent-red)" : "var(--text-muted)" },
                            ].map((item) => (
                                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{item.label}</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: item.color }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick guide */}
                    <div className="card" style={{ padding: "1.25rem", background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <FlaskConical size={16} style={{ color: "var(--accent-blue)" }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-blue)" }}>Demo Flow Guide</span>
                        </div>
                        <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.9 }}>
                            <li>Assign a trip in <strong>Trip Assignment</strong> page</li>
                            <li>Slide temperature up above 15°C → watch ML shelf life crash</li>
                            <li>Enable Crisis Mode toggle → halt detection activates</li>
                            <li>XGBoost triggers Market Pivot automatically</li>
                            <li>Navigate to <strong>Dashboard</strong> → approve AI reroute recommendation</li>
                            <li>Go to <strong>Market Pivot Engine</strong> → see INR rescue value recovery</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
