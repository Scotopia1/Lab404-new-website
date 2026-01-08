# Vercel Environment Variables Setup Script (PowerShell)
# This script helps set up environment variables for each app

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will set up CRITICAL environment variables for:" -ForegroundColor Yellow
Write-Host "1. API (api.lab404electronics.com)" -ForegroundColor Yellow
Write-Host "2. Website (lab404electronics.com)" -ForegroundColor Yellow
Write-Host "3. Admin (admin.lab404electronics.com)" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Make sure you're logged in to Vercel CLI first!" -ForegroundColor Red
Write-Host "    Run: vercel login" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# Load .env file
if (Test-Path ".env") {
    Write-Host ""
    Write-Host "Loading .env file..." -ForegroundColor Green

    $envVars = @{}
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Setting up API environment variables" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    # Change to API directory
    Push-Location apps/api

    # Set SMTP variables (most critical)
    Write-Host "Setting SMTP_FROM_EMAIL..." -ForegroundColor Yellow
    if ($envVars['SMTP_FROM_EMAIL']) {
        $envVars['SMTP_FROM_EMAIL'] | vercel env add SMTP_FROM_EMAIL production
        Write-Host "✓ SMTP_FROM_EMAIL set" -ForegroundColor Green
    }

    Write-Host "Setting SMTP_FROM_NAME..." -ForegroundColor Yellow
    if ($envVars['SMTP_FROM_NAME']) {
        $envVars['SMTP_FROM_NAME'] | vercel env add SMTP_FROM_NAME production
        Write-Host "✓ SMTP_FROM_NAME set" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Setting other critical API variables..." -ForegroundColor Yellow

    # Database
    if ($envVars['DATABASE_URL']) {
        Write-Host "Setting DATABASE_URL..." -ForegroundColor Yellow
        $envVars['DATABASE_URL'] | vercel env add DATABASE_URL production
        Write-Host "✓ DATABASE_URL set" -ForegroundColor Green
    }

    # JWT
    if ($envVars['JWT_SECRET']) {
        Write-Host "Setting JWT_SECRET..." -ForegroundColor Yellow
        $envVars['JWT_SECRET'] | vercel env add JWT_SECRET production
        Write-Host "✓ JWT_SECRET set" -ForegroundColor Green
    }

    # CORS
    Write-Host "Setting CORS_ORIGINS..." -ForegroundColor Yellow
    "https://lab404electronics.com,https://admin.lab404electronics.com" | vercel env add CORS_ORIGINS production
    Write-Host "✓ CORS_ORIGINS set" -ForegroundColor Green

    # URLs
    Write-Host "Setting API_URL..." -ForegroundColor Yellow
    "https://api.lab404electronics.com" | vercel env add API_URL production
    Write-Host "✓ API_URL set" -ForegroundColor Green

    Write-Host "Setting WEB_URL..." -ForegroundColor Yellow
    "https://lab404electronics.com" | vercel env add WEB_URL production
    Write-Host "✓ WEB_URL set" -ForegroundColor Green

    Write-Host "Setting ADMIN_URL..." -ForegroundColor Yellow
    "https://admin.lab404electronics.com" | vercel env add ADMIN_URL production
    Write-Host "✓ ADMIN_URL set" -ForegroundColor Green

    # Environment
    Write-Host "Setting NODE_ENV..." -ForegroundColor Yellow
    "production" | vercel env add NODE_ENV production
    Write-Host "✓ NODE_ENV set" -ForegroundColor Green

    Pop-Location

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Setting up Website environment variables" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    Push-Location apps/lab404-website

    Write-Host "Setting NEXT_PUBLIC_API_URL..." -ForegroundColor Yellow
    "https://api.lab404electronics.com/api" | vercel env add NEXT_PUBLIC_API_URL production
    Write-Host "✓ NEXT_PUBLIC_API_URL set" -ForegroundColor Green

    Write-Host "Setting NEXT_PUBLIC_SITE_URL..." -ForegroundColor Yellow
    "https://lab404electronics.com" | vercel env add NEXT_PUBLIC_SITE_URL production
    Write-Host "✓ NEXT_PUBLIC_SITE_URL set" -ForegroundColor Green

    Write-Host "Setting NEXT_PUBLIC_SITE_NAME..." -ForegroundColor Yellow
    "Lab404 Electronics" | vercel env add NEXT_PUBLIC_SITE_NAME production
    Write-Host "✓ NEXT_PUBLIC_SITE_NAME set" -ForegroundColor Green

    Pop-Location

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Setting up Admin environment variables" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    Push-Location apps/admin

    Write-Host "Setting NEXT_PUBLIC_API_URL..." -ForegroundColor Yellow
    "https://api.lab404electronics.com/api" | vercel env add NEXT_PUBLIC_API_URL production
    Write-Host "✓ NEXT_PUBLIC_API_URL set" -ForegroundColor Green

    Pop-Location

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "✅ Setup Complete!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify variables in Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "2. Run: vercel --prod (in each app directory) to redeploy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: You may need to add remaining variables manually via dashboard:" -ForegroundColor Cyan
    Write-Host "- SMTP credentials" -ForegroundColor Cyan
    Write-Host "- ImageKit credentials" -ForegroundColor Cyan
    Write-Host "- Google API credentials" -ForegroundColor Cyan
    Write-Host ""

} else {
    Write-Host "Error: .env file not found" -ForegroundColor Red
    Write-Host "Please make sure .env exists in the root directory" -ForegroundColor Red
    exit 1
}
