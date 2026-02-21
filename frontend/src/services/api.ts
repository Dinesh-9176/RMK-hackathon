/**
 * Aegis Harvest — Backend API Client
 * Connects the Next.js frontend to the FastAPI backend at localhost:8000.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Generic fetch helper ─────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${endpoint} failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface TelemetryPayload {
  temperature: number;
  humidity: number;
  vibration: number;
  ethylene?: number;
  co2?: number;
  door_status?: "open" | "closed";
  battery_level?: number;
  signal_strength?: number;
  session_id?: string;
}

export interface PredictionPayload {
  temp_c: number;
  humidity_pct: number;
  vibration_g: number;
  distance_km: number;
  dist_a_km?: number;
  dist_b_km?: number;
  road_a?: "Clear" | "Traffic" | "Construction" | "Blocked";
  road_b?: "Clear" | "Traffic" | "Construction" | "Blocked";
  cap_a_pct?: number;
  cap_b_pct?: number;
}

export interface PredictionResult {
  predicted_shelf_life_days: number;
  predicted_shelf_life_hours: number;
  recommended_center: string;
  survival_margins: {
    sm_original: number;
    sm_a: number;
    sm_b: number;
  };
  stress_index: number;
  market_pivot_trigger: boolean;
  risk_level: "safe" | "warning" | "critical";
}

export interface QuickPredictionResult {
  shelf_life_hours: number;
  shelf_life_days: number;
  risk_level: "safe" | "warning" | "critical";
  stress_index: number;
  market_pivot_trigger: boolean;
  recommended_center: string;
}

export interface AgentChatPayload {
  message: string;
  telemetry?: TelemetryPayload;
  session_id?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AgentAnalyzePayload {
  telemetry: TelemetryPayload;
  session_id?: string;
}

export interface AgentResponse {
  message: string;
  action_required: boolean;
  session_id?: string;
}

// ── Telemetry ────────────────────────────────────────────────────────────────
export const api = {
  telemetry: {
    log: (payload: TelemetryPayload) =>
      apiFetch("/api/telemetry/log", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    history: (limit = 20) =>
      apiFetch<{ records: unknown[]; count: number }>(
        `/api/telemetry/history?limit=${limit}`
      ),
  },

  // ── ML Predictions ────────────────────────────────────────────────────────
  predict: {
    full: (payload: PredictionPayload) =>
      apiFetch<PredictionResult>("/api/predict/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /**
     * Quick single-temperature prediction for the Simulation Lab slider.
     * Returns shelf life in hours, risk level, stress index etc.
     */
    quick: async (
      temperature: number,
      humidity = 85,
      vibration = 0.3,
      distance = 250
    ): Promise<QuickPredictionResult> =>
      apiFetch<QuickPredictionResult>(
        `/api/predict/quick?temperature=${temperature}&humidity=${humidity}&vibration=${vibration}&distance=${distance}`
      ),
  },

  // ── Routes ────────────────────────────────────────────────────────────────
  routes: {
    list: () =>
      apiFetch<{ routes: unknown[]; count: number }>("/api/routes/"),
  },

  // ── Facilities ────────────────────────────────────────────────────────────
  facilities: {
    list: () =>
      apiFetch<{ facilities: unknown[]; count: number }>("/api/facilities/"),
  },

  // ── Trip Logs ─────────────────────────────────────────────────────────────
  trips: {
    list: (limit = 50, status?: string) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (status) params.append("status", status);
      return apiFetch<{ trips: unknown[]; count: number }>(
        `/api/trips/?${params}`
      );
    },
  },

  // ── Rescue Points ─────────────────────────────────────────────────────────
  rescue: {
    list: (availableOnly = false) =>
      apiFetch<{ rescue_points: unknown[]; count: number }>(
        `/api/rescue/?available_only=${availableOnly}`
      ),
    best: () =>
      apiFetch<{ rescue_point: unknown | null }>("/api/rescue/best"),
  },

  // ── Recommendations ───────────────────────────────────────────────────────
  recommendations: {
    list: (limit = 20) =>
      apiFetch<{ recommendations: unknown[]; count: number }>(
        `/api/recommendations/?limit=${limit}`
      ),
    approve: (recId: string) =>
      apiFetch(`/api/recommendations/${recId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
    reject: (recId: string) =>
      apiFetch(`/api/recommendations/${recId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "reject" }),
      }),
  },

  // ── Agent ─────────────────────────────────────────────────────────────────
  agent: {
    chat: (payload: AgentChatPayload) =>
      apiFetch<AgentResponse>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /**
     * Fire-and-forget autonomous analysis — no user message required.
     * Call this when temperature crosses a threshold.
     */
    analyze: (payload: AgentAnalyzePayload) =>
      apiFetch<AgentResponse>("/api/agent/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    history: (sessionId: string) =>
      apiFetch<{ session_id: string; history: unknown[]; count: number }>(
        `/api/agent/history/${sessionId}`
      ),
  },

  // ── Health ────────────────────────────────────────────────────────────────
  health: () => apiFetch<{ status: string }>("/health"),
};
