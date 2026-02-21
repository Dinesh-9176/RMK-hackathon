"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import {
    LayoutDashboard,
    Navigation,
    ShoppingCart,
    Building2,
    ClipboardList,
    FlaskConical,
    LogOut,
    Shield,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/route-intelligence", label: "Route Intelligence", icon: Navigation },
    { href: "/market-pivot", label: "Market Pivot Engine", icon: ShoppingCart },
    { href: "/facility-monitor", label: "Facility Monitor", icon: Building2 },
    { href: "/trip-logs", label: "Trip Logs", icon: ClipboardList },
    { href: "/simulation-lab", label: "Simulation Lab", icon: FlaskConical },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { state } = useAppContext();
    const { systemStatus, isCrisis } = state;

    const statusLabel = systemStatus === "safe" ? "All Systems Safe" : systemStatus === "warning" ? "Warning Active" : "Crisis Mode";

    return (
        <aside
            className="sidebar-dark sidebar-crisis-glow"
            style={{
                width: "var(--sidebar-width)",
                minWidth: "var(--sidebar-width)",
                height: "100vh",
                background: "var(--bg-primary)",
                borderRight: isCrisis ? "2px solid rgba(239,68,68,0.5)" : "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 50,
                transition: "all 0.3s ease",
                boxShadow: isCrisis ? "inset -3px 0 15px rgba(239,68,68,0.2)" : "none",
            }}
        >
            {/* Brand Block */}
            <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: isCrisis ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #38bdf8, #818cf8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s",
                    }}>
                        <Shield size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, margin: 0 }}>
                            Aegis Harvest
                        </h1>
                    </div>
                </div>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", margin: "8px 0 12px 0" }}>
                    Autonomous Cold-Chain Copilot
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`status-dot ${systemStatus}`} />
                    <span style={{ fontSize: "0.78rem", color: systemStatus === "crisis" ? "var(--accent-red)" : systemStatus === "warning" ? "var(--accent-yellow)" : "var(--accent-green)", fontWeight: 600 }}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "0.75rem 0.75rem", overflowY: "auto" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
                    Navigation
                </p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isMarketPivot = item.href === "/market-pivot";
                    const showPulse = isMarketPivot && isCrisis;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "8px",
                                marginBottom: "3px",
                                fontSize: "0.85rem",
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? "var(--accent-blue)" : showPulse ? "var(--accent-red)" : "var(--text-secondary)",
                                background: isActive ? "rgba(56, 189, 248, 0.1)" : "transparent",
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                                position: "relative",
                            }}
                            className={showPulse ? "animate-pulse-red" : ""}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "rgba(148, 163, 184, 0.08)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = showPulse ? "var(--accent-red)" : "var(--text-secondary)";
                                }
                            }}
                        >
                            <item.icon size={18} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                            {showPulse && (
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-red)", animation: "pulse-dot 1s infinite" }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 700, color: "white",
                    }}>
                        OM
                    </div>
                    <div>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Ops Manager</p>
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>Operations Lead</p>
                    </div>
                </div>
                <button
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px",
                        background: "transparent", border: "1px solid var(--border-color)",
                        color: "var(--text-muted)", fontSize: "0.78rem", cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.3)";
                        e.currentTarget.style.color = "var(--accent-red)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "var(--border-color)";
                        e.currentTarget.style.color = "var(--text-muted)";
                    }}
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
