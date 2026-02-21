"use client";

import { useAppContext } from "@/context/AppContext";
import { Navigation, Clock, MapPin, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

export default function RouteIntelligencePage() {
    const { state } = useAppContext();
    const { routes, isCrisis, shelfLifeHours } = state;

    const chartData = routes.map((r) => ({
        name: r.name.replace("Route ", ""),
        eta: r.eta,
        margin: r.survivalMargin,
    }));

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)" }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-red)", margin: 0 }}>⚠️ Route survival margins critically compromised</p>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Route Intelligence</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>ETA vs Survival Margin comparison & route optimization</p>
            </div>

            {/* Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                    { icon: Navigation, label: "Active Routes", value: routes.length, color: "var(--accent-blue)" },
                    { icon: Clock, label: "Avg ETA", value: `${Math.round(routes.reduce((a, r) => a + r.eta, 0) / routes.length)}m`, color: "var(--accent-cyan)" },
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
                            {chartData.map((_, i) => (
                                <Cell key={i} fill="#38bdf8" />
                            ))}
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
                    return (
                        <div key={route.id} className={`card ${isCritical && isCrisis ? "card-crisis" : ""}`}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{route.name}</h4>
                                <span className={`badge ${route.status === "on-track" ? "badge-green" : route.status === "delayed" ? "badge-yellow" : "badge-red"}`}>
                                    {route.status.replace("-", " ").toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <MapPin size={14} />
                                {route.origin}
                                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                                {route.destination}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>ETA</p>
                                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{Math.floor(route.eta / 60)}h {route.eta % 60}m</p>
                                </div>
                                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Margin</p>
                                    <p style={{ fontSize: "1rem", fontWeight: 600, color: route.survivalMargin < 60 ? "var(--accent-red)" : "var(--accent-green)", margin: 0 }}>
                                        {route.survivalMargin >= 60 ? `${Math.floor(route.survivalMargin / 60)}h ${route.survivalMargin % 60}m` : `${Math.round(route.survivalMargin)}m`}
                                    </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Distance</p>
                                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{route.distance} km</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
