# 🔧 Deployment Troubleshooting Guide

This guide helps resolve common deployment issues across different platforms.

## 🚨 **Common Vercel Issues**

### **Issue: "react-scripts: command not found"**

**Problem**: Build fails because dependencies aren't installed properly.

**Solutions**:

#### **Solution 1: Fix Build Configuration**
```bash
# 1. Ensure root package.json exists with proper build scripts
# 2. Copy the corrected vercel.json
cp deployment/vercel/vercel.json ./

# 3. Test build locally
npm run build

# 4. Deploy again
vercel --prod
```

#### **Solution 2: Use Frontend-Only Deployment**
```bash
# Deploy only frontend to Vercel, backend elsewhere
cp deployment/vercel-simple/vercel.json ./
vercel --prod
```

#### **Solution 3: Manual Build Process**
```bash
# Build locally and deploy built files
cd frontend
npm install
npm run build
cd ..

# Deploy with pre-built files
vercel --prod
```

### **Issue: "Build Command Failed"**

**Problem**: Build process encounters errors.

**Solutions**:

1. **Check Dependencies**
```bash
# Install all dependencies
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
```

2. **Fix Build Scripts**
```bash
# Ensure package.json has correct scripts
{
  "scripts": {
    "build": "npm run build:frontend",
    "build:frontend": "cd frontend && npm run build"
  }
}
```

3. **Environment Variables**
```bash
# Set required build environment variables
REACT_APP_API_URL=/api
REACT_APP_NAME="TalentAlign AI"
```

### **Issue: "Function Timeout"**

**Problem**: Serverless functions exceed 10-second limit.

**Solutions**:

1. **Optimize Functions**
```javascript
// Keep functions lightweight
// Avoid heavy computations
// Use external APIs for complex operations
```

2. **Use External Backend**
```bash
# Deploy backend to Railway/Render
# Use Vercel only for frontend
```

## 🚨 **Common Railway Issues**

### **Issue: "Build Failed"**

**Solutions**:

1. **Check Node Version**
```bash
# Ensure Node.js 18+ in package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

2. **Fix Build Command**
```bash
# In Railway dashboard, set:
# Build Command: cd backend && npm install && npm run build
# Start Command: cd backend && npm start
```

### **Issue: "Database Connection Failed"**

**Solutions**:

1. **Use Railway Database**
```bash
# Add PostgreSQL plugin in Railway
# Use provided DATABASE_URL
```

2. **Use External Database**
```bash
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

## 🚨 **Common Render Issues**

### **Issue: "Service Unavailable"**

**Problem**: Free tier services sleep after 15 minutes.

**Solutions**:

1. **Keep Service Awake**
```bash
# Use external monitoring service
# Or upgrade to paid tier
```

2. **Optimize Cold Starts**
```javascript
// Minimize startup time
// Use lightweight dependencies
```

## 🚨 **Database Issues**

### **Issue: "MongoDB Connection Failed"**

**Solutions**:

1. **Check Connection String**
```bash
# Ensure correct format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

2. **Whitelist IPs**
```bash
# In MongoDB Atlas:
# Network Access → Add IP Address → 0.0.0.0/0 (for serverless)
```

3. **Check Credentials**
```bash
# Verify username/password
# Ensure user has read/write permissions
```

### **Issue: "Database User Authentication Failed"**

**Solutions**:

1. **Create Database User**
```bash
# In MongoDB Atlas:
# Database Access → Add New Database User
# Set username/password
# Grant Atlas Admin privileges (for development)
```

2. **Update Connection String**
```bash
# Replace <username> and <password> with actual values
# URL encode special characters in password
```

## 🚨 **Frontend Issues**

### **Issue: "API Calls Failing"**

**Solutions**:

1. **Check API URL**
```bash
# Ensure REACT_APP_API_URL is correct
REACT_APP_API_URL=https://your-backend.com/api
```

2. **CORS Configuration**
```javascript
// Backend CORS settings
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

3. **Network Tab Debugging**
```bash
# Open browser dev tools
# Check Network tab for failed requests
# Verify request URLs and responses
```

### **Issue: "Environment Variables Not Working"**

**Solutions**:

1. **Prefix with REACT_APP_**
```bash
# Frontend environment variables must start with REACT_APP_
REACT_APP_API_URL=https://api.example.com
```

2. **Restart Development Server**
```bash
# After changing .env file
npm start
```

3. **Check Build Environment**
```bash
# Ensure variables are set in build environment
# Vercel: Project Settings → Environment Variables
# Netlify: Site Settings → Environment Variables
```

## 🔧 **General Debugging Steps**

### **1. Check Logs**
```bash
# Vercel: Functions tab → View logs
# Railway: Deployments → View logs
# Render: Logs tab
# Netlify: Functions → View logs
```

### **2. Test Locally**
```bash
# Always test locally first
npm run dev

# Test build process
npm run build

# Test production build
npm start
```

### **3. Verify Dependencies**
```bash
# Check package.json files
# Ensure all dependencies are listed
# Run npm install in each directory
```

### **4. Environment Variables**
```bash
# List required variables
# Check they're set in deployment platform
# Verify correct naming (REACT_APP_ prefix for frontend)
```

### **5. Network Debugging**
```bash
# Use browser dev tools
# Check console for errors
# Verify API endpoints are accessible
# Test CORS configuration
```

## 🆘 **Quick Fixes**

### **Vercel Quick Fix**
```bash
# Use simplified configuration
cp deployment/vercel-simple/vercel.json ./
vercel --prod
```

### **Railway Quick Fix**
```bash
# Deploy backend only
# Use Netlify for frontend
# Connect via environment variables
```

### **Render Quick Fix**
```bash
# Use render.yaml configuration
# Commit to repository
# Connect GitHub repo to Render
```

### **Local Development Quick Fix**
```bash
# Reset everything
rm -rf node_modules package-lock.json
npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
cd ../backend && rm -rf node_modules package-lock.json && npm install
```

## 📞 **Getting Help**

### **Platform Support**
- **Vercel**: [Vercel Support](https://vercel.com/support)
- **Railway**: [Railway Discord](https://discord.gg/railway)
- **Render**: [Render Support](https://render.com/support)
- **Netlify**: [Netlify Support](https://www.netlify.com/support/)

### **Project Support**
- **GitHub Issues**: [Create Issue](https://github.com/your-org/talentalign-ai/issues)
- **Documentation**: [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **Email**: support@talentalign-ai.com

---

**Remember**: Start with the simplest deployment option and gradually add complexity as needed. Most issues can be resolved by checking logs and verifying configuration.