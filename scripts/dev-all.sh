#!/bin/bash

# Start all services: emulators, backend, and frontend

echo "🚀 Starting all services..."
echo ""

# Start Firebase Emulators in background
echo "📦 Starting Firebase Emulators..."
firebase emulators:start --project demo-project --import ./firebase-data --export-on-exit ./firebase-data &
EMULATORS_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to start..."
sleep 5

# Start backend services in background
echo "🔧 Starting backend services..."
./scripts/dev-backend.sh &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend (this will block)
echo "🎨 Starting frontend..."
VITE_USE_FIREBASE_EMULATOR=true \
VITE_FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 \
VITE_FIRESTORE_EMULATOR_HOST=localhost \
VITE_FIRESTORE_EMULATOR_PORT=8082 \
VITE_FIREBASE_STORAGE_EMULATOR_HOST=localhost \
VITE_FIREBASE_STORAGE_EMULATOR_PORT=9199 \
VITE_FIREBASE_PROJECT_ID=demo-project \
pnpm --filter frontend dev

# Cleanup on exit
trap "kill $EMULATORS_PID $BACKEND_PID 2>/dev/null" EXIT

