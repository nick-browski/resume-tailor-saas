# Generate API

Service for generating tailored resumes using Mistral AI API.

## Endpoints

- `POST /documents/:id/generate` - Generate tailored resume
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 8081)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON Firebase service account key (string)
- `MISTRAL_API_KEY` - Mistral API key
- `MISTRAL_MODEL` - Model to use (default: "mistral-small-latest")

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
docker build -f apps/generate-api/Dockerfile -t generate-api .
docker run -p 8081:8081 \
  -e FIREBASE_SERVICE_ACCOUNT_KEY='...' \
  -e MISTRAL_API_KEY='...' \
  -e MISTRAL_MODEL='mistral-small-latest' \
  generate-api
```
