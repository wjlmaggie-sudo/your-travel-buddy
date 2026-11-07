@echo off
REM Run the travel planner. All arguments are passed straight through, e.g.
REM   run.bat --destination "Tokyo, Japan" --days 5 --budget 2000
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [!] No virtualenv found. Run setup.bat first.
    exit /b 1
)

set PYTHONIOENCODING=utf-8
".venv\Scripts\python.exe" agent.py %*
endlocal
