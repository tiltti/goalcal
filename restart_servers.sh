#!/bin/bash

# 2026.tiltti.net - Restart all servers
# Usage: ./restart_servers.sh

cd "$(dirname "$0")"

echo ""
echo "  2026 - Tavoitekalenteri"
echo "  ========================"
echo ""

# Kill any existing Next.js dev server on port 3000
echo "Stopping existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Check if node_modules needs update
NEED_INSTALL=false
if [ ! -d "node_modules" ]; then
    NEED_INSTALL=true
elif [ "package.json" -nt "node_modules" ]; then
    NEED_INSTALL=true
elif [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules" ]; then
    NEED_INSTALL=true
fi

if [ "$NEED_INSTALL" = true ]; then
    echo "Installing/updating dependencies..."
    npm install
    touch node_modules  # Update timestamp
else
    echo "Dependencies up to date"
fi

# Check if Docker is available and running
DOCKER_OK=false
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        DOCKER_OK=true
    else
        echo "Docker not running, starting..."
        open -a Docker 2>/dev/null || true
        sleep 5
        if docker info &> /dev/null; then
            DOCKER_OK=true
        fi
    fi
fi

if [ "$DOCKER_OK" = true ]; then
    echo "Restarting DynamoDB Local..."

    # Stop and remove existing container
    docker stop dynamodb-local 2>/dev/null || true
    docker rm dynamodb-local 2>/dev/null || true

    # Start fresh container
    docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest

    # Wait for DynamoDB to be ready
    echo "Waiting for DynamoDB..."
    for i in {1..10}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Create table if it doesn't exist (use fake credentials for local)
    export AWS_ACCESS_KEY_ID=local
    export AWS_SECRET_ACCESS_KEY=local

    aws dynamodb create-table \
        --table-name goalcal \
        --attribute-definitions \
            AttributeName=calendarId,AttributeType=S \
            AttributeName=entryType,AttributeType=S \
        --key-schema \
            AttributeName=calendarId,KeyType=HASH \
            AttributeName=entryType,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region eu-north-1 2>/dev/null && echo "Table created" || echo "Table exists"

    echo "DynamoDB: http://localhost:8000"
else
    echo ""
    echo "WARNING: Docker not available"
    echo "         DynamoDB Local not started"
    echo ""
fi

echo ""
echo "Starting Next.js..."
echo ""
echo "  App:    http://localhost:3000"
echo "  Admin:  http://localhost:3000/admin (pw: admin123)"
echo ""

# Start Next.js dev server
npm run dev
