"use client";

import { useAppContext } from "@/context/AppContext";
import { ClipboardList, Search, Calendar, Truck, Thermometer, Clock } from "lucide-react";
import { useState } from "react";

export default function TripLogsPage() {
    const { state } = useAppContext();
    const { tripLogs } = state;
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filtered = tripLogs.filter((log) => {
        const matchSearch = log.route.toLowerCase().includes(searchTerm.toLowerCase()) || log.cargo.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || log.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed": return <span className="badge badge-green">✓ Completed</span>;
            case "incident": return <span className="badge badge-yellow">⚠ Incident</span>;
            case "aborted": return <span className="badge badge-red">✗ Aborted</span>;
            default: return null;
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Trip Logs</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Historical delivery data and performance records</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                {[
                    { icon: Truck, label: "Total Trips", value: tripLogs.length, color: "var(--accent-blue)" },
                    { icon: ClipboardList, label: "Completed", value: tripLogs.filter((t) => t.status === "completed").length, color: "var(--accent-green)" },
                    { icon: Thermometer, label: "Incidents", value: tripLogs.filter((t) => t.status === "incident").length, color: "var(--accent-yellow)" },
                    { icon: Clock, label: "Avg Shelf Used", value: `${Math.round(tripLogs.reduce((a, t) => a + t.shelfLifeUsed, 0) / tripLogs.length)}%`, color: "var(--accent-cyan)" },
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

            {/* Filters */}
            <div className="card" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder="Search by route, cargo, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 10px 10px 38px",
                                background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8,
                                color: "var(--text-primary)", fontSize: "0.8rem", outline: "none",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                        {["all", "completed", "incident", "aborted"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                style={{
                                    padding: "8px 14px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 500,
                                    background: statusFilter === f ? "rgba(56, 189, 248, 0.15)" : "var(--bg-primary)",
                                    border: statusFilter === f ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid var(--border-color)",
                                    color: statusFilter === f ? "var(--accent-blue)" : "var(--text-secondary)",
                                    cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize",
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                            {["Trip ID", "Date", "Route", "Cargo", "Duration", "Temp Range", "Shelf Life Used", "Status"].map((h) => (
                                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((log) => (
                            <tr
                                key={log.id}
                                style={{ borderBottom: "1px solid rgba(51, 65, 85, 0.5)", transition: "background 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                                <td style={{ padding: "12px", fontWeight: 600, color: "var(--accent-blue)" }}>{log.id}</td>
                                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                                        {log.date}
                                    </div>
                                </td>
                                <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{log.route}</td>
                                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{log.cargo}</td>
                                <td style={{ padding: "12px", color: "var(--text-primary)" }}>{log.duration}</td>
                                <td style={{ padding: "12px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{log.tempRange}</td>
                                <td style={{ padding: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: 50, height: 6, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden" }}>
                                            <div style={{ width: `${Math.min(log.shelfLifeUsed, 100)}%`, height: "100%", borderRadius: 3, background: log.shelfLifeUsed > 50 ? "var(--accent-red)" : log.shelfLifeUsed > 30 ? "var(--accent-yellow)" : "var(--accent-green)" }} />
                                        </div>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: log.shelfLifeUsed > 50 ? "var(--accent-red)" : "var(--text-primary)" }}>{log.shelfLifeUsed}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: "12px" }}>{getStatusBadge(log.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
