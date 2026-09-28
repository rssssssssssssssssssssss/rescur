# RESCUE-X — Start Mobile App Dashboard Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting RESCUE-X Mobile App Dashboard" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\mobile"

Write-Host "Installing NPM dependencies if needed..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Starting React Native / Web Dashboard..." -ForegroundColor Green
npm start
