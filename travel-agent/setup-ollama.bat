@echo off
REM Install Ollama + a local model, and fix the context-window default that
REM silently breaks the budget analyst.
REM
REM   setup-ollama.bat          -> qwen2.5:3b (fast, ~1.9 GB)
REM   setup-ollama.bat 7b       -> qwen2.5:7b (better, ~4.7 GB)
setlocal
cd /d "%~dp0"

set "MODEL=qwen2.5:3b"
if /i "%~1"=="7b" set "MODEL=qwen2.5:7b"

REM Ollama defaults to a 4096-token context. The budget analyst's prompt runs
REM past that, Ollama shifts the context mid-generation, and the agent silently
REM starts repeating the itinerary. 8192 fixes it.
echo [ollama] Setting OLLAMA_CONTEXT_LENGTH=8192...
setx OLLAMA_CONTEXT_LENGTH 8192 >nul
set "OLLAMA_CONTEXT_LENGTH=8192"

where ollama >nul 2>&1
if errorlevel 1 (
    echo [ollama] Installing via winget...
    winget install --id Ollama.Ollama --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    set "PATH=%LOCALAPPDATA%\Programs\Ollama;%PATH%"
)

echo [ollama] Pulling %MODEL%...
ollama pull %MODEL%

echo [ollama] Restarting the server so it picks up the new context size...
for /f "tokens=2" %%p in ('wmic process where "name='ollama.exe'" get processid /value ^| find "="') do taskkill /f /pid %%p >nul 2>&1
timeout /t 3 /nobreak >nul
start "" /b ollama serve
timeout /t 5 /nobreak >nul

echo [ollama] Done. Verify with: curl http://localhost:11434/api/ps
endlocal
