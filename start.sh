#!/bin/bash

echo "🚀 Booting InternConnectGraph..."

# Trap CTRL+C and kill both processes cleanly
trap 'kill 0' SIGINT SIGTERM EXIT

# 1. Start Python Backend in the background
echo "➔ Starting Backend API on http://127.0.0.1:8000..."
source backend/venv/bin/activate
uvicorn backend.main:app --reload --port 8000 &

# Give the backend a second to launch
sleep 2

# 2. Start React Frontend in the foreground
echo "➔ Starting React Frontend..."
cd frontend
npm run dev
