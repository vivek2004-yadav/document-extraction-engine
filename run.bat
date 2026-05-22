@echo off
title ExEngine Launcher
echo =========================================================
echo       Starting Document Extraction Engine (ExEngine)
echo =========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

if not exist .venv (
    echo [1/3] Creating Python virtual environment venv...
    python -m venv .venv
) else (
    echo [1/3] Virtual environment venv already exists.
)

echo [2/3] Activating environment and installing/updating dependencies...
call .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

echo [3/3] Launching Backend and Frontend services...
echo.

start "ExEngine Backend API" cmd /k "call .venv\Scripts\activate && uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

start "ExEngine Frontend App" cmd /k "cd frontend && npm run dev"

echo =========================================================
echo  Success! Services have been launched in separate consoles.
echo.
echo  - Backend API documentation: http://localhost:8000/docs
echo  - Frontend Workspace:         http://localhost:5173
echo.
echo  Keep these terminal windows open to use the application.
echo =========================================================
echo.
pause
