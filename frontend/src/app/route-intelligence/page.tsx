"use client";

import { useAppContext } from "@/context/AppContext";
import { Navigation, Clock, MapPin, TrendingUp, AlertTriangle, ArrowRight, Wind, Gauge, Thermometer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const WEATHER_LABELS: Record<string, string> = {
    clear: "Clear ☀️",
    rain: "Rain 🌧️",
    fog: "Fog 🌫️",
    storm: "Storm ⛈️",
};

const WEATHER_SPEED_MULT: Record<string, number> = {
    clear: 1.0,
    rain: 0.8,
    fog: 0.7,
    storm: 0.5,
};

const ROAD_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    NH: { bg: "rgba(56,189,248,0.15)", color: "#38bdf8", label: "NH" },
    SH: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", label: "SH" },
    District: { bg: "rgba(250,204,21,0.15)", color: "#facc15", label: "DIST" },
    Mixed: { bg: "rgba(74,222,128,0.15)", color: "#4ade80", label: "MIX" },
};

const WEATHER_RISK_BADGE: Record<string, { bg: string; color: string }> = {
    low: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    medium: { bg: "rgba(250,204,21,0.15)", color: "#facc15" },
    high: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

export default function RouteIntelligencePage() {
    const { state, dispatch } = useAppContext();
    const { routes, isCrisis, shelfLifeHours, weatherCondition } = state;

    const chartData = routes.map((r) => ({
        name: r.name.replace("Route ", ""),
        eta: r.eta,
        margin: r.survivalMargin,
    }));

    const avgSpeed = routes.length
        ? Math.round(routes.reduce((a, r) => a + (r.speedKmh ?? 0), 0) / routes.length)
        : 0;

    const weatherMult = WEATHER_SPEED_MULT[weatherCondition] ?? 1.0;

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)" }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-red)", margin: 0 }}>
                            ⚠️ Route survival margins critically compromised — consider Market Pivot
                        </p>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Route Intelligence</h1>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                        NH / SH / District road-type-aware ETA · weather impact · survival margin
                    </p>
                </div>

                {/* Weather Selector */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(["clear", "rain", "fog", "storm"] as const).map((w) => (
                        <button
                            key={w}
                            onClick={() => dispatch({ type: "SET_WEATHER", payload: w })}
                            style={{
                                padding: "5px 12px",
                                borderRadius: 6,
                                border: "1px solid",
                                borderColor: weatherCondition === w ? "var(--accent-blue)" : "var(--border-color)",
                                background: weatherCondition === w ? "rgba(56,189,248,0.12)" : "transparent",
                                color: weatherCondition === w ? "var(--accent-blue)" : "var(--text-muted)",
                                fontSize: "0.72rem",
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

            {/* Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                    { icon: Navigation, label: "Active Routes", value: routes.length, color: "var(--accent-blue)" },
                    { icon: Clock, label: "Avg ETA", value: `${Math.round(routes.reduce((a, r) => a + r.eta, 0) / Math.max(routes.length, 1))}m`, color: "var(--accent-cyan)" },
                    { icon: TrendingUp, label: "Shelf Life", value: `${Math.round(shelfLifeHours)}h`, color: shelfLifeHours <= 6 ? "var(--accent-red)" : "var(--accent-green)" },
                    { icon: MapPin, label: "Critical Routes", value: routes.filter((r) => r.status === "critical").length, color: "var(--accent-red)" },
                ].map((item) => (
                    <div key={item.label} className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <item.icon size={22} style={{ color: item.color }} />
                        </div>
                        <div>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>{item.label}</p>
                            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Weather + Speed context row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wind size={22} style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Weather Condition</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{WEATHER_LABELS[weatherCondition]}</p>
                    </div>
                </div>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Gauge size={22} style={{ color: "var(--accent-purple)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Speed Multiplier</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: weatherMult < 0.7 ? "var(--accent-red)" : weatherMult < 1.0 ? "var(--accent-yellow)" : "var(--accent-green)", margin: 0 }}>
                            {(weatherMult * 100).toFixed(0)}% capacity
                        </p>
                    </div>
                </div>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Thermometer size={22} style={{ color: "var(--accent-green)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Avg Fleet Speed</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{avgSpeed} km/h</p>
                    </div>
                </div>
            </div>

            {/* Speed legend */}
            <div className="card" style={{ marginBottom: "20px", padding: "1rem 1.25rem", background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent-blue)", margin: "0 0 8px 0" }}>Road Type Speed Reference (base @ clear weather)</p>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    {[
                        { type: "NH", speed: "80 km/h", badge: ROAD_BADGE.NH },
                        { type: "SH", speed: "60 km/h", badge: ROAD_BADGE.SH },
                        { type: "District", speed: "40 km/h", badge: ROAD_BADGE.District },
                    ].map(({ type, speed, badge }) => (
                        <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, background: badge.bg, color: badge.color, fontSize: "0.65rem", fontWeight: 700 }}>{badge.label}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{type} → <strong>{speed}</strong></span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                (×{weatherMult} weather = {Math.round(
                                    (type === "NH" ? 80 : type === "SH" ? 60 : 40) * weatherMult
                                )} km/h)
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: "20px", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 20px 0" }}>ETA vs Survival Margin (minutes)</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} barCategoryGap="20%">
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.8rem" }}
                            labelStyle={{ color: "#0f172a" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#64748b" }} />
                        <Bar dataKey="eta" name="ETA" radius={[4, 4, 0, 0]}>
                            {chartData.map((_, i) => <Cell key={i} fill="#38bdf8" />)}
                        </Bar>
                        <Bar dataKey="margin" name="Survival Margin" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.margin < 60 ? "#ef4444" : entry.margin < 120 ? "#facc15" : "#4ade80"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Route Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {routes.map((route) => {
                    const isCritical = route.status === "critical";
                    const roadBadge = ROAD_BADGE[route.roadType ?? "NH"];
                    const weatherBadge = WEATHER_RISK_BADGE[route.weatherRisk ?? "low"];
                    return (
                        <div key={route.id} className={`card ${isCritical && isCrisis ? "card-crisis" : ""}`}>
                            {/* Header row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{route.name}</h4>
                                    {/* Road type badge */}
                                    {roadBadge && (
                                        <span style={{
                                            padding: "2px 7px", borderRadius: 4,
                                            background: roadBadge.bg, color: roadBadge.color,
                                            fontSize: "0.6rem", fontWeight: 700,
                                        }}>
                                            {roadBadge.label}
                                        </span>
                                    )}
                                    {/* Weather risk badge */}
                                    <span style={{
                                        padding: "2px 7px", borderRadius: 4,
                                        background: weatherBadge.bg, color: weatherBadge.color,
                                        fontSize: "0.6rem", fontWeight: 700,
                                    }}>
                                        {(route.weatherRisk ?? "low").toUpperCase()} RISK
                                    </span>
                                </div>
                                <span className={`badge ${route.status === "on-track" ? "badge-green" : route.status === "delayed" ? "badge-yellow" : "badge-red"}`}>
                                    {route.status.replace("-", " ").toUpperCase()}
                                </span>
                            </div>

                            {/* Origin → Destination */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <MapPin size={14} />
                                {route.origin}
                                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                                {route.destination}
                            </div>

                            {/* Stats grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                                <div style={{ textAlign: "center", padding: "8px 4px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>ETA</p>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                                        {Math.floor(route.eta / 60)}h {route.eta % 60}m
                                    </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "8px 4px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Margin</p>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: route.survivalMargin < 60 ? "var(--accent-red)" : "var(--accent-green)", margin: 0 }}>
                                        {route.survivalMargin >= 60
                                            ? `${Math.floor(route.survivalMargin / 60)}h ${route.survivalMargin % 60}m`
                                            : `${Math.round(route.survivalMargin)}m`}
                                    </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "8px 4px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Distance</p>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{route.distance} km</p>
                                </div>
                                <div style={{ textAlign: "center", padding: "8px 4px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Speed</p>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--accent-cyan)", margin: 0 }}>
                                        {route.speedKmh ?? "—"} km/h
                                    </p>
                                </div>
                            </div>

                            {/* ETA formula hint */}
                            <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "10px 0 0 0" }}>
                                Formula: {route.distance} km ÷ ({route.roadType ?? "NH"} base ×{" "}
                                {(weatherMult * 100).toFixed(0)}% weather ÷ {route.trafficMultiplier ?? 1.0}× traffic) = {route.eta} min
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
