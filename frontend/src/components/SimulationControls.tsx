"use client";

import { useAppContext } from "@/context/AppContext";
import { Thermometer, Zap, Radio } from "lucide-react";

export default function SimulationControls() {
    const { state, dispatch } = useAppContext();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Temperature Override */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Thermometer size={20} style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Temperature Override</h3>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Adjust cold-chain temperature simulation</p>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <span style={{
                        fontSize: "4rem", fontWeight: 700, lineHeight: 1,
                        color: state.temperature > 15 ? "var(--accent-red)" : state.temperature > 8 ? "var(--accent-yellow)" : "var(--accent-blue)",
                        transition: "color 0.3s",
                    }}>
                        {state.temperature.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "1.5rem", color: "var(--text-muted)", marginLeft: "4px" }}>°C</span>
                </div>

                <div style={{ padding: "0 8px" }}>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={state.temperature}
                        onChange={(e) => dispatch({ type: "SET_TEMPERATURE", payload: parseFloat(e.target.value) })}
                        className={state.isCrisis ? "crisis-slider" : ""}
                        style={{ width: "100%" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px" }}>
                        <span>0°C</span>
                        <span>Safe Zone</span>
                        <span>50°C</span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px" }}>
                    {[
                        { label: "Shelf Life", value: `${state.shelfLifeHours >= 1 ? Math.round(state.shelfLifeHours) + "h" : state.shelfLifeHours.toFixed(1) + "h"}`, color: state.shelfLifeHours <= 3 ? "var(--accent-red)" : state.shelfLifeHours <= 12 ? "var(--accent-yellow)" : "var(--accent-green)" },
                        { label: "Status", value: state.systemStatus.toUpperCase(), color: state.systemStatus === "crisis" ? "var(--accent-red)" : state.systemStatus === "warning" ? "var(--accent-yellow)" : "var(--accent-green)" },
                        { label: "Decay", value: state.temperature > 8 ? "FAST" : state.temperature > 4 ? "MED" : "SLOW", color: state.temperature > 8 ? "var(--accent-red)" : state.temperature > 4 ? "var(--accent-yellow)" : "var(--accent-green)" },
                    ].map((item) => (
                        <div key={item.label} style={{ textAlign: "center", padding: "10px", background: "var(--bg-primary)", borderRadius: 8 }}>
                            <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                            <p style={{ fontSize: "1rem", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Crisis Mode Toggle */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: state.isCrisis ? "rgba(248, 113, 113, 0.15)" : "rgba(250, 204, 21, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Zap size={20} style={{ color: state.isCrisis ? "var(--accent-red)" : "var(--accent-yellow)" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Crisis Mode</h3>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>{state.isCrisis ? "Active — failure simulation running" : "Normal operations"}</p>
                        </div>
                    </div>
                    <button
                        className={`toggle-switch ${state.isCrisis ? "active crisis-toggle" : ""}`}
                        onClick={() => dispatch({ type: "SET_CRISIS", payload: !state.isCrisis })}
                        aria-label="Toggle crisis mode"
                    >
                        <div className="toggle-knob" />
                    </button>
                </div>
                {state.isCrisis && (
                    <div className="emergency-banner" style={{ marginTop: "16px" }}>
                        <p style={{ fontSize: "0.8rem", color: "var(--accent-red)", fontWeight: 600, margin: "0 0 4px 0" }}>⚠️ Crisis Simulation Active</p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
                            Global isChaos = true • Randomizer shifted to failure range • UI in emergency mode
                        </p>
                    </div>
                )}
            </div>

            {/* Random Telemetry Generator */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Radio size={20} style={{ color: "var(--accent-purple)" }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Sensor Noise Generator</h3>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>{state.isRandomizerOn ? "Generating variations every 3s" : "Enable live sensor noise"}</p>
                        </div>
                    </div>
                    <button
                        className={`toggle-switch ${state.isRandomizerOn ? "active" : ""}`}
                        onClick={() => dispatch({ type: "SET_RANDOMIZER", payload: !state.isRandomizerOn })}
                        aria-label="Toggle randomizer"
                    >
                        <div className="toggle-knob" />
                    </button>
                </div>
                {state.isRandomizerOn && (
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge badge-purple">
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                            Digital Twin Simulation Running
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
