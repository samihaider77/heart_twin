# Run Cardiac Digital Twin V2

Write-Host "Starting Cardiac Digital Twin V2..." -ForegroundColor Cyan

# Check if Ollama is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -ErrorAction Stop
    Write-Host "[OK] Ollama is running." -ForegroundColor Green
} catch {
    Write-Host "[!] Warning: Ollama is not running. AI analysis will be unavailable." -ForegroundColor Yellow
    Write-Host "Please start Ollama and pull gemma4 if you haven't already." -ForegroundColor Gray
}

# Start Backend
Write-Host "[*] Starting Backend (FastAPI)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& .\venv\Scripts\Activate.ps1; cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Start Frontend
Write-Host "[*] Starting Frontend (Next.js)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services are starting!" -ForegroundColor Magenta
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000/docs" -ForegroundColor Cyan
