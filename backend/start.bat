@echo off
echo Starting Aegis Harvest Backend...
cd /d "%~dp0"
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
pause
