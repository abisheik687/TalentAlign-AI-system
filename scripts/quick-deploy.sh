#!/bin/bash

# TalentAlign AI - Quick Deploy Script
# One-command deployment to multiple platforms

set -e

echo "🚀 TalentAlign AI - Quick Deploy"
echo "==============================="
echo ""

# Make scripts executable
chmod +x scripts/*.sh

echo "Choose your deployment platform:"
echo "1. Vercel (Recommended - Full-stack with serverless)"
echo "2. Railway (Backend) + Netlify (Frontend)"
echo "3. Render (All-in-one with database)"
echo "4. Setup Database Only (MongoDB Atlas)"
echo "5. Local Development Setup"
echo ""

read -p "Enter your choice (1-5): " CHOICE

case $CHOICE in
    1)
        echo "🎯 Deploying to Vercel..."
        echo ""
        echo "Prerequisites:"
        echo "- MongoDB Atlas database (free tier available)"
        echo "- Vercel account (free)"
        echo ""
        
        read -p "Do you have a MongoDB Atlas database ready? (y/n): " HAS_DB
        if [ "$HAS_DB" != "y" ] && [ "$HAS_DB" != "Y" ]; then
            echo "Setting up database first..."
            ./scripts/setup-database.sh
        fi
        
        echo ""
        echo "Now deploying to Vercel..."
        ./scripts/deploy-vercel.sh
        ;;
        
    2)
        echo "🎯 Deploying to Railway + Netlify..."
        echo ""
        echo "This will deploy:"
        echo "- Backend to Railway (with database)"
        echo "- Frontend to Netlify"
        echo ""
        
        echo "📋 Manual steps required:"
        echo "1. Go to https://railway.app and connect your GitHub repo"
        echo "2. Deploy the backend service"
        echo "3. Go to https://netlify.com and connect your GitHub repo"
        echo "4. Set build directory to 'frontend/build'"
        echo "5. Add environment variable: REACT_APP_API_URL=https://your-backend.railway.app/api"
        echo ""
        
        read -p "Press Enter to open Railway and Netlify in your browser..."
        if command -v open &> /dev/null; then
            open "https://railway.app/new"
            open "https://app.netlify.com/start"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://railway.app/new"
            xdg-open "https://app.netlify.com/start"
        else
            echo "Please manually visit:"
            echo "- https://railway.app/new"
            echo "- https://app.netlify.com/start"
        fi
        ;;
        
    3)
        echo "🎯 Deploying to Render..."
        echo ""
        echo "📋 Steps:"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Render will automatically detect the render.yaml configuration"
        echo "4. Set environment variables in the Render dashboard"
        echo ""
        
        echo "Required environment variables:"
        echo "- JWT_SECRET (generate a random 32+ character string)"
        echo "- JWT_REFRESH_SECRET (generate another random string)"
        echo "- OPENAI_API_KEY (optional, for AI features)"
        echo ""
        
        read -p "Press Enter to open Render in your browser..."
        if command -v open &> /dev/null; then
            open "https://render.com/deploy?repo=https://github.com/your-org/talentalign-ai"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://render.com/deploy?repo=https://github.com/your-org/talentalign-ai"
        else
            echo "Please manually visit: https://render.com"
        fi
        ;;
        
    4)
        echo "🗄️ Setting up MongoDB Atlas database..."
        ./scripts/setup-database.sh
        ;;
        
    5)
        echo "💻 Setting up local development environment..."
        echo ""
        
        # Check Node.js version
        if ! command -v node &> /dev/null; then
            echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
            exit 1
        fi
        
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            echo "❌ Node.js version 18+ required. Current version: $(node -v)"
            exit 1
        fi
        
        echo "✅ Node.js $(node -v) detected"
        
        # Install backend dependencies
        echo "📦 Installing backend dependencies..."
        cd backend && npm install
        cd ..
        
        # Install frontend dependencies
        echo "📦 Installing frontend dependencies..."
        cd frontend && npm install
        cd ..
        
        # Setup database
        echo "🗄️ Setting up database..."
        ./scripts/setup-database.sh
        
        # Create frontend .env
        if [ ! -f "frontend/.env" ]; then
            cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NAME=TalentAlign AI
REACT_APP_DEBUG_MODE=true
EOF
            echo "✅ Frontend environment variables created"
        fi
        
        echo ""
        echo "✅ Local development setup completed!"
        echo ""
        echo "🚀 To start the application:"
        echo "1. Start backend:  cd backend && npm run dev"
        echo "2. Start frontend: cd frontend && npm start"
        echo "3. Open http://localhost:3000 in your browser"
        echo ""
        echo "📋 Available scripts:"
        echo "- npm test          (run tests)"
        echo "- npm run lint      (check code quality)"
        echo "- npm run build     (build for production)"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1-5."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📚 Useful resources:"
echo "- Documentation: README.md"
echo "- Deployment guide: deployment/DEPLOYMENT_GUIDE.md"
echo "- Troubleshooting: Check the logs in your hosting platform"
echo ""
echo "🆘 Need help?"
echo "- GitHub Issues: https://github.com/your-org/talentalign-ai/issues"
echo "- Email: support@talentalign-ai.com"