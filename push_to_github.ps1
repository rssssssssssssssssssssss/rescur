# RESCUE-X — Auto Push to GitHub Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  RESCUE-X Auto-Git Push to GitHub" -ForegroundColor Green
Write-Host "  Repository: https://github.com/rssssssssssssssssssssss/rescur" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# 1. Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Initializing Git..." -ForegroundColor Yellow
    git init
}

# 2. Configure branch and remote
Write-Host "[2/5] Setting main branch and origin..." -ForegroundColor Yellow
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/rssssssssssssssssssssss/rescur.git

# 3. Stage all files
Write-Host "[3/5] Staging all files..." -ForegroundColor Yellow
git add .

# 4. Commit changes
Write-Host "[4/5] Committing changes..." -ForegroundColor Yellow
$commitMsg = "Push RESCUE-X AI Search & Rescue Rover System (Laptop AI Server + Mobile App)"
git commit -m $commitMsg

# 5. Push to GitHub
Write-Host "[5/5] Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: All files pushed to GitHub!" -ForegroundColor Green
Write-Host "  View repository: https://github.com/rssssssssssssssssssssss/rescur" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
