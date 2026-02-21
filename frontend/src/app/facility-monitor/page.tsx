"use client";

import { useAppContext } from "@/context/AppContext";
import { Building2, Thermometer, Droplets, Zap, Package, Clock, AlertTriangle } from "lucide-react";

export default function FacilityMonitorPage() {
    const { state } = useAppContext();
    const { facilities, isCrisis } = state;

    const getPowerBadge = (status: string) => {
        switch (status) {
            case "normal": return <span className="badge badge-green">⚡ Normal</span>;
            case "backup": return <span className="badge badge-yellow">🔋 Backup</span>;
            case "critical": return <span className="badge badge-red">⚠️ Critical</span>;
            default: return null;
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: 1200 }}>
            {isCrisis && (
                <div className="emergency-banner" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} style={{ color: "var(--accent-red)" }} />
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-red)", margin: 0 }}>⚠️ Facility alert — check incoming cargo temperature compliance</p>
                </div>
            )}

            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Facility Monitor</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Live status of cold storage centers</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {facilities.map((facility) => (
                    <div key={facility.name} className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ padding: "1.5rem" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(56, 189, 248, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Building2 size={24} style={{ color: "var(--accent-blue)" }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>{facility.name}</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Clock size={12} style={{ color: "var(--text-muted)" }} />
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Updated {facility.lastUpdated}</span>
                                    </div>
                                </div>
                            </div>
                            {getPowerBadge(facility.powerStatus)}
                        </div>

                        {/* Metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ textAlign: "center", padding: "14px 10px", background: "var(--bg-primary)", borderRadius: 10 }}>
                                <Thermometer size={20} style={{ color: "var(--accent-blue)", marginBottom: "6px" }} />
                                <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 4px", textTransform: "uppercase" }}>Temperature</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: facility.temperature > 8 ? "var(--accent-red)" : "var(--accent-blue)", margin: 0 }}>
                                    {facility.temperature}°C
                                </p>
                            </div>
                            <div style={{ textAlign: "center", padding: "14px 10px", background: "var(--bg-primary)", borderRadius: 10 }}>
                                <Droplets size={20} style={{ color: "var(--accent-cyan)", marginBottom: "6px" }} />
                                <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 4px", textTransform: "uppercase" }}>Humidity</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-cyan)", margin: 0 }}>
                                    {facility.humidity}%
                                </p>
                            </div>
                            <div style={{ textAlign: "center", padding: "14px 10px", background: "var(--bg-primary)", borderRadius: 10 }}>
                                <Zap size={20} style={{ color: "var(--accent-yellow)", marginBottom: "6px" }} />
                                <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: "0 0 4px", textTransform: "uppercase" }}>Power</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: facility.powerStatus === "normal" ? "var(--accent-green)" : "var(--accent-yellow)", margin: 0 }}>
                                    {facility.powerStatus === "normal" ? "OK" : "⚠️"}
                                </p>
                            </div>
                        </div>

                        {/* Storage capacity */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Package size={14} style={{ color: "var(--text-muted)" }} />
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Storage Capacity</span>
                                </div>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                    {facility.currentLoad.toLocaleString()} / {facility.storageCapacity.toLocaleString()} kg
                                </span>
                            </div>
                            <div style={{ width: "100%", height: 8, background: "var(--bg-primary)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{
                                    width: `${(facility.currentLoad / facility.storageCapacity) * 100}%`,
                                    height: "100%",
                                    borderRadius: 4,
                                    background: facility.currentLoad / facility.storageCapacity > 0.85 ? "var(--accent-red)" : facility.currentLoad / facility.storageCapacity > 0.65 ? "var(--accent-yellow)" : "var(--accent-green)",
                                    transition: "width 0.5s ease",
                                }} />
                            </div>
                            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                                {Math.round((facility.currentLoad / facility.storageCapacity) * 100)}% utilized
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
