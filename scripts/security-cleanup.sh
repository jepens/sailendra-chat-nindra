#!/bin/bash

echo "🔒 Security Cleanup Script for Sailendra Chat Nexus"
echo "=================================================="

# Check for common credential patterns
echo "🔍 Scanning for potential credential leaks..."

# Check for JWT tokens
echo "Checking for JWT tokens..."
if grep -r "eyJ[A-Za-z0-9_-]\+\.[A-Za-z0-9_-]\+\.[A-Za-z0-9_-]\+" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.lock; then
    echo "❌ Found potential JWT tokens!"
else
    echo "✅ No JWT tokens found"
fi

# Check for API keys
echo "Checking for API keys..."
if grep -r "sk-[A-Za-z0-9]\+" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.lock; then
    echo "❌ Found potential OpenAI API keys!"
else
    echo "✅ No OpenAI API keys found"
fi

# Check for Google API keys
echo "Checking for Google API keys..."
if grep -r "AIza[A-Za-z0-9_-]\+" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.lock; then
    echo "❌ Found potential Google API keys!"
else
    echo "✅ No Google API keys found"
fi

# Check for .env files
echo "Checking for .env files..."
if find . -name ".env*" -not -path "./node_modules/*" -not -path "./.git/*"; then
    echo "❌ Found .env files that should be removed!"
else
    echo "✅ No .env files found"
fi

# Check git history for credentials
echo "Checking git history for credentials..."
if git log --all --full-history --grep="eyJ" --grep="sk-" --grep="AIza" --grep="api_key" --grep="API_KEY"; then
    echo "❌ Found potential credentials in git history!"
else
    echo "✅ No credentials found in git history"
fi

echo ""
echo "🔒 Security scan completed!"
echo "Remember to:"
echo "1. Never commit .env files"
echo "2. Use environment variables for all secrets"
echo "3. Regularly rotate your API keys"
echo "4. Use .gitignore to exclude sensitive files" 