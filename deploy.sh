#!/bin/bash
# Deploy script for e-Nihil Home Server
# Usage: bash deploy.sh

set -e

cd /opt/e-nihil

echo "📥 Pulling latest..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "🚀 Restarting app..."
pm2 restart e-nihil

echo "✅ Deploy complete!"
pm2 status
