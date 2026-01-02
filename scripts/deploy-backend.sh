#!/bin/bash

# Production-level backend deployment to Google Cloud Run
# Builds Docker images, pushes to Artifact Registry, and deploys to Cloud Run
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Docker installed
# - Service account created with necessary permissions
# - Secrets created in Secret Manager

set -e

# Set gcloud Python path if not set
if [ -z "$CLOUDSDK_PYTHON" ]; then
  export CLOUDSDK_PYTHON=/opt/homebrew/opt/python@3.13/bin/python3
fi

# Add gcloud to PATH if not present
if ! command -v gcloud &> /dev/null; then
  export PATH=/opt/homebrew/share/google-cloud-sdk/bin:$PATH
fi

# Configuration
PROJECT_ID="resume-tailor-saas"
REGION="us-central1"
ARTIFACT_REGISTRY_REPO="resume-tailor-saas"
SERVICE_ACCOUNT_EMAIL="resume-tailor-saas@${PROJECT_ID}.iam.gserviceaccount.com"

# Frontend URL for CORS (update this after frontend deployment)
FRONTEND_URL="${FRONTEND_URL:-https://resume-tailor-saas.web.app}"

# Image versioning (use git commit SHA or timestamp)
IMAGE_VERSION="${IMAGE_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting production backend deployment to Cloud Run...${NC}\n"
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Image Version: ${IMAGE_VERSION}"
echo -e "  Frontend URL: ${FRONTEND_URL}\n"

# Validation
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
  echo "Visit: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
  exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting GCP project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable artifactregistry.googleapis.com --quiet
gcloud services enable secretmanager.googleapis.com --quiet
gcloud services enable firestore.googleapis.com --quiet
gcloud services enable storage-component.googleapis.com --quiet

# Create Artifact Registry repository if it doesn't exist
echo -e "${BLUE}📦 Checking Artifact Registry repository...${NC}"
if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} --location=${REGION} &> /dev/null; then
  echo -e "${YELLOW}Creating Artifact Registry repository...${NC}"
  gcloud artifacts repositories create ${ARTIFACT_REGISTRY_REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Docker repository for Resume Tailor SaaS backend services" \
    --quiet
  echo -e "${GREEN}✓ Artifact Registry repository created${NC}"
else
  echo -e "${GREEN}✓ Artifact Registry repository already exists${NC}"
fi

# Configure Docker to use gcloud as credential helper
echo -e "${BLUE}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Base image path
BASE_IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"

# Build and push documents-api
echo -e "\n${BLUE}📦 Building documents-api Docker image...${NC}"
IMAGE_NAME_DOCUMENTS="${BASE_IMAGE_PATH}/documents-api:${IMAGE_VERSION}"
IMAGE_NAME_DOCUMENTS_LATEST="${BASE_IMAGE_PATH}/documents-api:latest"

docker build --platform linux/amd64 -f apps/documents-api/Dockerfile \
  -t ${IMAGE_NAME_DOCUMENTS} \
  -t ${IMAGE_NAME_DOCUMENTS_LATEST} \
  .

echo -e "${BLUE}📤 Pushing documents-api to Artifact Registry...${NC}"
docker push ${IMAGE_NAME_DOCUMENTS}
docker push ${IMAGE_NAME_DOCUMENTS_LATEST}
echo -e "${GREEN}✓ documents-api image pushed: ${IMAGE_NAME_DOCUMENTS}${NC}"

# Build and push generate-api
echo -e "\n${BLUE}📦 Building generate-api Docker image...${NC}"
IMAGE_NAME_GENERATE="${BASE_IMAGE_PATH}/generate-api:${IMAGE_VERSION}"
IMAGE_NAME_GENERATE_LATEST="${BASE_IMAGE_PATH}/generate-api:latest"

docker build --platform linux/amd64 -f apps/generate-api/Dockerfile \
  -t ${IMAGE_NAME_GENERATE} \
  -t ${IMAGE_NAME_GENERATE_LATEST} \
  .

echo -e "${BLUE}📤 Pushing generate-api to Artifact Registry...${NC}"
docker push ${IMAGE_NAME_GENERATE}
docker push ${IMAGE_NAME_GENERATE_LATEST}
echo -e "${GREEN}✓ generate-api image pushed: ${IMAGE_NAME_GENERATE}${NC}"

# Deploy documents-api to Cloud Run
echo -e "\n${BLUE}🚀 Deploying documents-api to Cloud Run...${NC}"
gcloud run deploy documents-api \
  --image ${IMAGE_NAME_DOCUMENTS} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --set-env-vars CORS_ORIGIN=${FRONTEND_URL},FIREBASE_STORAGE_BUCKET=resume-tailor-saas.firebasestorage.app \
  --set-secrets FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --port 8080 \
  --quiet

# Get documents-api URL
DOCUMENTS_API_URL=$(gcloud run services describe documents-api --region=${REGION} --format='value(status.url)')
echo -e "${GREEN}✓ documents-api deployed: ${DOCUMENTS_API_URL}${NC}"

# Deploy generate-api to Cloud Run
echo -e "\n${BLUE}🚀 Deploying generate-api to Cloud Run...${NC}"
gcloud run deploy generate-api \
  --image ${IMAGE_NAME_GENERATE} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --set-env-vars CORS_ORIGIN=${FRONTEND_URL},OPENROUTER_MODEL=mistralai/devstral-2512:free,FIREBASE_STORAGE_BUCKET=resume-tailor-saas.firebasestorage.app \
  --set-secrets FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest,OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --port 8081 \
  --quiet

# Get generate-api URL
GENERATE_API_URL=$(gcloud run services describe generate-api --region=${REGION} --format='value(status.url)')
echo -e "${GREEN}✓ generate-api deployed: ${GENERATE_API_URL}${NC}"

echo -e "\n${GREEN}✅ Production backend deployment complete!${NC}\n"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "  Image Version: ${IMAGE_VERSION}"
echo -e "  Documents API: ${DOCUMENTS_API_URL}"
echo -e "  Generate API: ${GENERATE_API_URL}"
