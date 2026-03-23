#!/bin/bash

# InternConnect - Fresh Start Script
# Backend: FastAPI + Uvicorn on port 8000
# Frontend: React + Vite on port 5173
# Database: MySQL

set -e

PROJECT_ROOT="/Users/izzeldeenmarie/Desktop/llm/InternConnectGraph"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo ""
echo "=========================================="
echo "  InternConnect - Starting Fresh"
echo "=========================================="
echo ""

# Kill any existing processes
echo "[1/4] Cleaning up old processes..."
killall -9 uvicorn node npm python vite 2>/dev/null || true
sleep 2

# Start Backend
echo "[2/4] Starting Backend (FastAPI + Uvicorn on :8000)..."
cd "$BACKEND_DIR"
source venv/bin/activate
export PYTHONPATH="$PROJECT_ROOT:$BACKEND_DIR"
uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start!"
    tail -20 /tmp/backend.log
    exit 1
fi
echo "✅ Backend running (PID: $BACKEND_PID)"

# Start Frontend
echo "[3/4] Starting Frontend (React + Vite on :5173)..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 4

# Check if frontend started
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start!"
    tail -20 /tmp/frontend.log
    exit 1
fi
echo "✅ Frontend running (PID: $FRONTEND_PID)"

# Verify connections
echo "[4/4] Verifying connections..."
sleep 2

if lsof -i :8000 >/dev/null 2>&1; then
    echo "✅ Backend listening on :8000"
else
    echo "❌ Backend not listening on :8000"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "✅ Frontend listening on :5173"
else
    echo "❌ Frontend not listening on :5173"
fi

echo ""
echo "=========================================="
echo "  ✅ Everything Ready!"
echo "=========================================="
echo ""
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:5173"
echo "Database: MySQL (internconnect)"
echo ""
echo "Logs:"
echo "  Backend:  /tmp/backend.log"
echo "  Frontend: /tmp/frontend.log"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep running
wait
