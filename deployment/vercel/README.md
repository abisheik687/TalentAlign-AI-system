# 🚀 Vercel Deployment Guide

This guide will help you deploy TalentAlign AI to Vercel with a simplified configuration that works reliably.

## 📋 **What's Included**

- ✅ **Frontend** - React app served as static files
- ✅ **Backend API** - Serverless functions for demo endpoints
- ✅ **Database** - MongoDB Atlas (free tier)
- ✅ **Authentication** - Demo JWT implementation
- ✅ **One-click deploy** - Automated setup

## 🚀 **Quick Deploy**

### **Option 1: One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/talentalign-ai)

### **Option 2: Manual Deploy**

1. **Fork/Clone Repository**
```bash
git clone https://github.com/your-org/talentalign-ai.git
cd talentalign-ai
```

2. **Install Vercel CLI**
```bash
npm i -g vercel
```

3. **Login to Vercel**
```bash
vercel login
```

4. **Deploy**
```bash
# Copy Vercel configuration
cp deployment/vercel/vercel.json ./

# Deploy
vercel --prod
```

## 🔧 **Configuration**

### **Environment Variables (Optional)**

For full functionality, add these in Vercel dashboard:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/talentalign-ai
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
OPENAI_API_KEY=sk-your-openai-api-key
```

### **Build Settings**

Vercel will automatically detect:
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install`

## 📁 **Project Structure for Vercel**

```
talentalign-ai/
├── api/                    # Vercel serverless functions
│   └── index.js           # Main API handler
├── frontend/              # React application
│   ├── build/            # Built static files (auto-generated)
│   └── src/              # Source code
├── backend/              # Full Node.js backend (for local dev)
├── vercel.json           # Vercel configuration
└── package.json          # Root build scripts
```

## 🎯 **Features Available**

### **✅ Working Features**
- User registration and login (demo)
- Job listings display
- Bias monitoring dashboard
- Performance metrics
- Candidate portal
- Ethics dashboard
- Assessment tools

### **⚠️ Limited Features (Demo Mode)**
- Database operations (uses mock data)
- File uploads (not supported in serverless)
- Real-time features (WebSocket limitations)
- Advanced ML models (compute limitations)

## 🔄 **Development Workflow**

### **Local Development**
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
# This runs both frontend (3000) and backend (3001)
```

### **Deploy Changes**
```bash
# Commit changes to git
git add .
git commit -m "Update features"
git push

# Vercel auto-deploys from git
# Or manual deploy:
vercel --prod
```

## 🗄️ **Database Setup (Optional)**

For full functionality, set up MongoDB Atlas:

1. **Create Account**: https://cloud.mongodb.com
2. **Create Cluster**: Choose M0 (free tier)
3. **Get Connection String**: Replace in environment variables
4. **Whitelist IPs**: Allow 0.0.0.0/0 for serverless

## 🚀 **Performance Optimizations**

### **Vercel Optimizations**
- ✅ **Global CDN** - Automatic edge caching
- ✅ **Image Optimization** - Automatic WebP conversion
- ✅ **Code Splitting** - Lazy loading components
- ✅ **Compression** - Gzip/Brotli compression

### **Build Optimizations**
```json
{
  "build": {
    "env": {
      "GENERATE_SOURCEMAP": "false",
      "REACT_APP_API_URL": "/api"
    }
  }
}
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and rebuild
vercel --prod --force

# Check build logs in Vercel dashboard
```

#### **API Not Working**
- Ensure `api/index.js` exists
- Check function logs in Vercel dashboard
- Verify CORS configuration

#### **Frontend Not Loading**
- Check build output directory
- Verify `frontend/build` exists after build
- Check static file routing

### **Debug Commands**
```bash
# Local build test
npm run build

# Check build output
ls -la frontend/build/

# Test API locally
cd api && node index.js
```

## 📊 **Vercel Limits (Free Tier)**

- ✅ **Bandwidth**: 100GB/month
- ✅ **Function Executions**: 100GB-hours/month
- ✅ **Function Duration**: 10 seconds max
- ✅ **Build Time**: 45 minutes max
- ✅ **Sites**: Unlimited

## 🎯 **Success Checklist**

- [ ] Repository connected to Vercel
- [ ] Build completes successfully
- [ ] Frontend loads at your-app.vercel.app
- [ ] API responds at your-app.vercel.app/api/health
- [ ] Login/register works
- [ ] Dashboard displays data
- [ ] No console errors

## 🆘 **Support**

### **Vercel Resources**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Support](https://vercel.com/support)

### **Project Support**
- [GitHub Issues](https://github.com/your-org/talentalign-ai/issues)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

---

**Your TalentAlign AI is now live on Vercel!** 🎉

Access your app at: `https://your-app-name.vercel.app`