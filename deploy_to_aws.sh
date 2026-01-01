#!/bin/bash

# Deploy 2026.tiltti.net to AWS
# Usage: ./deploy_to_aws.sh [stage]
# Stages: dev (default), production

set -e

cd "$(dirname "$0")"

STAGE="${1:-dev}"

echo ""
echo "  Deploying 2026.tiltti.net to AWS"
echo "  ================================="
echo "  Stage: $STAGE"
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "ERROR: AWS credentials not configured"
    echo ""
    echo "Run: aws configure"
    echo "Or set AWS_PROFILE: export AWS_PROFILE=personal"
    exit 1
fi

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ALLOWED_ACCOUNT="186571811376"

if [ "$ACCOUNT" != "$ALLOWED_ACCOUNT" ]; then
    echo "ERROR: Wrong AWS account!"
    echo "  Current:  $ACCOUNT"
    echo "  Expected: $ALLOWED_ACCOUNT"
    echo ""
    echo "Switch account with: export AWS_PROFILE=personal"
    exit 1
fi

echo "AWS Account: $ACCOUNT ✓"
echo ""

# Check if SST is installed
if ! command -v sst &> /dev/null; then
    echo "Installing SST..."
    curl -fsSL https://ion.sst.dev/install | bash
    export PATH="$HOME/.sst/bin:$PATH"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Load secrets from .env.production.local
if [ "$STAGE" = "production" ]; then
    if [ -f ".env.production.local" ]; then
        echo "Loading secrets from .env.production.local..."
        set -a
        source .env.production.local
        set +a
    fi

    echo ""
    echo "Checking production secrets..."

    if [ -z "$SESSION_SECRET" ]; then
        echo "ERROR: SESSION_SECRET not set!"
        echo "Create .env.production.local with:"
        echo '  SESSION_SECRET="$(openssl rand -base64 32)"'
        exit 1
    else
        echo "  SESSION_SECRET: ✓"
    fi

    if [ -z "$ADMIN_PASSWORD" ]; then
        echo "ERROR: ADMIN_PASSWORD not set!"
        exit 1
    else
        echo "  ADMIN_PASSWORD: ✓"
    fi
fi

echo ""
echo "Building and deploying..."
echo ""

# Deploy with SST
if [ "$STAGE" = "production" ]; then
    npx sst deploy --stage production
else
    npx sst dev
fi

echo ""
echo "Done!"
echo ""
