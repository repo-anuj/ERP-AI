#!/bin/bash

# Exit on error
set -e

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Clean .next directory if it exists
if [ -d ".next" ]; then
  echo "Cleaning .next directory..."
  rm -rf .next
fi

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Verify that prerender-manifest.js exists
if [ ! -f ".next/prerender-manifest.js" ]; then
  echo "Warning: prerender-manifest.js was not generated."
  echo "Creating an empty prerender-manifest.js file..."
  
  # Create a minimal prerender-manifest.js file
  echo "module.exports = {
  version: 4,
  routes: {},
  dynamicRoutes: {},
  preview: {
    previewModeId: '',
    previewModeSigningKey: '',
    previewModeEncryptionKey: ''
  },
  notFoundRoutes: []
}" > .next/prerender-manifest.js
  
  echo "Created empty prerender-manifest.js file."
fi

echo "Build process completed successfully!"
