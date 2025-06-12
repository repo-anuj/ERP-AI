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

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Validate environment before proceeding
console.log('Validating environment configuration...');
try {
  // Basic environment checks
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these variables in your Render dashboard');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Install dependencies with production optimizations
console.log('Installing dependencies...');
runCommand('npm ci');

// Additional dependencies should already be installed with npm ci

// Generate Prisma client with optimizations
console.log('Generating Prisma client...');
runCommand('npx prisma generate');

// Clean .next directory if it exists
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('Cleaning .next directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// Use the Render-specific PostCSS config
console.log('Setting up Render-specific PostCSS config...');
const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
const postcssRenderConfigPath = path.join(process.cwd(), 'postcss.config.render.js');

if (fs.existsSync(postcssRenderConfigPath)) {
  // Backup the original PostCSS config if it exists
  if (fs.existsSync(postcssConfigPath)) {
    fs.copyFileSync(postcssConfigPath, `${postcssConfigPath}.backup`);
  }

  // Copy the Render-specific config
  fs.copyFileSync(postcssRenderConfigPath, postcssConfigPath);
  console.log('Using Render-specific PostCSS configuration');
}

// Backup globals.css if it exists
const globalsCssPath = path.join(process.cwd(), 'app', 'globals.css');
const globalsCssBackupPath = path.join(process.cwd(), 'app', 'globals.css.original');

if (fs.existsSync(globalsCssPath)) {
  console.log('Backing up original globals.css...');
  fs.copyFileSync(globalsCssPath, globalsCssBackupPath);
}

// Build the Next.js application
console.log('Building Next.js application...');
// Set build optimizations
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

runCommand('npm run build');
console.log('Build completed successfully!');

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
