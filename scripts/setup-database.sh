#!/bin/bash

# TalentAlign AI - Database Setup Script
# This script helps set up MongoDB Atlas for free deployment

set -e

echo "🗄️ TalentAlign AI - Database Setup"
echo "=================================="

echo "This script will guide you through setting up a free MongoDB Atlas database."
echo ""

# Check if MongoDB tools are available
if command -v mongosh &> /dev/null; then
    MONGO_CLIENT="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CLIENT="mongo"
else
    echo "⚠️ MongoDB client not found. You can still continue with manual setup."
    MONGO_CLIENT=""
fi

echo "📋 Step 1: Create MongoDB Atlas Account"
echo "1. Go to https://cloud.mongodb.com"
echo "2. Sign up for a free account"
echo "3. Create a new project called 'TalentAlign AI'"
echo ""
read -p "Press Enter when you've completed this step..."

echo ""
echo "📋 Step 2: Create Free Cluster"
echo "1. Click 'Build a Database'"
echo "2. Choose 'M0 Sandbox' (Free tier)"
echo "3. Select your preferred cloud provider and region"
echo "4. Name your cluster 'talentalign-cluster'"
echo ""
read -p "Press Enter when you've completed this step..."

echo ""
echo "📋 Step 3: Configure Database Access"
echo "1. Go to 'Database Access' in the left sidebar"
echo "2. Click 'Add New Database User'"
echo "3. Choose 'Password' authentication"
echo "4. Create a username and strong password"
echo "5. Set privileges to 'Atlas Admin' for development"
echo ""
read -p "Enter your database username: " DB_USERNAME
read -s -p "Enter your database password: " DB_PASSWORD
echo ""

echo ""
echo "📋 Step 4: Configure Network Access"
echo "1. Go to 'Network Access' in the left sidebar"
echo "2. Click 'Add IP Address'"
echo "3. Choose 'Allow Access from Anywhere' (0.0.0.0/0)"
echo "4. This is required for serverless deployments"
echo ""
read -p "Press Enter when you've completed this step..."

echo ""
echo "📋 Step 5: Get Connection String"
echo "1. Go to 'Database' in the left sidebar"
echo "2. Click 'Connect' on your cluster"
echo "3. Choose 'Connect your application'"
echo "4. Select 'Node.js' and version '4.1 or later'"
echo "5. Copy the connection string"
echo ""
echo "Your connection string should look like:"
echo "mongodb+srv://<username>:<password>@talentalign-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
echo ""

# Generate the connection string
CONNECTION_STRING="mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@talentalign-cluster.xxxxx.mongodb.net/talentalign-ai?retryWrites=true&w=majority"
echo "📝 Your connection string (replace xxxxx with your actual cluster ID):"
echo "$CONNECTION_STRING"
echo ""

# Test connection if MongoDB client is available
if [ ! -z "$MONGO_CLIENT" ]; then
    echo "🔍 Would you like to test the database connection? (y/n)"
    read -p "> " TEST_CONNECTION
    
    if [ "$TEST_CONNECTION" = "y" ] || [ "$TEST_CONNECTION" = "Y" ]; then
        echo "Enter your complete connection string:"
        read -p "> " FULL_CONNECTION_STRING
        
        echo "Testing connection..."
        if $MONGO_CLIENT "$FULL_CONNECTION_STRING" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            echo "✅ Database connection successful!"
        else
            echo "❌ Database connection failed. Please check your connection string and network settings."
        fi
    fi
fi

echo ""
echo "📋 Step 6: Environment Variables"
echo "Add these environment variables to your deployment platform:"
echo ""
echo "MONGODB_URI=$CONNECTION_STRING"
echo "JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-super-secret-jwt-key-minimum-32-characters-long')"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-refresh-secret-key-minimum-32-characters-long')"
echo ""

# Save to .env file for local development
echo "💾 Save these to .env file for local development? (y/n)"
read -p "> " SAVE_ENV

if [ "$SAVE_ENV" = "y" ] || [ "$SAVE_ENV" = "Y" ]; then
    echo "Enter your complete MongoDB connection string:"
    read -p "> " MONGODB_URI
    
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-super-secret-jwt-key-minimum-32-characters-long')
    JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-refresh-secret-key-minimum-32-characters-long')
    
    cat > backend/.env << EOF
# Database Configuration
MONGODB_URI=$MONGODB_URI
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Optional: OpenAI API Key
# OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Email Configuration
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-email-password
EOF

    echo "✅ Environment variables saved to backend/.env"
fi

echo ""
echo "✅ Database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Use the connection string in your deployment platform"
echo "2. Test your application locally with 'npm run dev'"
echo "3. Deploy to your chosen hosting platform"
echo "4. Monitor database usage in MongoDB Atlas dashboard"
echo ""
echo "💡 Tips:"
echo "- Monitor your free tier usage (512MB storage limit)"
echo "- Set up database alerts in MongoDB Atlas"
echo "- Consider upgrading to paid tier for production use"
echo "- Regularly backup your data"