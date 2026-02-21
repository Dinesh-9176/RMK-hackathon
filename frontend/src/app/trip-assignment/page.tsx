"use client";

import { useState } from "react";
import { useAppContext, calculateETA } from "@/context/AppContext";
import {
    Truck, Package, MapPin, Clock, Navigation, CheckCircle2,
    AlertTriangle, ArrowRight, Gauge, Wind, IndianRupee,
} from "lucide-react";

const CARGO_OPTIONS = [
    { name: "Mangoes",      weight: 2.4, valueINR: 700000,  icon: "🥭" },
    { name: "Tomatoes",     weight: 1.8, valueINR: 320000,  icon: "🍅" },
    { name: "Leafy Greens", weight: 0.9, valueINR: 150000,  icon: "🥬" },
    { name: "Dairy",        weight: 3.1, valueINR: 560000,  icon: "🥛" },
    { name: "Berries",      weight: 1.2, valueINR: 480000,  icon: "🍓" },
    { name: "Fish",         weight: 2.0, valueINR: 410000,  icon: "🐟" },
];

const ROUTE_OPTIONS = [
    { id: "R1", name: "Route Alpha", origin: "Farm Hub A", destination: "Center A (Mumbai)", distance: 245, roadType: "NH" as const, trafficMult: 1.0 },
    { id: "R2", name: "Route Beta",  origin: "Farm Hub B", destination: "Center B (Pune)",   distance: 312, roadType: "SH" as const, trafficMult: 1.5 },
    { id: "R3", name: "Route Gamma", origin: "Farm Hub C", destination: "Center A (Mumbai)", distance: 178, roadType: "NH" as const, trafficMult: 1.0 },
    { id: "R4", name: "Route Delta", origin: "Farm Hub A", destination: "Market D (Nashik)", distance: 405, roadType: "District" as const, trafficMult: 1.8 },
];

const WEATHER_LABELS: Record<string, string> = {
    clear: "Clear ☀️",
    rain: "Rain 🌧️",
    fog: "Fog 🌫️",
    storm: "Storm ⛈️",
};

const ROAD_SPEED: Record<string, number> = { NH: 80, SH: 60, District: 40, Mixed: 65 };
const WEATHER_MULT: Record<string, number> = { clear: 1.0, rain: 0.8, fog: 0.7, storm: 0.5 };

const ROAD_BADGE: Record<string, { bg: string; color: string }> = {
    NH:       { bg: "rgba(56,189,248,0.15)",  color: "#38bdf8" },
    SH:       { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
    District: { bg: "rgba(250,204,21,0.15)",  color: "#facc15" },
};

function fmt(n: number) {
    return "₹" + n.toLocaleString("en-IN");
}

export default function TripAssignmentPage() {
    const { state, dispatch } = useAppContext();
    const { weatherCondition, currentTrip, shelfLifeHours } = state;

    const [selectedCargo, setSelectedCargo] = useState(CARGO_OPTIONS[0]);
    const [selectedRoute, setSelectedRoute] = useState(ROUTE_OPTIONS[0]);
    const [tripStarted, setTripStarted] = useState(false);
    const [localWeather, setLocalWeather] = useState<"clear" | "rain" | "fog" | "storm">(weatherCondition);

    // Live ETA calculation
    const liveETA = calculateETA(selectedRoute.distance, selectedRoute.roadType, selectedRoute.trafficMult, localWeather);
    const shelfMinutes = shelfLifeHours * 60;
    const survivalMargin = Math.max(0, shelfMinutes - liveETA);
    const isFeasible = survivalMargin > 30;
    const effectiveSpeed = Math.round(ROAD_SPEED[selectedRoute.roadType] * WEATHER_MULT[localWeather] / selectedRoute.trafficMult);

    function handleStartTrip() {
        const tripId = "TRIP-" + Date.now().toString(36).toUpperCase();
        dispatch({
            type: "SET_TRIP",
            payload: {
                tripId,
                cargoName: selectedCargo.name,
                cargoWeight: selectedCargo.weight,
                cargoValueINR: selectedCargo.valueINR,
                destination: selectedRoute.destination,
                origin: selectedRoute.origin,
                roadType: selectedRoute.roadType === "District" ? "SH" : selectedRoute.roadType as "NH" | "SH" | "Mixed",
                assignedAt: new Date().toISOString(),
            },
        });
        dispatch({ type: "SET_WEATHER", payload: localWeather });
        setTripStarted(true);
    }

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Trip Assignment</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Select cargo, route &amp; weather · live NH / SH / District ETA · survival margin check
                </p>
            </div>

            {/* Success Banner */}
            {tripStarted && (
                <div style={{
                    marginBottom: "20px", padding: "16px 20px",
                    borderRadius: 10, background: "rgba(74,222,128,0.08)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    display: "flex", alignItems: "center", gap: "12px",
                }}>
                    <CheckCircle2 size={22} style={{ color: "var(--accent-green)", flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-green)", margin: "0 0 2px 0" }}>
                            ✅ Trip {currentTrip.tripId} Assigned Successfully
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                            {selectedCargo.icon} {selectedCargo.name} ({selectedCargo.weight}t · {fmt(selectedCargo.valueINR)})&nbsp;
                            → {selectedRoute.destination} via {selectedRoute.name} [{selectedRoute.roadType}] · ETA {Math.floor(liveETA / 60)}h {liveETA % 60}m
                        </p>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left Column — selectors */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Cargo Selection */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <Package size={18} style={{ color: "var(--accent-blue)" }} />
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Select Cargo</h3>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {CARGO_OPTIONS.map((cargo) => {
                                const active = selectedCargo.name === cargo.name;
                                return (
                                    <button
                                        key={cargo.name}
                                        onClick={() => { setSelectedCargo(cargo); setTripStarted(false); }}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: 8,
                                            border: "1px solid",
                                            borderColor: active ? "var(--accent-blue)" : "var(--border-color)",
                                            background: active ? "rgba(56,189,248,0.1)" : "var(--bg-primary)",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{cargo.icon}</div>
                                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: active ? "var(--accent-blue)" : "var(--text-primary)", margin: "0 0 2px 0" }}>{cargo.name}</p>
                                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{cargo.weight}t · {fmt(cargo.valueINR)}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Weather Selection */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <Wind size={18} style={{ color: "var(--accent-cyan)" }} />
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Weather Condition</h3>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {(["clear", "rain", "fog", "storm"] as const).map((w) => (
                                <button
                                    key={w}
                                    onClick={() => { setLocalWeather(w); setTripStarted(false); }}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: 6,
                                        border: "1px solid",
                                        borderColor: localWeather === w ? "var(--accent-cyan)" : "var(--border-color)",
                                        background: localWeather === w ? "rgba(34,211,238,0.1)" : "transparent",
                                        color: localWeather === w ? "var(--accent-cyan)" : "var(--text-muted)",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {WEATHER_LABELS[w]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Route Selection */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <Navigation size={18} style={{ color: "var(--accent-purple)" }} />
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Select Route</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {ROUTE_OPTIONS.map((route) => {
                                const active = selectedRoute.id === route.id;
                                const eta = calculateETA(route.distance, route.roadType, route.trafficMult, localWeather);
                                const margin = Math.max(0, shelfMinutes - eta);
                                const ok = margin > 30;
                                const badge = ROAD_BADGE[route.roadType];
                                return (
                                    <button
                                        key={route.id}
                                        onClick={() => { setSelectedRoute(route); setTripStarted(false); }}
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: 8,
                                            border: "1px solid",
                                            borderColor: active ? "var(--accent-purple)" : "var(--border-color)",
                                            background: active ? "rgba(167,139,250,0.08)" : "var(--bg-primary)",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: active ? "var(--accent-purple)" : "var(--text-primary)" }}>{route.name}</span>
                                                <span style={{ padding: "1px 6px", borderRadius: 3, background: badge.bg, color: badge.color, fontSize: "0.6rem", fontWeight: 700 }}>
                                                    {route.roadType}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: ok ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 600 }}>
                                                {ok ? "✓ Feasible" : "⚠ At Risk"}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                            <MapPin size={12} />
                                            {route.origin}
                                            <ArrowRight size={12} />
                                            {route.destination}
                                        </div>
                                        <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                            <span>{route.distance} km</span>
                                            <span>ETA: {Math.floor(eta / 60)}h {eta % 60}m</span>
                                            <span style={{ color: ok ? "var(--accent-green)" : "var(--accent-red)" }}>
                                                Margin: {margin >= 60 ? `${Math.floor(margin / 60)}h ${margin % 60}m` : `${margin}m`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column — Live ETA preview + Assign */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Live ETA Preview Panel */}
                    <div className={`card ${!isFeasible ? "card-crisis" : ""}`} style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 10,
                                background: isFeasible ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Clock size={20} style={{ color: isFeasible ? "var(--accent-green)" : "var(--accent-red)" }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Live ETA Preview</h3>
                                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>
                                    {selectedRoute.roadType} road · {WEATHER_LABELS[localWeather]} · {selectedRoute.trafficMult}× traffic
                                </p>
                            </div>
                        </div>

                        {/* ETA Big Number */}
                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                            <p style={{ fontSize: "3rem", fontWeight: 800, color: isFeasible ? "var(--accent-green)" : "var(--accent-red)", margin: 0, lineHeight: 1 }}>
                                {Math.floor(liveETA / 60)}h {liveETA % 60}m
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "6px 0 0 0" }}>
                                Estimated arrival at {selectedRoute.destination}
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                            {[
                                { label: "Route Distance", value: `${selectedRoute.distance} km`, color: "var(--text-primary)" },
                                { label: "Effective Speed", value: `${effectiveSpeed} km/h`, color: "var(--accent-cyan)" },
                                { label: "Shelf Life Left", value: `${shelfLifeHours >= 1 ? Math.round(shelfLifeHours) + "h" : (shelfLifeHours * 60).toFixed(0) + "m"}`, color: shelfLifeHours <= 6 ? "var(--accent-red)" : "var(--accent-green)" },
                                { label: "Survival Margin", value: survivalMargin >= 60 ? `${Math.floor(survivalMargin / 60)}h ${survivalMargin % 60}m` : `${survivalMargin}m`, color: survivalMargin < 30 ? "var(--accent-red)" : survivalMargin < 120 ? "var(--accent-yellow)" : "var(--accent-green)" },
                            ].map((item) => (
                                <div key={item.label} style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase" }}>{item.label}</p>
                                    <p style={{ fontSize: "1rem", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* ETA formula */}
                        <div style={{ padding: "10px 12px", background: "rgba(56,189,248,0.06)", borderRadius: 8, marginBottom: "16px" }}>
                            <p style={{ fontSize: "0.65rem", color: "var(--accent-blue)", fontWeight: 600, margin: "0 0 4px 0" }}>ETA Calculation Formula</p>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, fontFamily: "monospace" }}>
                                {selectedRoute.distance} km ÷ ({ROAD_SPEED[selectedRoute.roadType]} km/h base × {(WEATHER_MULT[localWeather] * 100).toFixed(0)}% weather ÷ {selectedRoute.trafficMult}× traffic) = {liveETA} min
                            </p>
                        </div>

                        {!isFeasible && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: "16px", border: "1px solid rgba(239,68,68,0.2)" }}>
                                <AlertTriangle size={16} style={{ color: "var(--accent-red)", flexShrink: 0 }} />
                                <p style={{ fontSize: "0.75rem", color: "var(--accent-red)", margin: 0 }}>
                                    ⚠️ Survival margin critically low. Consider a shorter route or trigger Market Pivot Engine.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Cargo value summary */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <IndianRupee size={18} style={{ color: "var(--accent-green)" }} />
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Cargo Value Summary</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[
                                { label: "Cargo", value: `${selectedCargo.icon} ${selectedCargo.name}` },
                                { label: "Weight", value: `${selectedCargo.weight} tons` },
                                { label: "Total Value", value: fmt(selectedCargo.valueINR), color: "var(--accent-green)" },
                                { label: "Value at Risk", value: isFeasible ? fmt(0) : fmt(selectedCargo.valueINR), color: isFeasible ? "var(--accent-green)" : "var(--accent-red)" },
                            ].map((item) => (
                                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "var(--bg-primary)", borderRadius: 6 }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.label}</span>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: item.color ?? "var(--text-primary)" }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assign Button */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <Truck size={18} style={{ color: "var(--accent-purple)" }} />
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Assign &amp; Dispatch</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                            <div style={{ padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                <strong>Driver:</strong> Kumar Rajan (DL-MH-4892) · Truck: MH-14-AB-7712
                            </div>
                            <div style={{ padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 8, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                <strong>Cold Unit:</strong> Carrier X430 · Target: 2–4°C · Backup power: 8h
                            </div>
                        </div>
                        <button
                            onClick={handleStartTrip}
                            disabled={tripStarted}
                            style={{
                                width: "100%",
                                padding: "14px",
                                borderRadius: 10,
                                border: "none",
                                background: tripStarted
                                    ? "rgba(74,222,128,0.15)"
                                    : isFeasible
                                        ? "linear-gradient(135deg, #38bdf8, #818cf8)"
                                        : "linear-gradient(135deg, #f97316, #ef4444)",
                                color: tripStarted ? "var(--accent-green)" : "#fff",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                cursor: tripStarted ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                transition: "all 0.2s",
                            }}
                        >
                            {tripStarted ? (
                                <><CheckCircle2 size={18} /> Trip Dispatched</>
                            ) : isFeasible ? (
                                <><Truck size={18} /> Assign &amp; Start Trip</>
                            ) : (
                                <><AlertTriangle size={18} /> Assign with Risk Override</>
                            )}
                        </button>
                        {!tripStarted && !isFeasible && (
                            <p style={{ fontSize: "0.65rem", color: "var(--accent-red)", textAlign: "center", margin: "8px 0 0 0" }}>
                                Warning: Cargo may spoil before arrival. Market Pivot may auto-activate.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
