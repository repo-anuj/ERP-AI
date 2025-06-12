/**
 * Simple start script for Render deployment
 */

const { spawn } = require('child_process');

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Get the port from environment or use default
const port = process.env.PORT || 10000;

console.log(`Starting Next.js server on port ${port}...`);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Start Next.js server
const nextProcess = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], {
  stdio: 'inherit',
  env: process.env
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  nextProcess.kill('SIGINT');
});
