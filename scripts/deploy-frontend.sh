#!/bin/bash

# Production-level frontend deployment to Firebase Hosting
# Builds the frontend application and deploys to Firebase Hosting
#
# Prerequisites:
# - firebase-tools installed (npm install -g firebase-tools)
# - Firebase CLI authenticated (firebase login)
# - Firebase project configured (firebase use <project-id>)

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Initialize gcloud (for Firebase CLI)
init_gcloud

# Configuration
PROJECT_ID="${PROJECT_ID:-resume-tailor-saas}"
FRONTEND_DIR="apps/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

# Logging functions are loaded from common.sh

echo -e "${BLUE}🚀 Starting frontend deployment to Firebase Hosting${NC}\n"
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Frontend Directory: ${FRONTEND_DIR}"
echo -e "  Build Output: ${DIST_DIR}\n"

# Pre-deployment validation
log_step "Pre-deployment validation"

if ! command -v firebase &> /dev/null; then
  log_error "Firebase CLI is not installed"
  echo -e "${YELLOW}💡 Install it with: npm install -g firebase-tools${NC}"
  exit 1
fi
log_success "Firebase CLI validated"

if ! command -v pnpm &> /dev/null; then
  log_error "pnpm is not installed. Please install it first."
  exit 1
fi
log_success "pnpm validated"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "${FRONTEND_DIR}" ]; then
  log_error "Must be run from project root directory"
  exit 1
fi
log_success "Project structure validated"

# Check Firebase configuration
if [ ! -f "firebase.json" ]; then
  log_error "firebase.json not found. Firebase project may not be initialized."
  exit 1
fi
log_success "Firebase configuration validated"

# Check Firebase authentication
log_info "Validating Firebase authentication..."
if ! firebase projects:list >/dev/null 2>&1; then
  log_error "Firebase CLI is not authenticated"
  echo -e "${YELLOW}💡 Run: firebase login${NC}"
  exit 1
fi
log_success "Firebase authentication validated"

# Build frontend
log_step "Building frontend application"

run_quiet "Installing dependencies" \
  "pnpm install --frozen-lockfile >/dev/null 2>&1"

run_with_spinner "Building frontend" \
  "pnpm --filter frontend build >/dev/null 2>&1"

# Check if build output exists
if [ ! -d "${DIST_DIR}" ] || [ -z "$(ls -A ${DIST_DIR} 2>/dev/null)" ]; then
  log_error "Build output directory is empty or doesn't exist: ${DIST_DIR}"
  exit 1
fi

BUILD_SIZE=$(du -sh "${DIST_DIR}" 2>/dev/null | cut -f1)
log_success "Build output size: ${BUILD_SIZE}"

# Deploy to Firebase Hosting
log_step "Deploying to Firebase Hosting"

run_with_spinner "Deploying to Firebase Hosting" \
  "firebase deploy --only hosting --project ${PROJECT_ID} --non-interactive >/dev/null 2>&1"

# Get deployment URL (Firebase Hosting default URL pattern)
DEPLOYMENT_URL="https://${PROJECT_ID}.web.app"

# Deployment summary
echo ""
log_success "Deployment completed successfully"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Project: ${PROJECT_ID}"
echo -e "  ${GREEN}✓${NC} Build Size: ${BUILD_SIZE}"
echo -e "  ${GREEN}✓${NC} Frontend URL: ${DEPLOYMENT_URL}"

