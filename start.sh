#!/usr/bin/env bash
set -e

BASE="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$BASE/backend"
FRONTEND="$BASE/frontend"

# ── Backend ──────────────────────────────────────────────────────────────────
if [ ! -d "$BACKEND/.venv" ]; then
  echo "Creating Python venv..."
  python3 -m venv "$BACKEND/.venv"
fi

echo "Installing backend dependencies..."
"$BACKEND/.venv/bin/pip" install -q -r "$BACKEND/requirements.txt"

mkdir -p "$BACKEND/data"

echo "Starting backend on http://localhost:8000 ..."
pushd "$BACKEND" > /dev/null
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
popd > /dev/null

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "Installing frontend dependencies..."
pushd "$FRONTEND" > /dev/null
npm install --silent
echo "Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
popd > /dev/null

echo ""
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
