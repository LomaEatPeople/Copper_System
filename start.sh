#!/bin/bash
# Start both backend and frontend

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/2] Starting backend..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python init_db.py
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "[2/2] Starting frontend..."
cd "$SCRIPT_DIR/frontend"
npm run start &
FRONTEND_PID=$!

echo ""
echo "Backend : http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" SIGINT SIGTERM
wait
