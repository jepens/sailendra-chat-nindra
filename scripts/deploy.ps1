# Production Deployment Script for Nindra Chatbot System (Windows)
# This script builds and deploys the application using Docker

param(
    [switch]$SkipValidation,
    [switch]$NoBuild
)

# Error handling
$ErrorActionPreference = "Stop"

Write-Host "Starting production deployment..." -ForegroundColor Blue

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your production environment variables." -ForegroundColor Yellow
    Write-Host "You can use env.example as a template." -ForegroundColor Yellow
    exit 1
}

if (-not $SkipValidation) {
    # Validate required environment variables
    Write-Host "Validating environment variables..." -ForegroundColor Yellow
    $requiredVars = @(
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY", 
        "VITE_OPENAI_API_KEY"
    )

    $envContent = Get-Content ".env"
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if (-not $found) {
            Write-Host "Error: $var is not set in .env file" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "Environment variables validated" -ForegroundColor Green
}

# Check if Docker is available
try {
    docker --version | Out-Null
    Write-Host "Docker is available" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not installed or not running" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null  
    Write-Host "Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

if (-not $NoBuild) {
    # Build the Docker image
    Write-Host "Building Docker image..." -ForegroundColor Blue
    try {
        docker-compose build --no-cache
        Write-Host "Docker image built successfully" -ForegroundColor Green
    } catch {
        Write-Host "Docker build failed" -ForegroundColor Red
        exit 1
    }
}

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start the application
Write-Host "Starting the application..." -ForegroundColor Blue
docker-compose up -d

# Wait for the application to be ready
Write-Host "Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Health check
Write-Host "Performing health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "Application is healthy and running!" -ForegroundColor Green
        Write-Host "Application is available at: http://localhost:8080" -ForegroundColor Cyan
    } else {
        throw "Health check returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "Health check failed!" -ForegroundColor Red
    Write-Host "Checking container logs..." -ForegroundColor Yellow
    docker-compose logs --tail=50
    exit 1
}

# Show running containers
Write-Host "Container status:" -ForegroundColor Blue
docker-compose ps

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "  - Stop application: docker-compose down" -ForegroundColor White  
Write-Host "  - Restart application: docker-compose restart" -ForegroundColor White
Write-Host "  - View container status: docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "Quick links:" -ForegroundColor Cyan
Write-Host "  - Application: http://localhost:8080" -ForegroundColor White
Write-Host "  - Health check: http://localhost:8080/health" -ForegroundColor White 