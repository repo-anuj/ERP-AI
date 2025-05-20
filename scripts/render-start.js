/**
 * Custom start script for Render deployment
 * This script ensures the application starts in production mode
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Get the port from environment or use default
const port = process.env.PORT || 3000;

console.log(`Starting Next.js in production mode on port ${port}...`);

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('.next directory not found. Make sure the build was successful.');
  process.exit(1);
}

// Check if prerender-manifest.js exists, create if not
const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.js');
if (!fs.existsSync(prerenderManifestPath)) {
  console.log('Creating prerender-manifest.js...');
  const emptyManifest = `module.exports = {
  version: 4,
  routes: {},
  dynamicRoutes: {},
  preview: {
    previewModeId: '',
    previewModeSigningKey: '',
    previewModeEncryptionKey: ''
  },
  notFoundRoutes: []
}`;
  fs.writeFileSync(prerenderManifestPath, emptyManifest);
}

// Start the Next.js server
runCommand(`next start -p ${port}`);
