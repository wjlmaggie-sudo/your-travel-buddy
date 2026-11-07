@echo off
title iTravel Travel App
cd /d "%~dp0"
"%ProgramFiles%\nodejs\node.exe" server.js
if errorlevel 1 (
  echo.
  echo Node.js not found. Install it from https://nodejs.org (LTS) and try again.
  pause
)
