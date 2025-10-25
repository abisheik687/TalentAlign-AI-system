# 🚀 TalentAlign AI Deployment Guide

This guide covers deploying TalentAlign AI on various free hosting platforms. Each platform has different capabilities and limitations.

## 📋 **Platform Comparison**

| Platform | Frontend | Backend | Database | Free Tier | Best For |
|----------|----------|---------|----------|-----------|----------|
| **Vercel** | ✅ Excellent | ✅ Serverless | ❌ External | Generous | Full-stack apps |
| **Netlify** | ✅ Excellent | ⚠️ Functions | ❌ External | Good | Static + JAMstack |
| **Railway** | ✅ Good | ✅ Excellent | ✅ Included | Limited | Backend-heavy |
| **Render** | ✅ Good | ✅ Good | ✅ Included | Moderate | Balanced |
| **Heroku** | ⚠️ Addon | ✅ Excellent | ✅ Included | Limited | Traditional apps |

## 🏆 **Recommended: Vercel + MongoDB Atlas**

**Best overall option for TalentAlign AI**

### Why Vercel?
- ✅ **Generous free tier** - 100GB bandwidth, unlimited sites
- ✅ **Full-stack support** - Frontend + serverless backend
- ✅ **Automatic deployments** - Git integration
- ✅ **Global CDN** - Fast worldwide performance
- ✅ **Zero configuration** - Works out of the box

### Setup Instructions

#### 1. **Prepare Database (MongoDB Atlas - Free)**
```bash
# Sign up at https://cloud.mongodb.com
# Create free M0 cluster (512MB storage)
# Get connection string: mongodb+srv://username:password@cluster.mongodb.net/talentalign-ai
```

#### 2. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add OPENAI_API_KEY

# Redeploy with environment variables
vercel --prod
```

#### 3. **Environment Variables**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/talentalign-ai
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
OPENAI_API_KEY=sk-your-openai-api-key (optional)
CORS_ORIGIN=https://your-app.vercel.app
```

---

## 🎯 **Alternative: Railway (Easiest Backend)**

**Best for backend-heavy applications**

### Setup Instructions

#### 1. **Deploy Backend**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy backend
cd backend
railway up

# Add environment variables in Railway dashboard
```

#### 2. **Deploy Frontend (Netlify)**
```bash
# Connect GitHub repo to Netlify
# Set build command: cd frontend && npm run build
# Set publish directory: frontend/build
# Add environment variable: REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

## 🔧 **Alternative: Render (All-in-One)**

**Good balanced option with database included**

### Setup Instructions

#### 1. **Create render.yaml**
```yaml
# Use the provided render.yaml configuration
# Commit to your repository
```

#### 2. **Deploy**
```bash
# Connect GitHub repository to Render
# Render will automatically deploy based on render.yaml
# Set environment variables in Render dashboard
```

---

## ⚡ **Quick Deploy Options**

### **1-Click Vercel Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/talentalign-ai&env=MONGODB_URI,JWT_SECRET,JWT_REFRESH_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/your-org/talentalign-ai/blob/main/deployment/DEPLOYMENT_GUIDE.md)

### **1-Click Railway Deploy**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-org/talentalign-ai)

### **1-Click Render Deploy**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-org/talentalign-ai)

---

## 🗄️ **Database Options**

### **Free Database Providers**

#### **MongoDB Atlas (Recommended)**
- ✅ **512MB free tier**
- ✅ **Global clusters**
- ✅ **Built-in security**
- ✅ **Easy setup**
- 🔗 [Sign up](https://cloud.mongodb.com)

#### **PlanetScale (MySQL)**
- ✅ **5GB free tier**
- ✅ **Serverless scaling**
- ✅ **Branching workflow**
- ⚠️ Requires schema changes

#### **Supabase (PostgreSQL)**
- ✅ **500MB free tier**
- ✅ **Real-time features**
- ✅ **Built-in auth**
- ⚠️ Requires schema changes

---

## 🔐 **Environment Variables Setup**

### **Required Variables**
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/talentalign-ai

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters-long

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Optional AI Features
OPENAI_API_KEY=sk-your-openai-api-key
```

### **Frontend Variables**
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_NAME=TalentAlign AI
```

---

## 🚀 **Deployment Steps Summary**

### **Option 1: Vercel (Recommended)**
1. Create MongoDB Atlas account (free)
2. Fork/clone repository
3. Connect to Vercel
4. Add environment variables
5. Deploy automatically

### **Option 2: Railway + Netlify**
1. Deploy backend to Railway
2. Deploy frontend to Netlify
3. Connect with environment variables
4. Configure CORS

### **Option 3: Render**
1. Connect GitHub repository
2. Use render.yaml configuration
3. Add environment variables
4. Deploy automatically

---

## 📊 **Free Tier Limitations**

### **Vercel**
- ✅ **100GB bandwidth/month**
- ✅ **Unlimited sites**
- ⚠️ **10-second function timeout**
- ⚠️ **Serverless functions only**

### **Railway**
- ⚠️ **$5 credit/month**
- ⚠️ **Limited to ~550 hours**
- ✅ **Full backend support**
- ✅ **Database included**

### **Render**
- ⚠️ **750 hours/month**
- ⚠️ **Sleeps after 15min inactivity**
- ✅ **Full backend support**
- ✅ **Database included**

---

## 🔧 **Production Optimizations**

### **For Better Performance**
1. **Enable caching** in production
2. **Optimize bundle size** with code splitting
3. **Use CDN** for static assets
4. **Implement service workers** for offline support
5. **Add monitoring** with error tracking

### **For Scaling**
1. **Database indexing** for better queries
2. **Redis caching** for session management
3. **Load balancing** for high traffic
4. **Microservices** architecture for large scale

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **CORS Errors**
```javascript
// Ensure CORS_ORIGIN matches your frontend URL exactly
CORS_ORIGIN=https://your-app.vercel.app (no trailing slash)
```

#### **Database Connection**
```javascript
// Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for serverless)
// Verify connection string format
// Test connection with MongoDB Compass
```

#### **Environment Variables**
```javascript
// Ensure all required variables are set
// Check variable names match exactly
// Restart deployment after adding variables
```

#### **Build Failures**
```javascript
// Check Node.js version compatibility
// Verify all dependencies are in package.json
// Check build logs for specific errors
```

---

## 🎯 **Success Checklist**

- [ ] Database connected and accessible
- [ ] Environment variables configured
- [ ] Frontend builds successfully
- [ ] Backend API responds to health check
- [ ] Authentication works (register/login)
- [ ] CORS configured correctly
- [ ] SSL certificate active (HTTPS)
- [ ] Error monitoring setup
- [ ] Performance monitoring active

**Your TalentAlign AI is now live and ready for users!** 🎉