#!/bin/bash

# TalentAlign AI - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 TalentAlign AI - Vercel Deployment"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Check if environment variables are set
echo "🔧 Checking environment variables..."
ENV_VARS=("MONGODB_URI" "JWT_SECRET" "JWT_REFRESH_SECRET")
MISSING_VARS=()

for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these variables and run the script again:"
    echo "export MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/talentalign-ai'"
    echo "export JWT_SECRET='your-super-secret-jwt-key-min-32-chars'"
    echo "export JWT_REFRESH_SECRET='your-refresh-secret-key-min-32-chars'"
    echo "export OPENAI_API_KEY='sk-your-openai-api-key' # Optional"
    exit 1
fi

# Copy Vercel configuration
echo "📋 Setting up Vercel configuration..."
cp deployment/vercel/vercel.json ./

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Set environment variables in Vercel
echo "🔧 Setting environment variables..."
vercel env add MONGODB_URI production <<< "$MONGODB_URI"
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add JWT_REFRESH_SECRET production <<< "$JWT_REFRESH_SECRET"

if [ ! -z "$OPENAI_API_KEY" ]; then
    vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
fi

# Redeploy with environment variables
echo "🔄 Redeploying with environment variables..."
vercel --prod

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at: https://talentalign-ai.vercel.app"
echo ""
echo "📋 Next steps:"
echo "1. Test the application functionality"
echo "2. Set up custom domain (optional)"
echo "3. Configure monitoring and analytics"
echo "4. Set up CI/CD for automatic deployments"