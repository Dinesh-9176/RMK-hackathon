"use client";

import { useAppContext } from "@/context/AppContext";
import { ShoppingCart, MapPin, Clock, TrendingUp, AlertTriangle, Snowflake, Store, Factory, CheckCircle2 } from "lucide-react";

export default function MarketPivotPage() {
    const { state } = useAppContext();
    const { rescuePoints, isCrisis, shelfLifeHours } = state;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "cold-storage": return <Snowflake size={18} style={{ color: "var(--accent-blue)" }} />;
            case "market": return <Store size={18} style={{ color: "var(--accent-green)" }} />;
            case "processing": return <Factory size={18} style={{ color: "var(--accent-purple)" }} />;
            default: return <MapPin size={18} />;
        }
    };

    const sortedPoints = [...rescuePoints].sort((a, b) => b.recoveryChance - a.recoveryChance);

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)" }} />
                    <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-red)", margin: "0 0 2px 0" }}>🚨 Market Pivot Auto-Activated</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>Cold chain breach detected. AI recommends immediate cargo diversion to nearest rescue point.</p>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Market Pivot Engine</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Rescue points & cargo recovery optimization</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                    { icon: MapPin, label: "Rescue Points", value: rescuePoints.length, color: "var(--accent-blue)" },
                    { icon: CheckCircle2, label: "Available Now", value: rescuePoints.filter((r) => r.available).length, color: "var(--accent-green)" },
                    { icon: TrendingUp, label: "Best Recovery", value: `${Math.max(...rescuePoints.map((r) => r.recoveryChance))}%`, color: "var(--accent-cyan)" },
                    { icon: Clock, label: "Nearest ETA", value: `${Math.min(...rescuePoints.filter((r) => r.available).map((r) => r.eta))}m`, color: "var(--accent-yellow)" },
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

            {/* Rescue Points List */}
            <div className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary)" }}>Rescue Point Analysis</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {sortedPoints.map((point, index) => (
                        <div
                            key={point.id}
                            style={{
                                display: "flex", alignItems: "center", gap: "14px",
                                padding: "14px 16px",
                                background: isCrisis && index === 0 ? "rgba(74, 222, 128, 0.05)" : "var(--bg-primary)",
                                borderRadius: 10,
                                border: isCrisis && index === 0 ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: point.type === "cold-storage" ? "rgba(56, 189, 248, 0.12)" : point.type === "market" ? "rgba(74, 222, 128, 0.12)" : "rgba(167, 139, 250, 0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                {getTypeIcon(point.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{point.name}</span>
                                    {!point.available && <span className="badge badge-red">Unavailable</span>}
                                    {isCrisis && index === 0 && <span className="badge badge-green">AI RECOMMENDED</span>}
                                </div>
                                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                                    {point.type.replace("-", " ").toUpperCase()} • {point.distance} km away • ETA {point.eta} min
                                </p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: point.recoveryChance >= 80 ? "var(--accent-green)" : point.recoveryChance >= 60 ? "var(--accent-yellow)" : "var(--accent-red)", margin: "0 0 2px 0" }}>
                                    {point.recoveryChance}%
                                </p>
                                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>Recovery</p>
                            </div>
                            {/* Recovery bar */}
                            <div style={{ width: 80, flexShrink: 0 }}>
                                <div style={{ width: "100%", height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{
                                        width: `${point.recoveryChance}%`,
                                        height: "100%",
                                        borderRadius: 3,
                                        background: point.recoveryChance >= 80 ? "var(--accent-green)" : point.recoveryChance >= 60 ? "var(--accent-yellow)" : "var(--accent-red)",
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shelf Life Context */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: shelfLifeHours <= 6 ? "rgba(248, 113, 113, 0.15)" : "rgba(74, 222, 128, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingCart size={22} style={{ color: shelfLifeHours <= 6 ? "var(--accent-red)" : "var(--accent-green)" }} />
                </div>
                <div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>
                        Cargo Value Recovery Window: {shelfLifeHours >= 1 ? `${Math.round(shelfLifeHours)} hours` : `${(shelfLifeHours * 60).toFixed(0)} minutes`}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                        {shelfLifeHours <= 3 ? "Critical — immediate pivot required to prevent total cargo loss." : shelfLifeHours <= 12 ? "Caution — plan pivot route as backup." : "Healthy — standard delivery recommended."}
                    </p>
                </div>
            </div>
        </div>
    );
}
