# 🔒 Security Guidelines for Sailendra Chat Nexus

## Overview
This document outlines security best practices and procedures to prevent credential leaks and maintain the security of the Sailendra Chat Nexus application.

## 🚨 Critical Security Issues Fixed

### 1. Hardcoded Credentials Removed
- **Issue**: Supabase URL and API key were hardcoded in `src/integrations/supabase/client.ts`
- **Fix**: Removed hardcoded values and implemented proper environment variable validation
- **Status**: ✅ RESOLVED

### 2. Environment File Management
- **Issue**: `.env` files containing sensitive data were potentially exposed
- **Fix**: Ensured `.env` files are properly ignored by git and removed from repository
- **Status**: ✅ RESOLVED

## 🔐 Environment Variables

### Required Environment Variables
All sensitive configuration must be stored in environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Calendar Integration
VITE_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key_here
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret_here

# OpenAI API Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Environment File Setup
1. Copy `env.example` to `.env`
2. Fill in your actual values
3. **NEVER commit `.env` files to git**

## 🛡️ Security Best Practices

### 1. Never Hardcode Credentials
❌ **WRONG**:
```typescript
const apiKey = "sk-1234567890abcdef";
const supabaseUrl = "https://example.supabase.co";
```

✅ **CORRECT**:
```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!apiKey || !supabaseUrl) {
  throw new Error('Missing required environment variables');
}
```

### 2. Environment Variable Validation
Always validate that required environment variables are present:

```typescript
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}
```

### 3. Git Ignore Configuration
Ensure these files are in `.gitignore`:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.pem
*.key
```

## 🔍 Security Scanning

### Automated Security Checks
Use the provided security cleanup scripts:

**Windows (PowerShell)**:
```powershell
.\scripts\security-cleanup.ps1
```

**Linux/Mac (Bash)**:
```bash
./scripts/security-cleanup.sh
```

### Manual Security Checks
Regularly scan for:
- JWT tokens: `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`
- OpenAI API keys: `sk-[A-Za-z0-9]+`
- Google API keys: `AIza[A-Za-z0-9_-]+`
- Other API keys and secrets

## 🚨 Incident Response

### If Credentials Are Exposed
1. **IMMEDIATELY** rotate all exposed credentials
2. Remove credentials from git history if necessary
3. Update environment variables
4. Notify team members
5. Document the incident

### Git History Cleanup
If credentials were committed to git history:

```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

## 📋 Security Checklist

Before committing code:
- [ ] No hardcoded credentials
- [ ] All secrets use environment variables
- [ ] `.env` files are not tracked by git
- [ ] Security scan passes
- [ ] No sensitive data in commit messages

Before deployment:
- [ ] Environment variables are properly set
- [ ] Production credentials are secure
- [ ] Security headers are configured
- [ ] HTTPS is enabled

## 🔄 Regular Security Maintenance

### Monthly Tasks
- [ ] Rotate API keys
- [ ] Review access permissions
- [ ] Update dependencies
- [ ] Run security scans
- [ ] Review git history for potential leaks

### Quarterly Tasks
- [ ] Security audit
- [ ] Update security documentation
- [ ] Review and update security scripts
- [ ] Team security training

## 📞 Security Contacts

For security issues or questions:
- Repository maintainer: [Your Name]
- Security team: [Security Team Contact]

## 📚 Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing sensitive information. 