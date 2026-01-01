# Resume Tailor SaaS

A lightweight SaaS that rewrites resumes to better match a specific job description by highlighting existing skills and experience.  
Built as a realistic production-style project using Google Cloud services.

## Features

- Upload resume (PDF or text)
- Paste job description
- AI-powered resume tailoring (no hallucinated facts)
- Preview rewritten resume
- Download final document
- Firebase authentication

## Tech Stack

### Frontend

- React + Vite
- React Query (server state)
- Zustand (UI state)
- Firebase Hosting

### Backend

- Google Cloud Run (TypeScript)
- Express/Fastify
- Two services:
  - documents-api (files, parsing, data)
  - generate-api (AI generation)

### Data & Infra

- Firebase Authentication
- Firestore (NoSQL)
- Cloud Storage (PDF files)
- Google Secret Manager
- Mistral AI API

## Architecture Overview

- Frontend calls backend services directly
- Services are stateless
- Firestore is the shared source of truth
- No direct service-to-service calls
- Authentication via Firebase ID tokens

## Services

### documents-api

- POST /documents
- GET /documents/:id
- GET /documents

Handles:

- Auth verification
- PDF upload
- Resume parsing
- Firestore persistence

### generate-api

- POST /documents/:id/generate

Handles:

- Auth verification
- Prompt building
- AI generation
- Saving final resume

## Local Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Firebase CLI (installed via pnpm)

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start Firebase Emulators:

```bash
pnpm emulators
```

This will start:

- Auth Emulator on port 9099
- Firestore Emulator on port 8082
- Storage Emulator on port 9199
- Emulator UI on http://localhost:4000

3. In separate terminals, start backend services:

```bash
# Terminal 2: Documents API
FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 \
FIRESTORE_EMULATOR_HOST=localhost:8082 \
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199 \
FIREBASE_PROJECT_ID=demo-project \
pnpm dev:documents-api

# Terminal 3: Generate API
FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 \
FIRESTORE_EMULATOR_HOST=localhost:8082 \
FIREBASE_PROJECT_ID=demo-project \
OPENROUTER_API_KEY=your-key \
pnpm dev:generate-api

# Terminal 4: Frontend
VITE_USE_FIREBASE_EMULATOR=true \
VITE_FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 \
VITE_FIRESTORE_EMULATOR_HOST=localhost \
VITE_FIRESTORE_EMULATOR_PORT=8082 \
VITE_FIREBASE_STORAGE_EMULATOR_HOST=localhost \
VITE_FIREBASE_STORAGE_EMULATOR_PORT=9199 \
VITE_FIREBASE_PROJECT_ID=demo-project \
pnpm dev
```

### Environment Variables

#### Backend Services (documents-api, generate-api)

For emulator mode:

- `FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099`
- `FIRESTORE_EMULATOR_HOST=localhost:8082`
- `FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199` (only for documents-api)
- `FIREBASE_PROJECT_ID=demo-project`

For production mode:

- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON service account key
- `OPENROUTER_API_KEY` - OpenRouter API key (only for generate-api)

#### Frontend

For emulator mode:

- `VITE_USE_FIREBASE_EMULATOR=true`
- `VITE_FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099`
- `VITE_FIRESTORE_EMULATOR_HOST=localhost`
- `VITE_FIRESTORE_EMULATOR_PORT=8082`
- `VITE_FIREBASE_STORAGE_EMULATOR_HOST=localhost`
- `VITE_FIREBASE_STORAGE_EMULATOR_PORT=9199`
- `VITE_FIREBASE_PROJECT_ID=demo-project`

For production mode:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Deployment

- Frontend: Firebase Hosting
- Backend: Docker images → Google Artifact Registry → Cloud Run
- Each deploy creates a new Cloud Run revision

## Purpose

This project is built as:

- a learning reference for serverless SaaS on GCP
- a demo project for technical interviews
- a realistic foundation for a B2C AI product
