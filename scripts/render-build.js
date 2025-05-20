/**
 * Custom build script for Render deployment
 * Run with: node scripts/render-build.js
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

console.log('Starting Render build process...');

// Install dependencies
console.log('Installing dependencies...');
runCommand('npm install');

// Generate Prisma client
console.log('Generating Prisma client...');
runCommand('npx prisma generate');

// Clean .next directory if it exists
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('Cleaning .next directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// Build the Next.js application
console.log('Building Next.js application...');
runCommand('npm run build');

// Verify that prerender-manifest.js exists
const prerenderManifestPath = path.join(process.cwd(), '.next', 'prerender-manifest.js');
if (!fs.existsSync(prerenderManifestPath)) {
  console.log('Warning: prerender-manifest.js was not generated.');
  console.log('Creating an empty prerender-manifest.js file...');
  
  // Create a minimal prerender-manifest.js file
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
  console.log('Created empty prerender-manifest.js file.');
}

console.log('Build process completed successfully!');
