# 🚀 ERP-AI Deployment Guide

This guide provides comprehensive instructions for deploying the ERP-AI application to production environments.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **MongoDB Database** - A production MongoDB instance (MongoDB Atlas recommended)
2. **Environment Variables** - All required environment variables configured
3. **Domain/Hosting** - Vercel or Render account for deployment

## 🔧 Environment Variables

### Required Variables

```bash
# Database Configuration
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/erp-ai?retryWrites=true&w=majority"

# Authentication
JWT_SECRET_KEY="your-super-secure-jwt-secret-key-minimum-32-characters"

# Application
NODE_ENV="production"
```

### Optional Variables

```bash
# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED="1"

# Email Configuration (future features)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@your-domain.com"
```

## 🌐 Vercel Deployment

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/erp-ai)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET_KEY
   ```

### Vercel Configuration

The project includes a `vercel.json` file with optimized settings:
- Function timeout: 30 seconds
- Security headers
- API route optimization
- Automatic cron jobs for recurring tasks

## 🎨 Render Deployment

### Using Blueprint (Recommended)

1. **Fork the Repository**
2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Configure Environment Variables**
   - Set `DATABASE_URL` in Render dashboard
   - Set `JWT_SECRET_KEY` in Render dashboard

### Manual Deployment

1. **Create Web Service**
   - Environment: Node
   - Build Command: `npm run build:render`
   - Start Command: `npm run start`

2. **Configure Settings**
   - Plan: Starter (recommended)
   - Region: Oregon (or closest to your users)
   - Health Check Path: `/api/test-db`

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Choose your preferred region

2. **Configure Security**
   - Add your IP address to whitelist
   - Create database user with read/write permissions

3. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Local MongoDB (Development)

```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/your/db
```

## 🔍 Health Checks

### Deployment Verification

After deployment, verify your application:

1. **Health Check Endpoint**
   ```
   GET https://your-domain.com/api/test-db
   ```

2. **Expected Response**
   ```json
   {
     "status": "success",
     "message": "Health check passed",
     "database": {
       "connected": true,
       "userCount": 0,
       "companyCount": 0
     },
     "environment": {
       "NODE_ENV": "production"
     }
   }
   ```

### Monitoring

- **Vercel**: Use Vercel Analytics and monitoring dashboard
- **Render**: Use Render's built-in monitoring and logs
- **Custom**: Monitor the `/api/test-db` endpoint for uptime

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` is correct
   - Check MongoDB Atlas IP whitelist
   - Ensure database user has proper permissions

2. **JWT Secret Error**
   - Ensure `JWT_SECRET_KEY` is set and secure
   - Must be at least 32 characters in production

3. **Build Failures**
   - Check build logs for specific errors
   - Verify all dependencies are installed
   - Ensure TypeScript compilation passes

### Debug Commands

```bash
# Test environment locally
npm run build

# Check environment variables
node -e "console.log(process.env)"

# Test database connection
curl https://your-domain.com/api/test-db
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Strong JWT secret key (32+ characters)
- [ ] Secure database connection (SSL enabled)
- [ ] Environment variables properly set
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Security headers configured
- [ ] Database user has minimal required permissions

### Security Headers

The application automatically sets these security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`

## 📊 Performance Optimization

### Automatic Optimizations

- Server-side rendering (SSR)
- Static generation where possible
- Image optimization
- Bundle splitting
- Compression enabled

### Monitoring Performance

- Use Vercel Analytics or Render metrics
- Monitor API response times
- Check database query performance
- Monitor memory usage

## 🔄 CI/CD Pipeline

### Automatic Deployment

Both Vercel and Render support automatic deployment:
- **Vercel**: Deploys on every push to main branch
- **Render**: Deploys on every push to main branch

### Manual Deployment

```bash
# Vercel
vercel --prod

# Render
# Push to main branch or trigger manual deploy in dashboard
```

## 📞 Support

If you encounter issues:

1. Check the deployment logs
2. Verify environment variables
3. Test the health check endpoint
4. Review this documentation
5. Check the GitHub issues page

---

**Happy Deploying! 🚀**
