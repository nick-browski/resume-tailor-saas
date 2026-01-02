#!/bin/bash

# Check if Java is installed (required for Firebase Emulators)
if ! command -v java &> /dev/null; then
  echo "⚠️  Java is not installed. Installing..."
  if command -v brew &> /dev/null; then
    brew install openjdk@17
    export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  else
    echo "❌ Please install Java manually. Firebase Emulators require Java."
    exit 1
  fi
fi

# Load .env file if it exists (from project root or generate-api directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env" ]; then
  echo "📄 Loading .env from project root..."
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
elif [ -f "$PROJECT_ROOT/apps/generate-api/.env" ]; then
  echo "📄 Loading .env from apps/generate-api..."
  set -a
  source "$PROJECT_ROOT/apps/generate-api/.env"
  set +a
fi

# Set environment variables for emulator mode
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
export FIRESTORE_EMULATOR_HOST="localhost:8082"
export FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199"
export FIREBASE_PROJECT_ID="demo-project"

# Start both backend services in parallel
echo "🚀 Starting backend services..."
echo "📋 Documents API: http://localhost:8080"
echo "📋 Generate API: http://localhost:8081"
echo ""

# Start documents-api
FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" \
FIRESTORE_EMULATOR_HOST="localhost:8082" \
FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199" \
FIREBASE_PROJECT_ID="demo-project" \
pnpm dev:documents-api &

# Start generate-api
FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" \
FIRESTORE_EMULATOR_HOST="localhost:8082" \
FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199" \
FIREBASE_PROJECT_ID="demo-project" \
OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
pnpm dev:generate-api &

# Wait for both processes
wait
