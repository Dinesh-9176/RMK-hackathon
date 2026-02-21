"use client";

import { RouteData } from "@/context/AppContext";

interface SurvivalMarginTableProps {
    routes: RouteData[];
    isCrisis: boolean;
}

export default function SurvivalMarginTable({ routes, isCrisis }: SurvivalMarginTableProps) {
    const formatMinutes = (m: number) => {
        if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
        return `${Math.round(m)}m`;
    };

    const getStatusBadge = (status: string) => {
        const cls = status === "on-track" ? "badge-green" : status === "delayed" ? "badge-yellow" : "badge-red";
        return <span className={`badge ${cls}`}>{status.replace("-", " ").toUpperCase()}</span>;
    };

    return (
        <div className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ overflow: "hidden" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px 0" }}>
                Survival Margin Analysis
            </h3>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                            {["Route", "Origin → Dest", "ETA", "Survival Margin", "Distance", "Status"].map((h) => (
                                <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {routes.map((route) => {
                            const isCritical = route.survivalMargin < 60 || route.status === "critical";
                            return (
                                <tr
                                    key={route.id}
                                    style={{
                                        borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
                                        transition: "background 0.2s",
                                        background: isCritical && isCrisis ? "rgba(239, 68, 68, 0.05)" : "transparent",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = isCritical && isCrisis ? "rgba(239, 68, 68, 0.05)" : "transparent"}
                                >
                                    <td style={{ padding: "10px", fontWeight: 600, color: "var(--text-primary)" }}>{route.name}</td>
                                    <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{route.origin} → {route.destination}</td>
                                    <td style={{ padding: "10px", color: "var(--text-primary)" }}>{formatMinutes(route.eta)}</td>
                                    <td style={{
                                        padding: "10px", fontWeight: 600,
                                        color: route.survivalMargin < 60 ? "var(--accent-red)" : route.survivalMargin < 120 ? "var(--accent-yellow)" : "var(--accent-green)",
                                    }}>
                                        {formatMinutes(route.survivalMargin)}
                                    </td>
                                    <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{route.distance} km</td>
                                    <td style={{ padding: "10px" }}>{getStatusBadge(route.status)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
