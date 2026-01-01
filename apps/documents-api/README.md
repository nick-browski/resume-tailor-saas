# Documents API

Service for working with documents (resumes). Handles PDF upload, text parsing, and saving to Firestore/Storage.

## Endpoints

- `POST /documents` - Create document (upload PDF or text)
- `GET /documents` - Get all user documents
- `GET /documents/:id` - Get document by ID
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 8080)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON Firebase service account key (string)

## Local Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Docker

Build must be executed from the project root (monorepo):

```bash
# From project root
docker build -f apps/documents-api/Dockerfile -t documents-api .
docker run -p 8080:8080 -e FIREBASE_SERVICE_ACCOUNT_KEY='...' documents-api
```
