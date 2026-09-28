# RESCUE-X — Start Laptop AI Backend Server Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting RESCUE-X Laptop AI & Telemetry Backend Server" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"

Write-Host "Installing/Verifying Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Launching FastAPI Uvicorn Server..." -ForegroundColor Green
Write-Host "FastAPI URL:      http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:         http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "WebSocket Hub:    ws://localhost:8000/ws" -ForegroundColor Cyan
Write-Host "Frame Ingest:     POST http://localhost:8000/api/camera/frame" -ForegroundColor Cyan
Write-Host ""

python main.py
