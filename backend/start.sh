#!/usr/bin/env bash
set -e
echo "Installing dependencies..."
pip install -r requirements.txt
echo "Starting Aegis Harvest backend on port 8000..."
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
