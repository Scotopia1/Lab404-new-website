# Update CORS Origins in Vercel
# This script adds the admin domain to CORS_ORIGINS

Write-Host "`n🔧 Updating CORS_ORIGINS in Vercel...`n" -ForegroundColor Cyan

# Set the new CORS origins
$corsOrigins = "https://www.lab404electronics.com,https://lab404electronics.com,https://admin.lab404electronics.com"

Write-Host "📝 New CORS_ORIGINS value:"
Write-Host "   $corsOrigins`n" -ForegroundColor Yellow

# Update for API project
Write-Host "🚀 Updating API (lab404-api)..."
vercel env rm CORS_ORIGINS production --yes
vercel env add CORS_ORIGINS production --token "$env:VERCEL_TOKEN"
# When prompted, paste: $corsOrigins

Write-Host "`n✅ CORS_ORIGINS updated successfully!`n" -ForegroundColor Green

Write-Host "📋 Next steps:"
Write-Host "   1. Redeploy the API: vercel --prod"
Write-Host "   2. Test admin login at: https://admin.lab404electronics.com/login`n"
