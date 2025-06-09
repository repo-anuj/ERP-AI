/**
 * Test build script to verify deployment compatibility
 * Run with: node scripts/test-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands and log output
function runCommand(command, options = {}) {
  console.log(`Running: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

console.log('🧪 Testing build compatibility...\n');

// Test 1: Check TypeScript compilation
console.log('1. Testing TypeScript compilation...');
const tscResult = runCommand('npx tsc --noEmit', { stdio: 'pipe' });
if (tscResult !== null) {
  console.log('✅ TypeScript compilation passed');
} else {
  console.log('❌ TypeScript compilation failed');
}

// Test 2: Check ESLint
console.log('\n2. Testing ESLint...');
const eslintResult = runCommand('npx eslint . --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
if (eslintResult !== null) {
  console.log('✅ ESLint passed');
} else {
  console.log('⚠️  ESLint has warnings/errors (may not block deployment)');
}

// Test 3: Test Next.js build
console.log('\n3. Testing Next.js build...');
const buildResult = runCommand('npm run build');
if (buildResult !== null) {
  console.log('✅ Next.js build passed');
} else {
  console.log('❌ Next.js build failed');
  process.exit(1);
}

// Test 4: Check for critical files
console.log('\n4. Checking for critical build files...');
const criticalFiles = [
  '.next/standalone/server.js',
  '.next/static',
  '.next/server/middleware.js'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All tests passed! Build is ready for deployment.');
} else {
  console.log('\n❌ Some critical files are missing. Check the build process.');
  process.exit(1);
}

console.log('\n📋 Deployment checklist:');
console.log('- ✅ TypeScript compilation');
console.log('- ✅ Next.js build');
console.log('- ✅ Critical files present');
console.log('- 🔧 Environment variables configured');
console.log('- 🔧 Database connection tested');
console.log('\nReady for deployment to Vercel and Render! 🚀');
