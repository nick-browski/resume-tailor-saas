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

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Initialize gcloud
init_gcloud

# Configuration
PROJECT_ID="${PROJECT_ID:-resume-tailor-saas}"
REGION="${REGION:-us-central1}"
ARTIFACT_REGISTRY_REPO="resume-tailor-saas"
SERVICE_ACCOUNT_EMAIL="resume-tailor-saas@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUD_TASKS_LOCATION="${CLOUD_TASKS_LOCATION:-us-central1}"
CLOUD_TASKS_QUEUE_NAME="${CLOUD_TASKS_QUEUE_NAME:-resume-generation}"
# Cloud Tasks service account for OIDC authentication (use same SA as Cloud Run by default)
CLOUD_TASKS_SERVICE_ACCOUNT="${CLOUD_TASKS_SERVICE_ACCOUNT:-${SERVICE_ACCOUNT_EMAIL}}"

# Frontend URL for CORS (update this after frontend deployment)
FRONTEND_URL="${FRONTEND_URL:-https://resume-tailor-saas.web.app}"

# Image versioning (use git commit SHA or timestamp)
IMAGE_VERSION="${IMAGE_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"

# Logging functions are loaded from common.sh

echo -e "${BLUE}🚀 Starting production backend deployment to Cloud Run${NC}\n"
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Image Version: ${IMAGE_VERSION}"
echo -e "  Frontend URL: ${FRONTEND_URL}"
echo -e "  Cloud Tasks Location: ${CLOUD_TASKS_LOCATION}"
echo -e "  Cloud Tasks Queue: ${CLOUD_TASKS_QUEUE_NAME}"
echo -e "  Cloud Tasks Service Account: ${CLOUD_TASKS_SERVICE_ACCOUNT}\n"

# Pre-deployment validation
log_step "Pre-deployment validation"

log_info "Validating prerequisites..."
if ! gcloud tasks queues describe ${CLOUD_TASKS_QUEUE_NAME} \
  --location=${CLOUD_TASKS_LOCATION} \
  --project=${PROJECT_ID} &>/dev/null; then
  log_error "Cloud Tasks queue '${CLOUD_TASKS_QUEUE_NAME}' not found in ${CLOUD_TASKS_LOCATION}"
  echo -e "${YELLOW}💡 Create it with:${NC}"
  echo -e "   gcloud tasks queues create ${CLOUD_TASKS_QUEUE_NAME} --location=${CLOUD_TASKS_LOCATION} --project=${PROJECT_ID}"
  exit 1
fi
log_success "Cloud Tasks queue validated"

if ! check_service_account "${CLOUD_TASKS_SERVICE_ACCOUNT}" "${PROJECT_ID}"; then
  log_error "Service account '${CLOUD_TASKS_SERVICE_ACCOUNT}' not found"
  echo -e "${YELLOW}💡 Create it with:${NC}"
  echo -e "   gcloud iam service-accounts create cloud-tasks-sa --display-name='Cloud Tasks Service Account' --project=${PROJECT_ID}"
  echo -e "${YELLOW}   Then set CLOUD_TASKS_SERVICE_ACCOUNT env var to the created SA email${NC}"
  exit 1
fi
log_success "Service account validated"

log_info "Validating secrets..."
if ! validate_secret FIREBASE_SERVICE_ACCOUNT_KEY "${PROJECT_ID}"; then
  log_error "Secret 'FIREBASE_SERVICE_ACCOUNT_KEY' not found"
  echo -e "${YELLOW}💡 Create it by running: ./scripts/setup-backend-secrets.sh${NC}"
  exit 1
fi
log_success "FIREBASE_SERVICE_ACCOUNT_KEY validated"

if ! validate_secret MISTRAL_API_KEY "${PROJECT_ID}"; then
  log_error "Secret 'MISTRAL_API_KEY' not found"
  echo -e "${YELLOW}💡 Create it by running:${NC}"
  echo -e "   MISTRAL_API_KEY=your-key ./scripts/setup-backend-secrets.sh"
  echo -e "${YELLOW}   Or manually: echo -n 'your-api-key' | gcloud secrets create MISTRAL_API_KEY --data-file=- --project=${PROJECT_ID}${NC}"
  exit 1
fi
log_success "MISTRAL_API_KEY validated"

if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed. Please install it first."
  exit 1
fi
log_success "Docker validated"

# Setup GCP environment
log_step "Setting up GCP environment"

run_quiet "Setting GCP project" "gcloud config set project ${PROJECT_ID} >/dev/null 2>&1"

log_info "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet >/dev/null 2>&1
gcloud services enable run.googleapis.com --quiet >/dev/null 2>&1
gcloud services enable artifactregistry.googleapis.com --quiet >/dev/null 2>&1
gcloud services enable secretmanager.googleapis.com --quiet >/dev/null 2>&1
gcloud services enable firestore.googleapis.com --quiet >/dev/null 2>&1
gcloud services enable storage-component.googleapis.com --quiet >/dev/null 2>&1
log_success "GCP APIs enabled"

if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} --location=${REGION} &> /dev/null; then
  run_quiet "Creating Artifact Registry repository" \
    "gcloud artifacts repositories create ${ARTIFACT_REGISTRY_REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --description='Docker repository for Resume Tailor SaaS backend services' \
    --quiet >/dev/null 2>&1"
else
  log_success "Artifact Registry repository exists"
fi

run_quiet "Configuring Docker authentication" \
  "gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet >/dev/null 2>&1"

# Base image path
BASE_IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"

# Build and push Docker images
log_step "Building Docker images"

IMAGE_NAME_DOCUMENTS="${BASE_IMAGE_PATH}/documents-api:${IMAGE_VERSION}"
IMAGE_NAME_DOCUMENTS_LATEST="${BASE_IMAGE_PATH}/documents-api:latest"

run_with_spinner "Building documents-api" \
  "docker build --platform linux/amd64 -f apps/documents-api/Dockerfile \
  -t ${IMAGE_NAME_DOCUMENTS} \
  -t ${IMAGE_NAME_DOCUMENTS_LATEST} \
  . \
  --quiet >/dev/null 2>&1"

run_with_spinner "Pushing documents-api to Artifact Registry" \
  "docker push ${IMAGE_NAME_DOCUMENTS} --quiet >/dev/null 2>&1 && \
   docker push ${IMAGE_NAME_DOCUMENTS_LATEST} --quiet >/dev/null 2>&1"
log_success "documents-api pushed (${IMAGE_VERSION})"

IMAGE_NAME_GENERATE="${BASE_IMAGE_PATH}/generate-api:${IMAGE_VERSION}"
IMAGE_NAME_GENERATE_LATEST="${BASE_IMAGE_PATH}/generate-api:latest"

run_with_spinner "Building generate-api" \
  "docker build --platform linux/amd64 -f apps/generate-api/Dockerfile \
  -t ${IMAGE_NAME_GENERATE} \
  -t ${IMAGE_NAME_GENERATE_LATEST} \
  . \
  --quiet >/dev/null 2>&1"

run_with_spinner "Pushing generate-api to Artifact Registry" \
  "docker push ${IMAGE_NAME_GENERATE} --quiet >/dev/null 2>&1 && \
   docker push ${IMAGE_NAME_GENERATE_LATEST} --quiet >/dev/null 2>&1"
log_success "generate-api pushed (${IMAGE_VERSION})"

# Deploy to Cloud Run
log_step "Deploying to Cloud Run"

run_with_spinner "Deploying documents-api" \
  "gcloud run deploy documents-api \
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
  --max-instances 5 \
  --min-instances 0 \
  --concurrency 100 \
  --port 8080 \
  --quiet >/dev/null 2>&1"

DOCUMENTS_API_URL=$(gcloud run services describe documents-api --region=${REGION} --format='value(status.url)' 2>/dev/null)
log_success "documents-api deployed: ${DOCUMENTS_API_URL}"

# Deploy generate-api with placeholder SERVICE_URL, then update it
run_with_spinner "Deploying generate-api" \
  "gcloud run deploy generate-api \
  --image ${IMAGE_NAME_GENERATE} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --set-env-vars CORS_ORIGIN=${FRONTEND_URL},MISTRAL_MODEL=mistral-small-latest,FIREBASE_STORAGE_BUCKET=resume-tailor-saas.firebasestorage.app,CLOUD_TASKS_SERVICE_ACCOUNT=${CLOUD_TASKS_SERVICE_ACCOUNT},CLOUD_TASKS_LOCATION=${CLOUD_TASKS_LOCATION},CLOUD_TASKS_QUEUE_NAME=${CLOUD_TASKS_QUEUE_NAME},SERVICE_URL=placeholder \
  --set-secrets FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest,MISTRAL_API_KEY=MISTRAL_API_KEY:latest \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --max-instances 5 \
  --min-instances 0 \
  --concurrency 100 \
  --port 8081 \
  --quiet >/dev/null 2>&1"

GENERATE_API_URL=$(gcloud run services describe generate-api --region=${REGION} --format='value(status.url)' 2>/dev/null)

run_quiet "Updating SERVICE_URL environment variable" \
  "gcloud run services update generate-api \
  --region=${REGION} \
  --update-env-vars SERVICE_URL=${GENERATE_API_URL} \
  --quiet >/dev/null 2>&1"

log_success "generate-api deployed: ${GENERATE_API_URL}"

# Deployment summary
echo ""
log_success "Deployment completed successfully"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Image Version: ${IMAGE_VERSION}"
echo -e "  ${GREEN}✓${NC} Documents API: ${DOCUMENTS_API_URL}"
echo -e "  ${GREEN}✓${NC} Generate API: ${GENERATE_API_URL}"
