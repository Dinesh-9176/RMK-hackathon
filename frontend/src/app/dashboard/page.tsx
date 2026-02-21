"use client";

import { useAppContext } from "@/context/AppContext";
import TelemetryCard from "@/components/TelemetryCard";
import ShelfLifePanel from "@/components/ShelfLifePanel";
import SurvivalMarginTable from "@/components/SurvivalMarginTable";
import AgentChat from "@/components/AgentChat";
import {
    Thermometer,
    Droplets,
    Activity,
    Wind,
    Battery,
    Wifi,
    DoorOpen,
    Leaf,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    MapPin,
    Timer,
} from "lucide-react";

const HALT_REASON_LABELS: Record<string, string> = {
    unknown: "Cause Unknown",
    traffic: "Traffic Jam",
    breakdown: "Vehicle Breakdown",
    "cooling-issue": "Cooling Unit Failure",
    "driver-rest": "Driver Rest Stop",
};

const HALT_REASON_COLORS: Record<string, string> = {
    unknown: "var(--accent-yellow)",
    traffic: "var(--accent-orange)",
    breakdown: "var(--accent-red)",
    "cooling-issue": "var(--accent-red)",
    "driver-rest": "var(--accent-blue)",
};

export default function DashboardPage() {
    const { state, dispatch } = useAppContext();
    const { telemetry, shelfLifeHours, isCrisis, routes, recommendations, haltEvent, currentTrip } = state;

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {/* Crisis banner */}
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)", flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-red)", margin: "0 0 2px 0" }}>🚨 EMERGENCY — Cold Chain Breach Detected</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                            Temperature exceeded safe thresholds. AI has auto-triggered Market Pivot Engine. Immediate action required.
                        </p>
                    </div>
                </div>
            )}

            {/* Halt Detection Alert */}
            {haltEvent.detected && (
                <div style={{
                    marginBottom: "20px",
                    padding: "14px 18px",
                    borderRadius: 10,
                    background: "rgba(251,146,60,0.08)",
                    border: "1px solid rgba(251,146,60,0.3)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: "rgba(251,146,60,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Timer size={20} style={{ color: "var(--accent-orange)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-orange)", margin: "0 0 4px 0" }}>
                                    🛑 Abnormal Halt Detected — Trip {currentTrip.tripId}
                                </p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                                    Vehicle stationary for <strong>{haltEvent.duration} min</strong> ·{" "}
                                    <span style={{ color: HALT_REASON_COLORS[haltEvent.reason] }}>
                                        {HALT_REASON_LABELS[haltEvent.reason]}
                                    </span>
                                    {haltEvent.location ? ` · ${haltEvent.location}` : ""}
                                </p>
                            </div>
                            <span className={`badge ${haltEvent.notificationSent ? "badge-green" : "badge-yellow"}`} style={{ flexShrink: 0 }}>
                                {haltEvent.notificationSent ? "Driver Notified" : "Notification Pending"}
                            </span>
                        </div>

                        {/* Halt reason buttons */}
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 8px 0 0", alignSelf: "center" }}>Classify halt reason:</p>
                            {(["traffic", "breakdown", "cooling-issue", "driver-rest"] as const).map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => dispatch({ type: "SET_HALT", payload: { reason, notificationSent: true } })}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: 5,
                                        border: "1px solid",
                                        borderColor: haltEvent.reason === reason ? HALT_REASON_COLORS[reason] : "var(--border-color)",
                                        background: haltEvent.reason === reason ? `${HALT_REASON_COLORS[reason]}18` : "transparent",
                                        color: haltEvent.reason === reason ? HALT_REASON_COLORS[reason] : "var(--text-muted)",
                                        fontSize: "0.68rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {HALT_REASON_LABELS[reason]}
                                </button>
                            ))}
                            <button
                                onClick={() => dispatch({ type: "SET_HALT", payload: { detected: false, duration: 0, reason: "unknown", notificationSent: false } })}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 5,
                                    border: "1px solid rgba(74,222,128,0.3)",
                                    background: "rgba(74,222,128,0.08)",
                                    color: "var(--accent-green)",
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                ✓ Resume Trip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Trip Info Bar */}
            <div style={{
                marginBottom: "20px",
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(56,189,248,0.06)",
                border: "1px solid rgba(56,189,248,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Truck size={16} style={{ color: "var(--accent-blue)" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)" }}>ACTIVE TRIP</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{currentTrip.tripId}</span>
                </div>
                <div style={{ height: 16, width: 1, background: "var(--border-color)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span style={{ fontSize: "1rem" }}>🥭</span>
                    <strong>{currentTrip.cargoName}</strong> · {currentTrip.cargoWeight}t
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <MapPin size={13} style={{ color: "var(--text-muted)" }} />
                    {currentTrip.origin} → {currentTrip.destination}
                </div>
                <div style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-green)" }}>
                    ₹{currentTrip.cargoValueINR.toLocaleString("en-IN")}
                </div>
            </div>

            {/* Page header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Dashboard</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Real-time cold-chain telemetry & predictive analytics</p>
            </div>

            {/* Telemetry Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                <TelemetryCard icon={Thermometer} label="Temperature" value={telemetry.temperature} unit="°C" trend={telemetry.temperature > 8 ? "up" : "stable"} trendValue={telemetry.temperature > 8 ? "+alert" : "OK"} color="var(--accent-blue)" isCrisis={isCrisis} />
                <TelemetryCard icon={Droplets} label="Humidity" value={telemetry.humidity} unit="%" trend="stable" trendValue="" color="var(--accent-cyan)" isCrisis={false} />
                <TelemetryCard icon={Activity} label="Vibration" value={telemetry.vibration} unit="g" trend={telemetry.vibration > 0.6 ? "up" : "stable"} trendValue={telemetry.vibration > 0.6 ? "high" : ""} color="var(--accent-purple)" isCrisis={isCrisis && telemetry.vibration > 0.6} />
                <TelemetryCard icon={Leaf} label="Ethylene" value={telemetry.ethylene} unit="ppm" trend={telemetry.ethylene > 25 ? "up" : "stable"} trendValue="" color="var(--accent-green)" isCrisis={isCrisis && telemetry.ethylene > 25} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                <TelemetryCard icon={Wind} label="CO₂ Level" value={telemetry.co2} unit="ppm" color="var(--accent-orange)" isCrisis={false} />
                <TelemetryCard icon={DoorOpen} label="Door Status" value={telemetry.doorStatus === "closed" ? "Sealed" : "OPEN"} color={telemetry.doorStatus === "open" ? "var(--accent-red)" : "var(--accent-green)"} isCrisis={telemetry.doorStatus === "open"} />
                <TelemetryCard icon={Battery} label="Battery" value={telemetry.batteryLevel} unit="%" color="var(--accent-green)" isCrisis={false} />
                <TelemetryCard icon={Wifi} label="Signal" value={telemetry.signalStrength} unit="%" color="var(--accent-blue)" isCrisis={false} />
            </div>

            {/* Shelf Life + Route Summary Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px", marginBottom: "20px" }}>
                <ShelfLifePanel hours={shelfLifeHours} temperature={telemetry.temperature} isCrisis={isCrisis} />
                <SurvivalMarginTable routes={routes} isCrisis={isCrisis} />
            </div>

            {/* AI Recommendations + Agent Chat row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "0" }}>
                {/* AI Recommendations & Approval Panel */}
                <div className={`card ${isCrisis ? "card-crisis" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>AI Recommendations</h3>
                        <span className={`badge ${isCrisis ? "badge-red" : "badge-blue"}`}>
                            {recommendations.filter((r) => r.approved === null).length} pending
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {recommendations.map((rec) => (
                            <div
                                key={rec.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 14px",
                                    background: rec.severity === "critical" ? "rgba(239, 68, 68, 0.08)" : "var(--bg-primary)",
                                    borderRadius: 8,
                                    border: rec.severity === "critical" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent",
                                }}
                            >
                                <div style={{ flexShrink: 0 }}>
                                    {rec.severity === "critical" ? <AlertTriangle size={18} style={{ color: "var(--accent-red)" }} /> :
                                        rec.severity === "high" ? <AlertTriangle size={18} style={{ color: "var(--accent-orange)" }} /> :
                                            <Clock size={18} style={{ color: "var(--accent-blue)" }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", margin: "0 0 2px 0" }}>{rec.message}</p>
                                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{rec.timestamp} · {rec.type.toUpperCase()}</p>
                                </div>
                                {rec.approved === null ? (
                                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                        <button
                                            onClick={() => dispatch({ type: "APPROVE_RECOMMENDATION", payload: rec.id })}
                                            style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(74, 222, 128, 0.15)", border: "1px solid rgba(74, 222, 128, 0.3)", color: "var(--accent-green)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                        >
                                            <CheckCircle2 size={14} /> Approve
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: "REJECT_RECOMMENDATION", payload: rec.id })}
                                            style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(248, 113, 113, 0.15)", border: "1px solid rgba(248, 113, 113, 0.3)", color: "var(--accent-red)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                        >
                                            <XCircle size={14} /> Override
                                        </button>
                                    </div>
                                ) : (
                                    <span className={`badge ${rec.approved ? "badge-green" : "badge-red"}`}>
                                        {rec.approved ? "✓ Approved" : "✗ Overridden"}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aegis Copilot Chat */}
                <AgentChat />
            </div>
        </div>
    );
}
