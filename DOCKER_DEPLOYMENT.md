# Docker Deployment Guide

Panduan lengkap untuk deploy aplikasi Nindra Chatbot System menggunakan Docker.

## Prerequisites

Pastikan Anda telah menginstall:
- Docker Desktop (untuk Windows/Mac) atau Docker Engine (untuk Linux)
- Docker Compose
- Git

## Quick Start

### 1. Persiapan Environment

1. **Copy file environment variables:**
   ```bash
   cp env.example .env
   ```

2. **Edit file .env dengan nilai production Anda:**
   ```bash
   # Supabase Configuration
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   
   # Google Calendar Integration
   VITE_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
   VITE_GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
   
   # OpenAI API Configuration
   VITE_OPENAI_API_KEY=your_openai_api_key
   
   # App Configuration
   VITE_APP_NAME="Nindra Chatbot System"
   VITE_APP_VERSION="1.0.0"
   VITE_DEBUG_CALENDAR=false
   
   # Environment
   NODE_ENV=production
   ```

### 2. Deploy dengan Script (Recommended)

**Windows PowerShell:**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
./scripts/deploy.sh
```

### 3. Deploy Manual

Jika Anda ingin melakukan deploy manual:

```bash
# Build image
docker-compose build --no-cache

# Stop existing containers
docker-compose down

# Start aplikasi
docker-compose up -d

# Check status
docker-compose ps
```

## Konfigurasi

### Environment Variables

Aplikasi ini menggunakan environment variables dengan prefix `VITE_` karena menggunakan Vite sebagai build tool. Berikut adalah variabel yang diperlukan:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | URL Supabase project | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_OPENAI_API_KEY` | OpenAI API key | ✅ |
| `VITE_GOOGLE_CALENDAR_API_KEY` | Google Calendar API key | ❌ |
| `VITE_GOOGLE_CALENDAR_CLIENT_ID` | Google Calendar Client ID | ❌ |
| `VITE_GOOGLE_CALENDAR_CLIENT_SECRET` | Google Calendar Client Secret | ❌ |
| `VITE_DEBUG_CALENDAR` | Debug mode untuk calendar | ❌ |
| `VITE_APP_NAME` | Nama aplikasi | ❌ |
| `VITE_APP_VERSION` | Versi aplikasi | ❌ |

### Port Configuration

- **Application Port**: 8080
- **Internal Nginx Port**: 8080
- **External Port**: 8080

Aplikasi akan tersedia di: `http://localhost:8080`

## Monitoring dan Maintenance

### Health Check

Aplikasi menyediakan endpoint health check di:
```
http://localhost:8080/health
```

### Container Management

```bash
# Melihat status container
docker-compose ps

# Melihat logs
docker-compose logs -f

# Restart aplikasi
docker-compose restart

# Stop aplikasi
docker-compose down

# Update aplikasi (rebuild dan restart)
docker-compose build --no-cache && docker-compose up -d
```

### Resource Monitoring

```bash
# Melihat resource usage
docker stats

# Melihat disk usage
docker system df

# Cleanup unused resources
docker system prune -f
```

## Security Features

### Container Security
- Non-root user execution
- Read-only filesystem
- Security headers di Nginx
- Minimized attack surface

### Nginx Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy dengan whitelist domain

## Performance Optimization

### Nginx Configuration
- Gzip compression untuk static assets  
- Browser caching untuk static files
- Optimized chunk splitting
- Pre-compressed files support

### Docker Optimization
- Multi-stage build untuk ukuran image minimal
- Layer caching optimization
- Resource limits untuk production

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 8080
   netstat -tulpn | grep 8080
   
   # Kill process using the port
   sudo kill -9 <PID>
   ```

2. **Environment variables not loaded**
   - Pastikan file `.env` ada dan memiliki format yang benar
   - Restart container setelah mengubah environment variables

3. **Build failures**
   ```bash
   # Clear Docker cache
   docker system prune -f
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Container won't start**
   ```bash
   # Check container logs
   docker-compose logs

   # Check container status
   docker-compose ps -a
   ```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Logs dari service tertentu
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100
```

## Production Considerations

### SSL/HTTPS Setup
Untuk production, Anda perlu setup SSL certificate. Anda bisa menggunakan:
- Let's Encrypt dengan Certbot
- Cloudflare SSL
- Load balancer dengan SSL termination

### Reverse Proxy
Untuk production yang lebih robust, pertimbangkan menggunakan:
- Nginx sebagai reverse proxy
- Traefik untuk auto SSL
- HAProxy untuk load balancing

### Backup Strategy
- Backup environment variables
- Backup Supabase database
- Monitor aplikasi dengan tools seperti Prometheus/Grafana

### Scaling
- Gunakan Docker Swarm atau Kubernetes untuk horizontal scaling
- Setup load balancer untuk multiple instances
- Monitor resource usage dan scale sesuai kebutuhan

## Commands Cheatsheet

```bash
# Build dan start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop semua
docker-compose down

# Restart service
docker-compose restart app

# Shell ke container
docker-compose exec app sh

# Health check manual
curl http://localhost:8080/health

# Resource monitoring
docker stats $(docker-compose ps -q)

# Cleanup
docker system prune -f
docker-compose down --volumes --remove-orphans
``` 