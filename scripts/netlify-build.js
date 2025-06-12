#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Netlify build process...');

try {
  // Step 1: Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Prisma client generated successfully');

  // Step 2: Build Next.js application with timeout handling
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    timeout: 600000, // 10 minutes timeout
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  console.log('✅ Next.js build completed successfully');

  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}
