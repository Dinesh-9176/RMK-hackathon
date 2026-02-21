"use client";

import SimulationControls from "@/components/SimulationControls";
import { useAppContext } from "@/context/AppContext";
import { FlaskConical, Activity, Gauge, AlertTriangle } from "lucide-react";

export default function SimulationLabPage() {
    const { state } = useAppContext();
    const { isCrisis, isRandomizerOn, telemetry, shelfLifeHours } = state;

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
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Digital twin controls for cold-chain scenario testing</p>
                </div>
                {isRandomizerOn && (
                    <span className="badge badge-purple animate-pulse-green" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                        Digital Twin Simulation Running
                    </span>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: Controls */}
                <SimulationControls />

                {/* Right: Live Preview */}
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
                                { label: "Market Pivot", value: isCrisis ? "AUTO-ACTIVATED" : "Standby", color: isCrisis ? "var(--accent-red)" : "var(--text-muted)" },
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
                        <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                            <li>Slide temperature up above 15°C</li>
                            <li>Watch shelf life crash on Dashboard</li>
                            <li>Enable Crisis Mode toggle</li>
                            <li>See Market Pivot auto-activate</li>
                            <li>Navigate to Dashboard → Approve AI reroute</li>
                            <li>Toggle Sensor Noise for live variation</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
