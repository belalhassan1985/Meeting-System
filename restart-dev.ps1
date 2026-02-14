# Script to restart development servers with clean cache

Write-Host "🔄 Restarting development environment..." -ForegroundColor Cyan

# Stop any running node processes
Write-Host "⏹️  Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean and rebuild shared package
Write-Host "📦 Building shared package..." -ForegroundColor Green
Set-Location packages/shared
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run build
Set-Location ../..

# Clean API build cache
Write-Host "🧹 Cleaning API cache..." -ForegroundColor Green
Set-Location apps/api
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

Write-Host "`n✅ Ready! Now run these commands in separate terminals:" -ForegroundColor Green
Write-Host "   Terminal 1: cd apps/api && npm run dev" -ForegroundColor Cyan
Write-Host "   Terminal 2: cd apps/web && npm run dev" -ForegroundColor Cyan
Write-Host "`n⚠️  Remember: You need PostgreSQL and LiveKit running!" -ForegroundColor Yellow
