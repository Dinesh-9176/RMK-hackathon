-- ============================================================
-- Aegis Harvest — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- ── Telemetry Sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry_sessions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      TEXT,
    temperature     FLOAT,
    humidity        FLOAT,
    vibration       FLOAT,
    ethylene        FLOAT,
    co2             FLOAT,
    door_status     TEXT DEFAULT 'closed',
    battery_level   INT,
    signal_strength INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ML Predictions Log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ml_predictions (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    input_data            JSONB,
    predicted_shelf_life  FLOAT,
    recommended_center    TEXT,
    survival_margins      JSONB,
    stress_index          FLOAT,
    market_pivot_trigger  BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Routes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id        TEXT UNIQUE NOT NULL,
    name            TEXT,
    origin          TEXT,
    destination     TEXT,
    eta             INT,          -- minutes
    survival_margin INT,          -- minutes
    distance        FLOAT,        -- km
    status          TEXT DEFAULT 'on-track',
    road_condition  TEXT DEFAULT 'Clear',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Facilities ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facilities (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name             TEXT UNIQUE NOT NULL,
    temperature      FLOAT,
    humidity         FLOAT,
    power_status     TEXT DEFAULT 'normal',
    storage_capacity INT,
    current_load     INT,
    last_updated     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trip Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id         TEXT UNIQUE NOT NULL,
    date            DATE,
    route           TEXT,
    cargo           TEXT,
    duration        TEXT,
    temp_range      TEXT,
    status          TEXT DEFAULT 'completed',
    shelf_life_used INT,          -- percentage
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rescue Points (Market Pivot) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rescue_points (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    distance        FLOAT,        -- km
    recovery_chance INT,          -- percentage
    type            TEXT,         -- cold-storage | market | processing
    available       BOOLEAN DEFAULT TRUE,
    eta             INT,          -- minutes
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Recommendations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rec_id      TEXT UNIQUE NOT NULL,
    type        TEXT,             -- reroute | speed-adjust | alert | market-pivot
    severity    TEXT,             -- low | medium | high | critical
    message     TEXT,
    status      TEXT DEFAULT 'pending',  -- pending | approved | rejected
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ── Agent Conversations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_conversations (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,    -- user | assistant
    content     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_telemetry_session ON telemetry_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON telemetry_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status    ON ai_recommendations (status);
CREATE INDEX IF NOT EXISTS idx_conversations_sid ON agent_conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_trips_status      ON trip_logs (status);

-- ── Seed Data ─────────────────────────────────────────────────────────────────

-- Facilities
INSERT INTO facilities (name, temperature, humidity, power_status, storage_capacity, current_load)
VALUES
    ('Center A – Metro Cold Hub', 3.1, 88, 'normal', 5000, 3200),
    ('Center B – Regional Depot', 4.8, 82, 'normal', 3000, 2100)
ON CONFLICT (name) DO NOTHING;

-- Rescue Points
INSERT INTO rescue_points (name, distance, recovery_chance, type, available, eta)
VALUES
    ('QuickFreeze Depot',  12,  92, 'cold-storage', TRUE,  18),
    ('FreshMart Outlet',    8,  78, 'market',        TRUE,  12),
    ('AgriProcess Plant',  22,  65, 'processing',    TRUE,  30),
    ('ColdChain Hub B2',   35,  88, 'cold-storage',  FALSE, 45),
    ('Metro Fresh Market',  5,  71, 'market',        TRUE,   8)
ON CONFLICT DO NOTHING;

-- Routes
INSERT INTO routes (route_id, name, origin, destination, eta, survival_margin, distance, status, road_condition)
VALUES
    ('R1', 'Route Alpha', 'Farm Hub A', 'Center A',  180, 900,  245.0, 'on-track', 'Clear'),
    ('R2', 'Route Beta',  'Farm Hub B', 'Center B',  240, 600,  312.0, 'on-track', 'Traffic'),
    ('R3', 'Route Gamma', 'Farm Hub C', 'Center A',  120, 1200, 178.0, 'on-track', 'Clear'),
    ('R4', 'Route Delta', 'Farm Hub A', 'Market D',  300, 300,  405.0, 'delayed',  'Construction')
ON CONFLICT (route_id) DO NOTHING;

-- Trip Logs
INSERT INTO trip_logs (trip_id, date, route, cargo, duration, temp_range, status, shelf_life_used)
VALUES
    ('T001', '2026-02-20', 'Route Alpha', 'Mangoes – 2.4 tons',      '3h 12m', '2.1°C – 4.8°C',  'completed', 18),
    ('T002', '2026-02-19', 'Route Beta',  'Tomatoes – 1.8 tons',     '4h 05m', '3.2°C – 6.1°C',  'completed', 24),
    ('T003', '2026-02-18', 'Route Gamma', 'Leafy Greens – 0.9 tons', '2h 30m', '1.8°C – 3.5°C',  'completed', 12),
    ('T004', '2026-02-17', 'Route Delta', 'Dairy – 3.1 tons',        '5h 20m', '4.5°C – 12.3°C', 'incident',  45),
    ('T005', '2026-02-16', 'Route Alpha', 'Berries – 1.2 tons',      '3h 00m', '1.5°C – 3.0°C',  'completed', 15),
    ('T006', '2026-02-15', 'Route Beta',  'Fish – 2.0 tons',         '4h 45m', '6.0°C – 18.5°C', 'aborted',   72)
ON CONFLICT (trip_id) DO NOTHING;
