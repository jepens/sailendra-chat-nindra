# Security Cleanup Script for Sailendra Chat Nexus
Write-Host "🔒 Security Cleanup Script for Sailendra Chat Nexus" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check for common credential patterns
Write-Host "🔍 Scanning for potential credential leaks..." -ForegroundColor Yellow

# Check for JWT tokens
Write-Host "Checking for JWT tokens..." -ForegroundColor Cyan
$jwtPattern = "eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
$jwtFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" -and $_.Name -notlike "*.lock" } | Select-String -Pattern $jwtPattern -List
if ($jwtFiles) {
    Write-Host "❌ Found potential JWT tokens!" -ForegroundColor Red
    $jwtFiles | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "✅ No JWT tokens found" -ForegroundColor Green
}

# Check for API keys
Write-Host "Checking for API keys..." -ForegroundColor Cyan
$apiKeyPattern = "sk-[A-Za-z0-9]+"
$apiKeyFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" -and $_.Name -notlike "*.lock" } | Select-String -Pattern $apiKeyPattern -List
if ($apiKeyFiles) {
    Write-Host "❌ Found potential OpenAI API keys!" -ForegroundColor Red
    $apiKeyFiles | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "✅ No OpenAI API keys found" -ForegroundColor Green
}

# Check for Google API keys
Write-Host "Checking for Google API keys..." -ForegroundColor Cyan
$googleKeyPattern = "AIza[A-Za-z0-9_-]+"
$googleKeyFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" -and $_.Name -notlike "*.lock" } | Select-String -Pattern $googleKeyPattern -List
if ($googleKeyFiles) {
    Write-Host "❌ Found potential Google API keys!" -ForegroundColor Red
    $googleKeyFiles | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "✅ No Google API keys found" -ForegroundColor Green
}

# Check for Airtable API keys
Write-Host "Checking for Airtable API keys..." -ForegroundColor Cyan
$airtableKeyPattern = "pat[A-Za-z0-9_-]+"
$airtableKeyFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" -and $_.Name -notlike "*.lock" } | Select-String -Pattern $airtableKeyPattern -List
if ($airtableKeyFiles) {
    Write-Host "❌ Found potential Airtable API keys!" -ForegroundColor Red
    $airtableKeyFiles | ForEach-Object { Write-Host "  - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "✅ No Airtable API keys found" -ForegroundColor Green
}

# Check for .env files
Write-Host "Checking for .env files..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Recurse -Name ".env*" | Where-Object { $_ -notlike "*node_modules*" -and $_ -notlike "*.git*" }
if ($envFiles) {
    Write-Host "❌ Found .env files that should be removed!" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No .env files found" -ForegroundColor Green
}

# Check git history for credentials
Write-Host "Checking git history for credentials..." -ForegroundColor Cyan
$gitHistory = git log --all --full-history --grep="eyJ" --grep="sk-" --grep="AIza" --grep="pat" --grep="api_key" --grep="API_KEY" 2>$null
if ($gitHistory) {
    Write-Host "❌ Found potential credentials in git history!" -ForegroundColor Red
} else {
    Write-Host "✅ No credentials found in git history" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔒 Security scan completed!" -ForegroundColor Green
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "1. Never commit .env files" -ForegroundColor White
Write-Host "2. Use environment variables for all secrets" -ForegroundColor White
Write-Host "3. Regularly rotate your API keys" -ForegroundColor White
Write-Host "4. Use .gitignore to exclude sensitive files" -ForegroundColor White 