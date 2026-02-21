"use client";

import { LucideIcon } from "lucide-react";

interface TelemetryCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    unit?: string;
    trend?: "up" | "down" | "stable";
    trendValue?: string;
    color?: string;
    isCrisis?: boolean;
}

export default function TelemetryCard({ icon: Icon, label, value, unit, trend, trendValue, color = "var(--accent-blue)", isCrisis }: TelemetryCardProps) {
    return (
        <div
            className={`card ${isCrisis ? "card-crisis" : ""}`}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isCrisis ? "rgba(248, 113, 113, 0.15)" : `${color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={20} style={{ color: isCrisis ? "var(--accent-red)" : color }} />
                </div>
                {trend && (
                    <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: trend === "up" ? "var(--accent-red)" : trend === "down" ? "var(--accent-green)" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                    }}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                        {trendValue}
                    </span>
                )}
            </div>
            <div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
                    {label}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: isCrisis ? "var(--accent-red)" : "var(--text-primary)", lineHeight: 1 }}>
                        {typeof value === "number" ? value.toFixed(1) : value}
                    </span>
                    {unit && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>{unit}</span>}
                </div>
            </div>
        </div>
    );
}
