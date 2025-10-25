#!/bin/bash

# TalentAlign AI - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 TalentAlign AI - Vercel Deployment"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

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

# Copy Vercel configuration
echo "📋 Setting up Vercel configuration..."
cp deployment/vercel/vercel.json ./

# Install dependencies if needed
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Test build locally first
echo "🔨 Testing build locally..."
if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed. Please fix build errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if vercel --prod; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

# Optional: Set environment variables
echo ""
echo "🔧 Environment Variables Setup (Optional)"
echo "For full functionality, you can add these environment variables in Vercel dashboard:"
echo ""
echo "MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/talentalign-ai"
echo "JWT_SECRET=your-super-secret-jwt-key-min-32-chars"
echo "JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars"
echo "OPENAI_API_KEY=sk-your-openai-api-key"
echo ""

read -p "Would you like to set environment variables now? (y/n): " SET_ENV

if [ "$SET_ENV" = "y" ] || [ "$SET_ENV" = "Y" ]; then
    echo "Setting up environment variables..."
    
    read -p "Enter MongoDB URI (or press Enter to skip): " MONGODB_URI
    if [ ! -z "$MONGODB_URI" ]; then
        echo "$MONGODB_URI" | vercel env add MONGODB_URI production
    fi
    
    read -p "Enter JWT Secret (or press Enter to generate): " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s)-$(shuf -i 1000-9999 -n 1)-secret-key")
    fi
    echo "$JWT_SECRET" | vercel env add JWT_SECRET production
    
    read -p "Enter JWT Refresh Secret (or press Enter to generate): " JWT_REFRESH_SECRET
    if [ -z "$JWT_REFRESH_SECRET" ]; then
        JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s)-$(shuf -i 1000-9999 -n 1)-refresh-key")
    fi
    echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET production
    
    read -p "Enter OpenAI API Key (optional, press Enter to skip): " OPENAI_API_KEY
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production
    fi
    
    echo "🔄 Redeploying with environment variables..."
    vercel --prod
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your app is now live!"
echo "📱 Check your Vercel dashboard for the URL"
echo ""
echo "📋 Next steps:"
echo "1. Test the application functionality"
echo "2. Set up custom domain (optional)"
echo "3. Monitor performance in Vercel dashboard"
echo "4. Set up GitHub integration for auto-deployments"
echo ""
echo "🆘 Need help?"
echo "- Check deployment/vercel/README.md for detailed guide"
echo "- Visit Vercel dashboard for logs and settings"
echo "- Open GitHub issues for project-specific help"