"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Navigation,
    ShoppingCart,
    Building2,
    ClipboardList,
    FlaskConical,
    LogOut,
    ChevronRight,
    Sun,
    Moon,
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
    const { isCrisis } = state;

    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        if (darkMode) {
            html.classList.add("dark-mode");
        } else {
            html.classList.remove("dark-mode");
        }
    }, [darkMode]);

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
                <div style={{ marginBottom: "4px" }}>
                    <h1
                        style={{
                            fontSize: "1.35rem",
                            fontWeight: 800,
                            lineHeight: 1.15,
                            margin: 0,
                            background: isCrisis
                                ? "linear-gradient(135deg, #f87171, #dc2626)"
                                : "linear-gradient(135deg, #38bdf8 0%, #818cf8 60%, #a78bfa 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Bharath Logistics
                    </h1>
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "6px 0 0 0" }}>
                    Autonomous Cold-Chain Copilot
                </p>
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
                {/* User row + compact dark mode toggle side by side */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    {/* Tiny pill toggle */}
                    <button
                        onClick={() => setDarkMode((d) => !d)}
                        title={darkMode ? "Light Mode" : "Dark Mode"}
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            width: 46,
                            height: 24,
                            borderRadius: 999,
                            flexShrink: 0,
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            background: darkMode
                                ? "linear-gradient(135deg, #1e293b, #0f172a)"
                                : "linear-gradient(135deg, #fef9c3, #fde68a)",
                            boxShadow: darkMode
                                ? "inset 0 0 0 1px #334155, 0 1px 4px rgba(56,189,248,0.18)"
                                : "inset 0 0 0 1px #fcd34d, 0 1px 4px rgba(251,191,36,0.2)",
                            transition: "background 0.4s ease, box-shadow 0.4s ease",
                        }}
                        aria-label="Toggle dark mode"
                    >
                        {/* Sun icon (left) */}
                        <span style={{
                            position: "absolute", left: 5,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: darkMode ? "#475569" : "#d97706",
                            transition: "opacity 0.3s", opacity: darkMode ? 0 : 1,
                            zIndex: 0,
                        }}>
                            <Sun size={11} strokeWidth={2.5} />
                        </span>
                        {/* Moon icon (right) */}
                        <span style={{
                            position: "absolute", right: 5,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: darkMode ? "#38bdf8" : "#cbd5e1",
                            transition: "opacity 0.3s", opacity: darkMode ? 1 : 0,
                            zIndex: 0,
                        }}>
                            <Moon size={11} strokeWidth={2.5} />
                        </span>
                        {/* Sliding knob */}
                        <span style={{
                            position: "absolute",
                            top: 3,
                            left: darkMode ? 25 : 3,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: darkMode ? "#38bdf8" : "#ffffff",
                            boxShadow: darkMode
                                ? "0 1px 6px rgba(56,189,248,0.5)"
                                : "0 1px 4px rgba(0,0,0,0.18)",
                            transition: "left 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
                            zIndex: 1,
                        }} />
                    </button>

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
