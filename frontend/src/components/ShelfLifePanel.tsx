"use client";

interface ShelfLifePanelProps {
    hours: number;
    temperature: number;
    isCrisis: boolean;
}

export default function ShelfLifePanel({ hours, temperature, isCrisis }: ShelfLifePanelProps) {
    const maxHours = 72;
    const percentage = Math.min(100, (hours / maxHours) * 100);
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (isCrisis || hours <= 3) return "#ef4444";
        if (hours <= 12) return "#f59e0b";
        if (hours <= 24) return "#facc15";
        return "#4ade80";
    };

    const color = getColor();
    const severity = hours <= 3 ? "CRITICAL" : hours <= 12 ? "WARNING" : hours <= 24 ? "MODERATE" : "OPTIMAL";

    return (
        <div className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Shelf Life Prediction</h3>
                <span className={`badge ${isCrisis || hours <= 3 ? "badge-red" : hours <= 12 ? "badge-yellow" : "badge-green"}`}>
                    {severity}
                </span>
            </div>
            <div style={{ position: "relative", width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                    <circle
                        cx="80" cy="80" r="70" fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="gauge-ring"
                        transform="rotate(-90 80 80)"
                        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
                    />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <span style={{ fontSize: "2.2rem", fontWeight: 700, color, lineHeight: 1 }}>
                        {hours >= 1 ? Math.round(hours) : hours.toFixed(1)}
                    </span>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>hours left</p>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: 8 }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 0 2px 0" }}>TEMPERATURE</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, color: isCrisis ? "var(--accent-red)" : "var(--text-primary)", margin: 0 }}>{temperature.toFixed(1)}°C</p>
                </div>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: 8 }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 0 2px 0" }}>DECAY RATE</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, color: isCrisis ? "var(--accent-red)" : "var(--text-primary)", margin: 0 }}>{temperature > 8 ? "Fast" : temperature > 4 ? "Moderate" : "Slow"}</p>
                </div>
            </div>
        </div>
    );
}
