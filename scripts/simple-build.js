/**
 * Simple build script for debugging
 */

const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Success: ${command}`);
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

console.log('=== Simple Build Script ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

try {
  // Install dependencies
  console.log('\n1. Installing dependencies...');
  runCommand('npm ci');

  // Generate Prisma client
  console.log('\n2. Generating Prisma client...');
  runCommand('npx prisma generate');

  // Build Next.js
  console.log('\n3. Building Next.js application...');
  runCommand('npx next build');

  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
