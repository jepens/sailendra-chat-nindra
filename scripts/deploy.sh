#!/bin/bash

# Production Deployment Script for Nindra Chatbot System
# This script builds and deploys the application using Docker

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your production environment variables."
    echo "You can use env.example as a template."
    exit 1
fi

# Validate required environment variables
echo "📋 Validating environment variables..."
required_vars=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo "❌ Error: ${var} is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build the Docker image
echo "🏗️  Building Docker image..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start the application
echo "🚀 Starting the application..."
docker-compose up -d

# Wait for the application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo "🌐 Application is available at: http://localhost:8080"
else
    echo "❌ Health check failed!"
    echo "Checking container logs..."
    docker-compose logs --tail=50
    exit 1
fi

# Show running containers
echo "📊 Container status:"
docker-compose ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop application: docker-compose down"
echo "  - Restart application: docker-compose restart"
echo "  - View container status: docker-compose ps" 