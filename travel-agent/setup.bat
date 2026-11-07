@echo off
REM One-time setup: create the virtualenv, install dependencies, seed .env.
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [setup] Creating virtualenv...
    where uv >nul 2>&1 && (
        uv venv --python 3.12 .venv
    ) || (
        python -m venv .venv
    )
)

echo [setup] Installing dependencies...
".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
".venv\Scripts\python.exe" -m pip install --quiet crewai python-dotenv

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [setup] Created .env - add your OPENAI_API_KEY and you are done.
) else (
    echo [setup] .env already exists, leaving it alone.
)

echo [setup] Done. Run: run.bat --destination "Tokyo, Japan" --days 5 --budget 2000
endlocal
