#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
trap 'kill 0' EXIT

lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "Starting API..."
cd "$DIR/apps/api" && bun run dev &
API_PID=$!

echo "Starting Tauri (mobile)..."
cd "$DIR/apps/mobile" && bun run tauri dev &
TAURI_PID=$!

wait
