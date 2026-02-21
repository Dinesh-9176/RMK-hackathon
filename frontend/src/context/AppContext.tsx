"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";

export interface TelemetryData {
  temperature: number;
  humidity: number;
  vibration: number;
  ethylene: number;
  co2: number;
  doorStatus: "closed" | "open";
  batteryLevel: number;
  signalStrength: number;
}

export interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  eta: number; // minutes
  survivalMargin: number; // minutes
  distance: number;
  status: "on-track" | "delayed" | "critical";
  roadType?: "NH" | "SH" | "District";
  trafficMultiplier?: number;
  weatherRisk?: "low" | "medium" | "high";
  speedKmh?: number;
}

export interface FacilityData {
  name: string;
  temperature: number;
  humidity: number;
  powerStatus: "normal" | "backup" | "critical";
  storageCapacity: number;
  currentLoad: number;
  lastUpdated: string;
  acceptingCargo?: boolean;
  currentMaterials?: string[];
}

export interface TripLog {
  id: string;
  date: string;
  route: string;
  cargo: string;
  duration: string;
  tempRange: string;
  status: "completed" | "incident" | "aborted";
  shelfLifeUsed: number;
}

export interface RescuePoint {
  id: string;
  name: string;
  distance: number;
  recoveryChance: number;
  type: "cold-storage" | "market" | "processing";
  available: boolean;
  eta: number;
}

export interface AIRecommendation {
  id: string;
  type: "reroute" | "speed-adjust" | "alert" | "market-pivot";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  approved: boolean | null;
}

export interface MLPrediction {
  shelfLifeHours: number;
  shelfLifeDays: number;
  riskLevel: "safe" | "warning" | "critical";
  stressIndex: number;
  marketPivotTrigger: boolean;
  recommendedCenter: string;
  survivalMarginA: number;
  survivalMarginB: number;
  survivalMarginOriginal: number;
}

export interface HaltEvent {
  detected: boolean;
  duration: number; // minutes
  reason: "unknown" | "traffic" | "breakdown" | "cooling-issue" | "driver-rest";
  notificationSent: boolean;
  location?: string;
}

export interface CurrentTrip {
  tripId: string;
  cargoName: string;
  cargoWeight: number; // tons
  cargoValueINR: number;
  destination: string;
  origin: string;
  roadType: "NH" | "SH" | "Mixed";
  assignedAt: string;
}

interface AppState {
  temperature: number;
  isCrisis: boolean;
  isRandomizerOn: boolean;
  systemStatus: "safe" | "warning" | "crisis";
  telemetry: TelemetryData;
  shelfLifeHours: number;
  routes: RouteData[];
  facilities: FacilityData[];
  tripLogs: TripLog[];
  rescuePoints: RescuePoint[];
  recommendations: AIRecommendation[];
  mlPrediction: MLPrediction | null;
  agentMessage: string | null;
  haltEvent: HaltEvent;
  currentTrip: CurrentTrip;
  weatherCondition: "clear" | "rain" | "fog" | "storm";
}

type Action =
  | { type: "SET_TEMPERATURE"; payload: number }
  | { type: "SET_CRISIS"; payload: boolean }
  | { type: "SET_RANDOMIZER"; payload: boolean }
  | { type: "UPDATE_TELEMETRY"; payload: Partial<TelemetryData> }
  | { type: "APPROVE_RECOMMENDATION"; payload: string }
  | { type: "REJECT_RECOMMENDATION"; payload: string }
  | { type: "SET_ML_PREDICTION"; payload: MLPrediction }
  | { type: "SET_AGENT_MESSAGE"; payload: string | null }
  | { type: "SET_HALT"; payload: Partial<HaltEvent> }
  | { type: "SET_TRIP"; payload: Partial<CurrentTrip> }
  | { type: "SET_WEATHER"; payload: "clear" | "rain" | "fog" | "storm" };

// ── Road-type-aware ETA calculator ───────────────────────────────────────────
export function calculateETA(
  distanceKm: number,
  roadType: "NH" | "SH" | "District" | "Mixed",
  trafficMultiplier: number = 1.0,
  weatherCondition: "clear" | "rain" | "fog" | "storm" = "clear"
): number {
  const baseSpeed: Record<string, number> = { NH: 80, SH: 60, District: 40, Mixed: 65 };
  const weatherMult: Record<string, number> = { clear: 1.0, rain: 0.8, fog: 0.7, storm: 0.5 };
  const speed = baseSpeed[roadType] * weatherMult[weatherCondition] * (1 / trafficMultiplier);
  return Math.round((distanceKm / speed) * 60); // minutes
}

function computeShelfLife(temp: number): number {
  if (temp <= 2) return 72;
  if (temp <= 5) return 48;
  if (temp <= 8) return 24;
  if (temp <= 12) return 12;
  if (temp <= 18) return 6;
  if (temp <= 25) return 3;
  if (temp <= 35) return 1;
  return 0.5;
}

function computeSystemStatus(temp: number, isCrisis: boolean): "safe" | "warning" | "crisis" {
  if (isCrisis) return "crisis";
  if (temp > 15) return "crisis";
  if (temp > 8) return "warning";
  return "safe";
}

function computeRoutes(
  temp: number,
  isCrisis: boolean,
  weather: "clear" | "rain" | "fog" | "storm" = "clear"
): RouteData[] {
  const shelf = computeShelfLife(temp);
  const shelfMinutes = shelf * 60;
  const routes = [
    { id: "R1", name: "Route Alpha", origin: "Farm Hub A", destination: "Center A", distance: 245, roadType: "NH" as const, trafficMult: 1.0 },
    { id: "R2", name: "Route Beta",  origin: "Farm Hub B", destination: "Center B", distance: 312, roadType: "SH" as const, trafficMult: 1.5 },
    { id: "R3", name: "Route Gamma", origin: "Farm Hub C", destination: "Center A", distance: 178, roadType: "NH" as const, trafficMult: 1.0 },
    { id: "R4", name: "Route Delta", origin: "Farm Hub A", destination: "Market D", distance: 405, roadType: "District" as const, trafficMult: 1.8 },
  ];
  return routes.map((r) => {
    const eta = calculateETA(r.distance, r.roadType, r.trafficMult, weather);
    const margin = Math.max(0, shelfMinutes - eta);
    const weatherRisk: "low" | "medium" | "high" =
      weather === "storm" ? "high" : weather === "fog" || weather === "rain" ? "medium" : "low";
    return {
      ...r,
      eta,
      survivalMargin: margin,
      weatherRisk,
      trafficMultiplier: r.trafficMult,
      speedKmh: Math.round(r.distance / (eta / 60)),
      status: isCrisis ? "critical" : margin < 60 ? "critical" : margin < 120 ? "delayed" : "on-track",
    };
  });
}

// ── Default data ──────────────────────────────────────────────────────────────
const defaultTelemetry: TelemetryData = {
  temperature: 4,
  humidity: 85,
  vibration: 0.3,
  ethylene: 12,
  co2: 450,
  doorStatus: "closed",
  batteryLevel: 94,
  signalStrength: 87,
};

const defaultFacilities: FacilityData[] = [
  {
    name: "Center A – Metro Cold Hub",
    temperature: 3,
    humidity: 88,
    powerStatus: "normal",
    storageCapacity: 5000,
    currentLoad: 3200,
    lastUpdated: "2 min ago",
    acceptingCargo: true,
    currentMaterials: ["Tomatoes", "Dairy", "Berries"],
  },
  {
    name: "Center B – Regional Depot",
    temperature: 5,
    humidity: 82,
    powerStatus: "normal",
    storageCapacity: 3000,
    currentLoad: 2100,
    lastUpdated: "1 min ago",
    acceptingCargo: true,
    currentMaterials: ["Leafy Greens", "Mangoes"],
  },
];

const defaultTripLogs: TripLog[] = [
  { id: "T001", date: "2026-02-20", route: "Route Alpha", cargo: "Mangoes – 2.4 tons",      duration: "3h 12m", tempRange: "2.1°C – 4.8°C",  status: "completed", shelfLifeUsed: 18 },
  { id: "T002", date: "2026-02-19", route: "Route Beta",  cargo: "Tomatoes – 1.8 tons",     duration: "4h 05m", tempRange: "3.2°C – 6.1°C",  status: "completed", shelfLifeUsed: 24 },
  { id: "T003", date: "2026-02-18", route: "Route Gamma", cargo: "Leafy Greens – 0.9 tons", duration: "2h 30m", tempRange: "1.8°C – 3.5°C",  status: "completed", shelfLifeUsed: 12 },
  { id: "T004", date: "2026-02-17", route: "Route Delta", cargo: "Dairy – 3.1 tons",        duration: "5h 20m", tempRange: "4.5°C – 12.3°C", status: "incident",  shelfLifeUsed: 45 },
  { id: "T005", date: "2026-02-16", route: "Route Alpha", cargo: "Berries – 1.2 tons",      duration: "3h 00m", tempRange: "1.5°C – 3.0°C",  status: "completed", shelfLifeUsed: 15 },
  { id: "T006", date: "2026-02-15", route: "Route Beta",  cargo: "Fish – 2.0 tons",         duration: "4h 45m", tempRange: "6.0°C – 18.5°C", status: "aborted",   shelfLifeUsed: 72 },
];

const defaultRescuePoints: RescuePoint[] = [
  { id: "RP1", name: "QuickFreeze Depot",  distance: 12, recoveryChance: 92, type: "cold-storage", available: true,  eta: 18 },
  { id: "RP2", name: "FreshMart Outlet",   distance: 8,  recoveryChance: 78, type: "market",       available: true,  eta: 12 },
  { id: "RP3", name: "AgriProcess Plant",  distance: 22, recoveryChance: 65, type: "processing",   available: true,  eta: 30 },
  { id: "RP4", name: "ColdChain Hub B2",   distance: 35, recoveryChance: 88, type: "cold-storage", available: false, eta: 45 },
  { id: "RP5", name: "Metro Fresh Market", distance: 5,  recoveryChance: 71, type: "market",       available: true,  eta: 8  },
];

const defaultRecommendations: AIRecommendation[] = [
  { id: "AI1", type: "reroute",       severity: "medium",   message: "Reroute Truck #7 to Center A via NH-48 bypass to save 22 min and maintain cold chain below 4°C.", timestamp: "10:03 AM", approved: null },
  { id: "AI2", type: "speed-adjust",  severity: "low",      message: "Reduce speed on Route Beta by 10% to optimise fuel while maintaining ETA within survival margin.", timestamp: "10:05 AM", approved: true  },
  { id: "AI3", type: "alert",         severity: "high",     message: "Ethylene levels rising on Truck #3. Recommend ventilation adjustment and shelf-life recalculation.", timestamp: "10:08 AM", approved: null },
];

const defaultHalt: HaltEvent = {
  detected: false,
  duration: 0,
  reason: "unknown",
  notificationSent: false,
  location: "",
};

const defaultTrip: CurrentTrip = {
  tripId: "T-2026-0042",
  cargoName: "Mangoes",
  cargoWeight: 2.4,
  cargoValueINR: 700000,
  destination: "Mumbai Metro Market",
  origin: "Farm Hub A – Nashik",
  roadType: "NH",
  assignedAt: new Date().toISOString(),
};

function getInitialState(): AppState {
  return {
    temperature: 4,
    isCrisis: false,
    isRandomizerOn: false,
    systemStatus: "safe",
    telemetry: { ...defaultTelemetry },
    shelfLifeHours: computeShelfLife(4),
    routes: computeRoutes(4, false, "clear"),
    facilities: [...defaultFacilities],
    tripLogs: [...defaultTripLogs],
    rescuePoints: [...defaultRescuePoints],
    recommendations: [...defaultRecommendations],
    mlPrediction: null,
    agentMessage: null,
    haltEvent: { ...defaultHalt },
    currentTrip: { ...defaultTrip },
    weatherCondition: "clear",
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TEMPERATURE": {
      const temp = action.payload;
      return {
        ...state,
        temperature: temp,
        telemetry: { ...state.telemetry, temperature: temp },
        shelfLifeHours: computeShelfLife(temp),
        systemStatus: computeSystemStatus(temp, state.isCrisis),
        routes: computeRoutes(temp, state.isCrisis, state.weatherCondition),
      };
    }
    case "SET_CRISIS": {
      const crisis = action.payload;
      const newRecs = crisis
        ? [
            ...state.recommendations,
            {
              id: "AI-CRISIS-" + Date.now(),
              type: "market-pivot" as const,
              severity: "critical" as const,
              message: `⚠️ CRISIS: Cold chain breach on Trip ${state.currentTrip.tripId}. Cargo "${state.currentTrip.cargoName}" at risk. Immediate market pivot to QuickFreeze Depot recommended. Potential recovery: ₹${Math.round(state.currentTrip.cargoValueINR * 0.92).toLocaleString("en-IN")}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              approved: null,
            },
          ]
        : state.recommendations;
      return {
        ...state,
        isCrisis: crisis,
        systemStatus: computeSystemStatus(state.temperature, crisis),
        routes: computeRoutes(state.temperature, crisis, state.weatherCondition),
        recommendations: newRecs,
      };
    }
    case "SET_RANDOMIZER":
      return { ...state, isRandomizerOn: action.payload };
    case "UPDATE_TELEMETRY":
      return { ...state, telemetry: { ...state.telemetry, ...action.payload } };
    case "APPROVE_RECOMMENDATION":
      return { ...state, recommendations: state.recommendations.map((r) => r.id === action.payload ? { ...r, approved: true } : r) };
    case "REJECT_RECOMMENDATION":
      return { ...state, recommendations: state.recommendations.map((r) => r.id === action.payload ? { ...r, approved: false } : r) };
    case "SET_ML_PREDICTION": {
      const ml = action.payload;
      return {
        ...state,
        mlPrediction: ml,
        shelfLifeHours: ml.shelfLifeHours,
        systemStatus: (ml.riskLevel === "critical" || state.isCrisis) ? "crisis" : ml.riskLevel === "warning" ? "warning" : "safe",
      };
    }
    case "SET_AGENT_MESSAGE":
      return { ...state, agentMessage: action.payload };
    case "SET_HALT":
      return { ...state, haltEvent: { ...state.haltEvent, ...action.payload } };
    case "SET_TRIP":
      return { ...state, currentTrip: { ...state.currentTrip, ...action.payload } };
    case "SET_WEATHER": {
      const weather = action.payload;
      return {
        ...state,
        weatherCondition: weather,
        routes: computeRoutes(state.temperature, state.isCrisis, weather),
      };
    }
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const haltTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sensor noise generator
  const generateNoise = useCallback(() => {
    const isCrisis = state.isCrisis;
    const baseTemp = state.temperature;
    const noise = isCrisis
      ? { temperature: baseTemp + (Math.random() * 10 - 2), humidity: 60 + Math.random() * 20, vibration: 0.8 + Math.random() * 1.2, ethylene: 40 + Math.random() * 30, co2: 700 + Math.random() * 300 }
      : { temperature: baseTemp + (Math.random() * 2 - 1), humidity: 80 + Math.random() * 10, vibration: 0.1 + Math.random() * 0.4, ethylene: 8 + Math.random() * 8, co2: 400 + Math.random() * 100 };
    dispatch({ type: "UPDATE_TELEMETRY", payload: noise });
  }, [state.isCrisis, state.temperature]);

  useEffect(() => {
    if (state.isRandomizerOn) {
      intervalRef.current = setInterval(generateNoise, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isRandomizerOn, generateNoise]);

  // Halt detection: simulate after 8 sec in crisis mode
  useEffect(() => {
    if (state.isCrisis && !state.haltEvent.detected) {
      haltTimerRef.current = setTimeout(() => {
        dispatch({
          type: "SET_HALT",
          payload: { detected: true, duration: 12, reason: "cooling-issue", notificationSent: true, location: "NH-48, Km 187 near Igatpuri" },
        });
      }, 8000);
    }
    if (!state.isCrisis) {
      dispatch({ type: "SET_HALT", payload: { detected: false, duration: 0, reason: "unknown", notificationSent: false } });
    }
    return () => { if (haltTimerRef.current) clearTimeout(haltTimerRef.current); };
  }, [state.isCrisis, state.haltEvent.detected]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
