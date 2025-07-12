#!/bin/bash

# Build script for Business Text Panel

echo "🏗️  Building Business Text Panel..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if backend exists
if [ -d "backend" ]; then
    echo "🔧 Building backend..."
    npm run build:backend
fi

echo "✅ Build complete!"
echo "🎯 Frontend built to: dist/"
echo "🔧 Backend built to: dist/"
