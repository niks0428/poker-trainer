#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Starting Poker Trainer backend on port 5700..."
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 5700 &
BACKEND_PID=$!

echo "Starting Poker Trainer frontend on port 5800..."
cd frontend && npm run dev -- --host 0.0.0.0 --port 5800 &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:5700"
echo "  Frontend: http://localhost:5800"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
