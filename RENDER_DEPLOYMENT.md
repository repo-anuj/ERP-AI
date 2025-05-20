# Render Deployment Guide

This guide provides instructions for deploying the ERP-AI application to Render.

## Deployment Configuration

The application is configured for deployment on Render using the `render.yaml` file in the root directory. This file defines the service configuration for the web application.

## Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, etc.)

2. **Create a new Render account or log in** at [render.com](https://render.com)

3. **Create a new Web Service**:
   - Click "New +" and select "Blueprint" from the dropdown
   - Connect your Git repository
   - Render will automatically detect the `render.yaml` file and configure the service

4. **Configure environment variables**:
   - Make sure to set up the `DATABASE_URL` environment variable with your MongoDB connection string
   - You can add this in the Render dashboard under Environment

5. **Deploy the service**:
   - Render will automatically build and deploy your application
   - The build process uses the custom build script at `scripts/render-build.js`

## Troubleshooting

If you encounter the error related to missing `.next/prerender-manifest.js`:

1. The custom build script should automatically create this file if it's missing
2. Check the build logs in the Render dashboard for any errors
3. Make sure your MongoDB connection is properly configured

## Manual Deployment

If you prefer to deploy manually without using the Blueprint feature:

1. Create a new Web Service in Render
2. Connect your Git repository
3. Configure the following settings:
   - **Environment**: Node
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start`
   - **Environment Variables**: Add `NODE_ENV=production` and your `DATABASE_URL`

## Monitoring

After deployment, you can monitor your application's performance and logs through the Render dashboard.

## Local Testing

To test the build process locally before deploying:

```bash
# Run the custom build script
npm run build:render

# Start the application
npm run start
```

This will simulate the build process that will run on Render.
