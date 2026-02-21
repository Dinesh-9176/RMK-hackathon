"use client";

import { useAppContext } from "@/context/AppContext";
import {
  ShoppingCart, MapPin, Clock, TrendingUp, AlertTriangle,
  Snowflake, Store, Factory, IndianRupee, TrendingDown, Zap, Package,
} from "lucide-react";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function MarketPivotPage() {
  const { state } = useAppContext();
  const { rescuePoints, isCrisis, shelfLifeHours, currentTrip, routes, facilities } = state;

  const cargoValue = currentTrip.cargoValueINR;
  const sortedPoints = [...rescuePoints].sort((a, b) => b.recoveryChance - a.recoveryChance);
  const bestPoint = sortedPoints.find((p) => p.available);
  const originalEtaMin = routes[0]?.eta ?? 300;
  const shelfLifeMin = shelfLifeHours * 60;

  const getTypeIcon = (type: string) => {
    if (type === "cold-storage") return <Snowflake size={18} style={{ color: "var(--accent-blue)" }} />;
    if (type === "market")       return <Store size={18} style={{ color: "var(--accent-green)" }} />;
    return <Factory size={18} style={{ color: "var(--accent-purple)" }} />;
  };

  return (
    <div className="page-content" style={{ maxWidth: 1200 }}>

      {/* Crisis Banner */}
      {isCrisis && (
        <div style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <AlertTriangle size={22} style={{ color: "var(--accent-red)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--accent-red)", margin: "0 0 6px 0" }}>
                🚨 MARKET PIVOT ENGINE ACTIVATED
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 10px 0", lineHeight: 1.6 }}>
                Cargo <strong style={{ color: "var(--text-primary)" }}>{currentTrip.cargoName} ({currentTrip.cargoWeight} tons)</strong> cannot
                reach <strong style={{ color: "var(--text-primary)" }}>{currentTrip.destination}</strong>&nbsp;
                ({Math.floor(originalEtaMin / 60)}h {originalEtaMin % 60}m away).
                Remaining shelf life: <strong style={{ color: "var(--accent-red)" }}>{Math.round(shelfLifeMin)} min</strong>.
              </p>
              {bestPoint && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-green)", fontWeight: 600 }}>
                      AI RECOMMENDS → {bestPoint.name}
                    </span>
                  </div>
                  <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.3)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-yellow)", fontWeight: 600 }}>
                      Rescue Value: {fmt(Math.round(cargoValue * bestPoint.recoveryChance / 100))} ({bestPoint.recoveryChance}%)
                    </span>
                  </div>
                  <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 600 }}>
                      Total Loss Prevented: {fmt(Math.round(cargoValue * bestPoint.recoveryChance / 100))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>Market Pivot Engine</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Dynamic Survival Optimization — Rescue points & cargo value recovery</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 2px 0" }}>Active Trip</p>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{currentTrip.tripId} · {currentTrip.cargoName}</p>
        </div>
      </div>

      {/* Cargo Value Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: IndianRupee,  label: "Cargo Value",     value: fmt(cargoValue),                                                            color: "var(--accent-blue)"  },
          { icon: Package,      label: "Cargo Weight",    value: `${currentTrip.cargoWeight} tons`,                                          color: "var(--accent-cyan)"  },
          { icon: TrendingUp,   label: "Best Recovery",   value: fmt(Math.round(cargoValue * (bestPoint?.recoveryChance ?? 0) / 100)),        color: "var(--accent-green)" },
          { icon: TrendingDown, label: "Loss if No Pivot",value: isCrisis ? fmt(cargoValue) : "— Secure",                                    color: isCrisis ? "var(--accent-red)" : "var(--text-muted)" },
        ].map((item) => (
          <div key={item.label} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <item.icon size={22} style={{ color: item.color }} />
            </div>
            <div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>{item.label}</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: item.color, margin: 0, fontFamily: "var(--font-mono)" }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Facility Capacity Context */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {facilities.map((f) => {
          const usedPct = Math.round((f.currentLoad / f.storageCapacity) * 100);
          return (
            <div key={f.name} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{f.name}</span>
                <span className={`badge ${f.acceptingCargo ? "badge-green" : "badge-red"}`}>
                  {f.acceptingCargo ? "✓ Accepting" : "✗ Full"}
                </span>
              </div>
              {f.currentMaterials && f.currentMaterials.length > 0 && (
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                  📦 Currently stores: {f.currentMaterials.join(", ")}
                </p>
              )}
              <div style={{ width: "100%", height: 6, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                <div style={{ width: `${usedPct}%`, height: "100%", borderRadius: 3, background: usedPct > 85 ? "var(--accent-red)" : usedPct > 65 ? "var(--accent-yellow)" : "var(--accent-green)", transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{usedPct}% used</span>
                <span style={{ fontSize: "0.65rem", color: "var(--accent-green)", fontWeight: 600 }}>
                  {(100 - usedPct)}% free · {(f.storageCapacity - f.currentLoad).toLocaleString()} kg available
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rescue Point Analysis */}
      <div className={`card ${isCrisis ? "card-crisis" : ""}`} style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
          Rescue Value Recovery Analysis
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedPoints.map((point, index) => {
            const rescueValue = Math.round(cargoValue * point.recoveryChance / 100);
            const isRecommended = isCrisis && index === 0 && point.available;
            return (
              <div
                key={point.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 10,
                  background: isRecommended ? "rgba(74,222,128,0.05)" : !point.available ? "rgba(100,116,139,0.04)" : "var(--bg-primary)",
                  border: isRecommended ? "1px solid rgba(74,222,128,0.25)" : "1px solid transparent",
                  opacity: point.available ? 1 : 0.55,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: point.type === "cold-storage" ? "rgba(56,189,248,0.12)" : point.type === "market" ? "rgba(74,222,128,0.12)" : "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getTypeIcon(point.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{point.name}</span>
                    {!point.available && <span className="badge badge-red">Unavailable</span>}
                    {isRecommended && <span className="badge badge-green">⚡ AI RECOMMENDED</span>}
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                    {point.type.replace("-", " ").toUpperCase()} · {point.distance} km away · ETA {point.eta} min
                  </p>
                </div>
                {/* INR Recovery */}
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 150 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                    <IndianRupee size={13} style={{ color: point.recoveryChance >= 80 ? "var(--accent-green)" : point.recoveryChance >= 60 ? "var(--accent-yellow)" : "var(--accent-red)" }} />
                    <span style={{ fontSize: "1.15rem", fontWeight: 700, color: point.recoveryChance >= 80 ? "var(--accent-green)" : point.recoveryChance >= 60 ? "var(--accent-yellow)" : "var(--accent-red)" }}>
                      {rescueValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "1px 0 0 0" }}>
                    {point.recoveryChance}% Recovery
                  </p>
                  {isCrisis && point.available && (
                    <p style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", margin: "2px 0 0 0", fontWeight: 600 }}>
                      Saves {fmt(rescueValue)}
                    </p>
                  )}
                </div>
                {/* Bar */}
                <div style={{ width: 70, flexShrink: 0 }}>
                  <div style={{ width: "100%", height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${point.recoveryChance}%`, height: "100%", borderRadius: 3, background: point.recoveryChance >= 80 ? "var(--accent-green)" : point.recoveryChance >= 60 ? "var(--accent-yellow)" : "var(--accent-red)", transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Triage Summary */}
      {isCrisis && bestPoint && (
        <div className="card" style={{ padding: "20px 24px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Zap size={18} style={{ color: "var(--accent-red)" }} />
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--accent-red)" }}>Emergency Triage Summary</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Original Destination", value: currentTrip.destination,                                     sub: "❌ Cannot reach — cargo will spoil",                         color: "var(--accent-red)"   },
              { label: "Recommended Pivot",    value: bestPoint.name,                                              sub: `ETA ${bestPoint.eta} min · ${bestPoint.distance} km`,       color: "var(--accent-green)" },
              { label: "Net Value Saved",      value: fmt(Math.round(cargoValue * bestPoint.recoveryChance / 100)), sub: `${bestPoint.recoveryChance}% of ${fmt(cargoValue)} recovered`, color: "var(--accent-cyan)" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "14px 16px", background: "var(--bg-primary)", borderRadius: 10 }}>
                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase" }}>{item.label}</p>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: item.color, margin: "0 0 4px 0" }}>{item.value}</p>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0 }}>{item.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", background: "rgba(74,222,128,0.08)", borderRadius: 8, border: "1px solid rgba(74,222,128,0.2)" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--accent-green)" }}>AI Decision:</strong>{" "}
              Cargo cannot reach <strong>{currentTrip.destination}</strong> (100% value = <strong>{fmt(cargoValue)}</strong>).
              Rerouting to <strong style={{ color: "var(--accent-green)" }}>{bestPoint.name}</strong> (Rescue Value: {bestPoint.recoveryChance}%).{" "}
              <strong style={{ color: "var(--accent-cyan)" }}>Total Loss Prevented: {fmt(Math.round(cargoValue * bestPoint.recoveryChance / 100))}.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Normal state context */}
      {!isCrisis && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: shelfLifeHours <= 6 ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingCart size={22} style={{ color: shelfLifeHours <= 6 ? "var(--accent-red)" : "var(--accent-green)" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>
              Cargo Value Recovery Window: {shelfLifeHours >= 1 ? `${Math.round(shelfLifeHours)} hours` : `${(shelfLifeHours * 60).toFixed(0)} min`}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              {shelfLifeHours <= 3
                ? "Critical — immediate pivot required to prevent total cargo loss."
                : shelfLifeHours <= 12
                ? "Caution — plan pivot route as backup."
                : `Cargo value ${fmt(cargoValue)} is secure. Standard delivery to ${currentTrip.destination} recommended.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
