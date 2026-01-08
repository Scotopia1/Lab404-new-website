#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps set up environment variables for each app

echo "======================================"
echo "Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to set environment variable
set_env() {
    local app=$1
    local key=$2
    local value=$3
    local env_type=$4

    echo -e "${YELLOW}Setting ${key} for ${app}...${NC}"

    if [ -z "$value" ]; then
        echo -e "${RED}❌ Skipped (empty value)${NC}"
        return
    fi

    cd "apps/${app}"
    vercel env add "$key" "$env_type" <<EOF
$value
EOF
    cd ../..
    echo -e "${GREEN}✓ Done${NC}"
}

echo "This script will set up environment variables for:"
echo "1. API (api.lab404electronics.com)"
echo "2. Website (lab404electronics.com)"
echo "3. Admin (admin.lab404electronics.com)"
echo ""
echo "⚠️  Make sure you're logged in to Vercel CLI first!"
echo "    Run: vercel login"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "======================================"
echo "Setting up API environment variables"
echo "======================================"
echo ""

# Read from .env file
if [ -f .env ]; then
    source .env

    # API Environment Variables
    cd apps/api

    echo "Setting critical SMTP variables..."
    vercel env add SMTP_FROM_EMAIL production <<EOF
${SMTP_FROM_EMAIL}
EOF

    vercel env add SMTP_FROM_NAME production <<EOF
${SMTP_FROM_NAME}
EOF

    echo ""
    echo -e "${GREEN}✅ SMTP variables set!${NC}"
    echo ""
    echo "To set all other variables, use the dashboard or run the individual commands."

    cd ../..
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please make sure .env exists in the root directory"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Verify variables in Vercel Dashboard"
echo "2. Redeploy your applications"
echo ""
