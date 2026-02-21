"""
init_db.py — seeds the Supabase database with initial data.
Run once: python init_db.py
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

FACILITIES = [
    {"name": "Center A – Metro Cold Hub", "temperature": 3.1, "humidity": 88,
     "power_status": "normal", "storage_capacity": 5000, "current_load": 3200},
    {"name": "Center B – Regional Depot", "temperature": 4.8, "humidity": 82,
     "power_status": "normal", "storage_capacity": 3000, "current_load": 2100},
]

RESCUE_POINTS = [
    {"name": "QuickFreeze Depot",  "distance": 12, "recovery_chance": 92,
     "type": "cold-storage", "available": True,  "eta": 18},
    {"name": "FreshMart Outlet",   "distance": 8,  "recovery_chance": 78,
     "type": "market",       "available": True,  "eta": 12},
    {"name": "AgriProcess Plant",  "distance": 22, "recovery_chance": 65,
     "type": "processing",   "available": True,  "eta": 30},
    {"name": "ColdChain Hub B2",   "distance": 35, "recovery_chance": 88,
     "type": "cold-storage", "available": False, "eta": 45},
    {"name": "Metro Fresh Market", "distance": 5,  "recovery_chance": 71,
     "type": "market",       "available": True,  "eta": 8},
]

ROUTES = [
    {"route_id": "R1", "name": "Route Alpha", "origin": "Farm Hub A",
     "destination": "Center A",  "eta": 180, "survival_margin": 900,
     "distance": 245.0, "status": "on-track", "road_condition": "Clear"},
    {"route_id": "R2", "name": "Route Beta",  "origin": "Farm Hub B",
     "destination": "Center B",  "eta": 240, "survival_margin": 600,
     "distance": 312.0, "status": "on-track", "road_condition": "Traffic"},
    {"route_id": "R3", "name": "Route Gamma", "origin": "Farm Hub C",
     "destination": "Center A",  "eta": 120, "survival_margin": 1200,
     "distance": 178.0, "status": "on-track", "road_condition": "Clear"},
    {"route_id": "R4", "name": "Route Delta", "origin": "Farm Hub A",
     "destination": "Market D",  "eta": 300, "survival_margin": 300,
     "distance": 405.0, "status": "delayed",  "road_condition": "Construction"},
]

TRIP_LOGS = [
    {"trip_id": "T001", "date": "2026-02-20", "route": "Route Alpha",
     "cargo": "Mangoes – 2.4 tons",      "duration": "3h 12m",
     "temp_range": "2.1°C – 4.8°C",  "status": "completed", "shelf_life_used": 18},
    {"trip_id": "T002", "date": "2026-02-19", "route": "Route Beta",
     "cargo": "Tomatoes – 1.8 tons",     "duration": "4h 05m",
     "temp_range": "3.2°C – 6.1°C",  "status": "completed", "shelf_life_used": 24},
    {"trip_id": "T003", "date": "2026-02-18", "route": "Route Gamma",
     "cargo": "Leafy Greens – 0.9 tons", "duration": "2h 30m",
     "temp_range": "1.8°C – 3.5°C",  "status": "completed", "shelf_life_used": 12},
    {"trip_id": "T004", "date": "2026-02-17", "route": "Route Delta",
     "cargo": "Dairy – 3.1 tons",        "duration": "5h 20m",
     "temp_range": "4.5°C – 12.3°C", "status": "incident",  "shelf_life_used": 45},
    {"trip_id": "T005", "date": "2026-02-16", "route": "Route Alpha",
     "cargo": "Berries – 1.2 tons",      "duration": "3h 00m",
     "temp_range": "1.5°C – 3.0°C",  "status": "completed", "shelf_life_used": 15},
    {"trip_id": "T006", "date": "2026-02-15", "route": "Route Beta",
     "cargo": "Fish – 2.0 tons",         "duration": "4h 45m",
     "temp_range": "6.0°C – 18.5°C", "status": "aborted",   "shelf_life_used": 72},
]


def seed_table(table: str, data: list, conflict_col: str = None):
    print(f"Seeding {table}…", end=" ")
    try:
        if conflict_col:
            res = client.table(table).upsert(data).execute()
        else:
            res = client.table(table).insert(data).execute()
        print(f"OK ({len(res.data)} rows)")
    except Exception as e:
        print(f"WARN: {e}")


if __name__ == "__main__":
    print("=== Aegis Harvest — Database Initialisation ===")
    seed_table("facilities",    FACILITIES,   conflict_col="name")
    seed_table("rescue_points", RESCUE_POINTS)
    seed_table("routes",        ROUTES,       conflict_col="route_id")
    seed_table("trip_logs",     TRIP_LOGS,    conflict_col="trip_id")
    print("=== Done! ===")
