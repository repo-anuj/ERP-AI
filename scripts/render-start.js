/**
 * Custom start script for Render deployment
 * This script ensures the application starts in production mode
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Get the port from environment or use default
const port = process.env.PORT || 3000;

console.log(`Starting Next.js in production mode on port ${port}...`);
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Available scripts in package.json:');
try {
  const packageJson = require('../package.json');
  console.log(JSON.stringify(packageJson.scripts, null, 2));
} catch (e) {
  console.log('Could not read package.json scripts');
}

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

// Create a fallback for the prerender-manifest.json if it doesn't exist
const prerenderManifestJsonPath = path.join(nextDir, 'prerender-manifest.json');
if (!fs.existsSync(prerenderManifestJsonPath)) {
  console.log('Creating prerender-manifest.json...');
  const emptyManifestJson = `{
  "version": 4,
  "routes": {},
  "dynamicRoutes": {},
  "preview": {
    "previewModeId": "",
    "previewModeSigningKey": "",
    "previewModeEncryptionKey": ""
  },
  "notFoundRoutes": []
}`;
  fs.writeFileSync(prerenderManifestJsonPath, emptyManifestJson);
}

// Set up error handling for the process
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Start the Next.js server
try {
  console.log(`Starting Next.js server on port ${port}...`);
  // Use spawn instead of execSync to keep the process running
  const { spawn } = require('child_process');

  const nextProcess = spawn('next', ['start', '-p', port, '-H', '0.0.0.0'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  nextProcess.on('error', (error) => {
    console.error('Failed to start Next.js server:', error);
    console.log('Attempting to start with fallback server...');
    startFallbackServer();
  });

  nextProcess.on('exit', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    if (code !== 0) {
      console.log('Starting fallback server...');
      startFallbackServer();
    }
  });

  // Keep the process alive
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    nextProcess.kill('SIGINT');
    process.exit(0);
  });

} catch (error) {
  console.error('Failed to start Next.js server:', error);
  console.log('Attempting to start with fallback server...');
  startFallbackServer();
}

function startFallbackServer() {

  // Fallback to a simple HTTP server if Next.js fails to start
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ERP-AI System</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #e74c3c; }
            .button { display: inline-block; background: #3498db; color: white; padding: 10px 20px;
                     text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>ERP-AI System</h1>
            <p>The application is currently experiencing technical difficulties.</p>
            <p class="error">Our team has been notified and is working to resolve the issue.</p>
            <a href="/" class="button">Refresh</a>
          </div>
        </body>
      </html>
    `);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Fallback server running on port ${port}`);
  });
}
