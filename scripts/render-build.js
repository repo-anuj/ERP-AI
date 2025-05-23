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

// Install additional dependencies needed for CSS processing
console.log('Installing additional dependencies for CSS processing...');
runCommand('npm install --no-save postcss-import tailwindcss-nesting');

// Generate Prisma client
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

// Create a backup of the original globals.css
const globalsCssPath = path.join(process.cwd(), 'app', 'globals.css');
const globalsCssBackupPath = path.join(process.cwd(), 'app', 'globals.css.original');
const globalsFallbackPath = path.join(process.cwd(), 'app', 'globals.fallback.css');

if (fs.existsSync(globalsCssPath)) {
  console.log('Backing up original globals.css...');
  fs.copyFileSync(globalsCssPath, globalsCssBackupPath);
}

// Try to build the Next.js application
console.log('Building Next.js application...');
try {
  runCommand('npm run build');
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed, attempting fallback approach...');

  if (fs.existsSync(globalsFallbackPath)) {
    console.log('Using fallback CSS file...');
    fs.copyFileSync(globalsFallbackPath, globalsCssPath);

    // Try building again
    console.log('Attempting build with fallback CSS...');
    try {
      runCommand('npm run build');
      console.log('Build with fallback CSS completed successfully!');
    } catch (buildError) {
      console.error('Build still failing, restoring original CSS...');
      if (fs.existsSync(globalsCssBackupPath)) {
        fs.copyFileSync(globalsCssBackupPath, globalsCssPath);
      }
      throw buildError;
    }
  } else {
    console.error('Fallback CSS file not found, cannot proceed.');
    throw error;
  }
}

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
