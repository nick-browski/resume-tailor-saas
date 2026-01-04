#!/bin/bash

# Setup backend secrets and service account for deployment
# This script creates the service account and sets up secrets

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Initialize gcloud
init_gcloud

# Configuration
PROJECT_ID="${PROJECT_ID:-resume-tailor-saas}"
SERVICE_ACCOUNT_NAME="resume-tailor-saas"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors are loaded from common.sh

echo -e "${BLUE}🔧 Setting up backend secrets and service account...${NC}\n"

# Set project
gcloud config set project ${PROJECT_ID}

# Enable Secret Manager API
echo -e "${BLUE}🔧 Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --quiet

# Create Service Account if it doesn't exist
echo -e "${BLUE}👤 Checking Service Account...${NC}"
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} &> /dev/null; then
  echo -e "${YELLOW}Creating Service Account...${NC}"
  gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="Resume Tailor SaaS Service Account" \
    --description="Service account for backend services" \
    --quiet
  echo -e "${GREEN}✓ Service Account created${NC}"
else
  echo -e "${GREEN}✓ Service Account already exists${NC}"
fi

# Grant necessary roles
echo -e "${BLUE}🔐 Granting roles to Service Account...${NC}"

# Wait for service account to be fully created (with retry)
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
  echo -e "${YELLOW}Waiting for service account to be ready...${NC}"
  for i in {1..10}; do
    if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
      break
    fi
    sleep 1
  done
fi

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/datastore.user" \
  --quiet

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/storage.admin" \
  --quiet

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

echo -e "${GREEN}✓ Roles granted${NC}"

# Create Service Account Key and Secret
echo -e "\n${BLUE}🔑 Creating Service Account Key...${NC}"
KEY_FILE="service-account-key-$(date +%s).json"
gcloud iam service-accounts keys create ${KEY_FILE} \
  --iam-account=${SERVICE_ACCOUNT_EMAIL} \
  --quiet

# Create or update FIREBASE_SERVICE_ACCOUNT_KEY secret
echo -e "${BLUE}🔐 Creating FIREBASE_SERVICE_ACCOUNT_KEY secret...${NC}"
if gcloud secrets describe FIREBASE_SERVICE_ACCOUNT_KEY &> /dev/null; then
  echo -e "${YELLOW}Secret already exists. Updating...${NC}"
  gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT_KEY \
    --data-file=${KEY_FILE} \
    --quiet
else
  gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY \
    --data-file=${KEY_FILE} \
    --quiet
fi

# Remove local key file for security
rm ${KEY_FILE}
echo -e "${GREEN}✓ FIREBASE_SERVICE_ACCOUNT_KEY secret created/updated${NC}"

# Check if MISTRAL_API_KEY secret exists
echo -e "\n${BLUE}🔐 Checking MISTRAL_API_KEY secret...${NC}"
if ! validate_secret MISTRAL_API_KEY "${PROJECT_ID}"; then
  echo -e "${YELLOW}⚠️  MISTRAL_API_KEY secret does not exist.${NC}"
  
  # If MISTRAL_API_KEY is provided as environment variable, create the secret
  if [ -n "$MISTRAL_API_KEY" ]; then
    echo -e "${BLUE}Creating MISTRAL_API_KEY secret from environment variable...${NC}"
    echo -n "${MISTRAL_API_KEY}" | gcloud secrets create MISTRAL_API_KEY \
      --data-file=- \
      --project=${PROJECT_ID} \
      --quiet
    echo -e "${GREEN}✓ MISTRAL_API_KEY secret created${NC}"
  else
    echo -e "${YELLOW}Please create it manually:${NC}"
    echo -e "  1. Get your API key from https://console.mistral.ai/api-keys"
    echo -e "  2. Run: echo -n 'your-api-key' | gcloud secrets create MISTRAL_API_KEY --data-file=- --project=${PROJECT_ID}"
    echo -e "${YELLOW}Or set MISTRAL_API_KEY environment variable and re-run this script${NC}"
  fi
else
  # If secret exists but MISTRAL_API_KEY env var is provided, update it
  if [ -n "$MISTRAL_API_KEY" ]; then
    echo -e "${BLUE}Updating MISTRAL_API_KEY secret from environment variable...${NC}"
    echo -n "${MISTRAL_API_KEY}" | gcloud secrets versions add MISTRAL_API_KEY \
      --data-file=- \
      --project=${PROJECT_ID} \
      --quiet
    echo -e "${GREEN}✓ MISTRAL_API_KEY secret updated${NC}"
  else
    echo -e "${GREEN}✓ MISTRAL_API_KEY secret already exists${NC}"
  fi
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}\n"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Service Account: ${SERVICE_ACCOUNT_EMAIL}"
echo -e "  FIREBASE_SERVICE_ACCOUNT_KEY: ✓ Created"
if validate_secret MISTRAL_API_KEY "${PROJECT_ID}"; then
  echo -e "  MISTRAL_API_KEY: ✓ Exists"
else
  echo -e "  MISTRAL_API_KEY: ⚠️  Needs to be created"
fi
