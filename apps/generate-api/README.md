# Generate API

Service for generating tailored resumes using OpenRouter (Devstral 2 2512 free model).

## Endpoints

- `POST /documents/:id/generate` - Generate tailored resume
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 8081)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON Firebase service account key (string)
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_MODEL` - Model to use (default: "mistralai/devstral-2512:free")
- `OPENROUTER_HTTP_REFERER` - Optional HTTP Referer for OpenRouter

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
  -e OPENROUTER_API_KEY='...' \
  -e OPENROUTER_MODEL='mistralai/devstral-2512:free' \
  generate-api
```
