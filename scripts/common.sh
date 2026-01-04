#!/bin/bash

# Common utilities for deployment scripts

# Set gcloud Python path if not set
setup_gcloud_python() {
  if [ -z "$CLOUDSDK_PYTHON" ]; then
    # Try to find Python 3 in common locations
    if [ -f "/opt/homebrew/opt/python@3.13/bin/python3" ]; then
      export CLOUDSDK_PYTHON=/opt/homebrew/opt/python@3.13/bin/python3
    elif command -v python3 &> /dev/null; then
      export CLOUDSDK_PYTHON=$(command -v python3)
    fi
  fi
}

# Add gcloud to PATH if not present
setup_gcloud_path() {
  if ! command -v gcloud &> /dev/null; then
    # Try common installation paths
    if [ -d "/opt/homebrew/share/google-cloud-sdk/bin" ]; then
      export PATH=/opt/homebrew/share/google-cloud-sdk/bin:$PATH
    elif [ -d "$HOME/google-cloud-sdk/bin" ]; then
      export PATH=$HOME/google-cloud-sdk/bin:$PATH
    fi
  fi
}

# Initialize gcloud environment
init_gcloud() {
  setup_gcloud_python
  setup_gcloud_path
  
  if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}" >&2
    echo "Visit: https://cloud.google.com/sdk/docs/install" >&2
    exit 1
  fi
}

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Common configuration
PROJECT_ID="${PROJECT_ID:-resume-tailor-saas}"
REGION="${REGION:-us-central1}"

# Validate secret exists
# Returns 0 if secret exists, 1 otherwise
validate_secret() {
  local secret_name=$1
  local project_id=${2:-$PROJECT_ID}
  
  gcloud secrets describe "${secret_name}" --project="${project_id}" &>/dev/null
}

# Check if service account exists
# Returns 0 if service account exists, 1 otherwise
check_service_account() {
  local service_account_email=$1
  local project_id=${2:-$PROJECT_ID}
  
  gcloud iam service-accounts describe "${service_account_email}" --project="${project_id}" &>/dev/null
}

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}" >&2
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_step() {
  echo -e "\n${BLUE}▶ $1${NC}"
}

# Execute command with progress indicator (for quick operations)
run_quiet() {
  local description=$1
  shift
  local cmd="$@"
  
  echo -n -e "${BLUE}⏳ ${description}...${NC} "
  
  local output
  output=$(eval "$cmd" 2>&1)
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "\r${GREEN}✓${NC} ${description}"
  else
    echo -e "\r${RED}✗${NC} ${description}"
    if [ -n "$output" ]; then
      echo -e "${RED}Error output:${NC}" >&2
      echo "$output" | sed 's/^/  /' >&2
    fi
    return $exit_code
  fi
}

# Execute command with spinner (for long-running operations)
run_with_spinner() {
  local description=$1
  shift
  local cmd="$@"
  
  # Spinner characters (Unicode box-drawing characters)
  local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  
  # Create temp file for error output
  local error_file=$(mktemp)
  
  # Start command in background, capture stderr
  eval "$cmd" >/dev/null 2>"$error_file" &
  local pid=$!
  
  # Show spinner on the same line (using \r to overwrite)
  while kill -0 $pid 2>/dev/null; do
    i=$(((i + 1) % 10))
    printf "\r${BLUE}${spin:$i:1}${NC} ${description}..."
    sleep 0.1
  done
  
  # Wait for command to finish and get exit code
  wait $pid
  local exit_code=$?
  
  # Overwrite with final result
  if [ $exit_code -eq 0 ]; then
    # Clear the line and show success (add spaces to clear any leftover characters)
    printf "\r${GREEN}✓${NC} ${description}                    \n"
  else
    printf "\r${RED}✗${NC} ${description}                    \n"
    # Show error output if available
    if [ -s "$error_file" ]; then
      echo -e "${RED}Error output:${NC}" >&2
      cat "$error_file" | sed 's/^/  /' >&2
    fi
    rm -f "$error_file"
    return $exit_code
  fi
  
  rm -f "$error_file"
}
