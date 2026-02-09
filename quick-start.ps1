# Pulse - Quick Start Script for Windows
# Run this script with: .\quick-start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pulse - Real-Time Analytics Dashboard" -ForegroundColor Cyan
Write-Host "  Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
docker-compose up -d kafka kafka-ui timescaledb redis

Write-Host ""
Write-Host "Waiting for services to be healthy (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor Yellow
Write-Host "  • Kafka UI:      http://localhost:8080" -ForegroundColor White
Write-Host "  • Kafka:         localhost:9092 (KRaft mode - no Zookeeper!)" -ForegroundColor White
Write-Host "  • TimescaleDB:   localhost:5433" -ForegroundColor White
Write-Host "  • Redis:         localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Install dependencies:  npm install" -ForegroundColor White
Write-Host "  2. Create Kafka topics:   npm run kafka:create-topics" -ForegroundColor White
Write-Host "  3. Copy env files:        Copy .env.example to .env in each service" -ForegroundColor White
Write-Host "  4. Start development:     npm run dev:all" -ForegroundColor White
Write-Host ""
Write-Host "To stop services:          npm run docker:down" -ForegroundColor White
Write-Host "To view logs:              npm run docker:logs" -ForegroundColor White
Write-Host ""
