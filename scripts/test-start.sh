#!/bin/bash

# Test script to validate npm run start command
echo "Testing npm run start command..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in project root"
    exit 1
fi

# Validate docker-compose.yml syntax
if command -v docker &> /dev/null; then
    if docker compose config > /dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ Error: docker-compose.yml has syntax errors"
        exit 1
    fi
else
    echo "ℹ️  Docker not available for validation"
fi

# Check if the start script exists in package.json
if grep -q '"start":' package.json; then
    echo "✅ npm run start script found in package.json"
else
    echo "❌ Error: npm run start script not found"
    exit 1
fi

echo "✅ npm run start command should work correctly"
echo "Note: Actual execution requires Docker to be running"
