#!/bin/bash

# Intersight MCP Server Setup Script for VS Code

set -e

echo "�� Setting up Intersight MCP Server..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS: Configure VS Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Get your Intersight API credentials:"
echo "   • API Key ID: from your Intersight account"
echo "   • Secret Key: download RSA private key (PEM format)"
echo ""
echo "2. Open VS Code User Settings JSON:"
echo "   Press Cmd+Shift+P → 'Preferences: Open User Settings (JSON)'"
echo ""
echo "3. Copy configuration from vscode-settings.json and update paths:"
echo "   • Replace /path/to/intersight-mcp-server with your project path"
echo "   • Replace your-api-key-id with your actual API Key ID"
echo "   • Replace /path/to/SecretKey.txt with your secret key path"
echo ""
echo "4. Reload VS Code window:"
echo "   Press Cmd+Shift+P → 'Developer: Reload Window'"
echo ""
echo "5. Test in Copilot Chat:"
echo "   Say: 'List all my Intersight compute servers'"
echo ""
