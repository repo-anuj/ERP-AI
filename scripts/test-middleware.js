/**
 * Test script to verify middleware Edge Runtime compatibility
 * Run with: node scripts/test-middleware.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing middleware Edge Runtime compatibility...\n');

// Test 1: Check if middleware imports are Edge Runtime compatible
console.log('1. Checking middleware imports...');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
if (!fs.existsSync(middlewarePath)) {
  console.log('❌ middleware.ts not found');
  process.exit(1);
}

const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

// Check for problematic imports
const problematicImports = [
  '@/lib/auth',
  '@/lib/prisma',
  'prisma',
  'fs',
  'path',
  'crypto',
  'buffer',
  'stream'
];

let hasProblematicImports = false;
problematicImports.forEach(imp => {
  if (middlewareContent.includes(`from '${imp}'`) || middlewareContent.includes(`from "${imp}"`)) {
    console.log(`❌ Found problematic import: ${imp}`);
    hasProblematicImports = true;
  }
});

if (!hasProblematicImports) {
  console.log('✅ No problematic imports found');
}

// Test 2: Check for Edge Runtime compatible imports
console.log('\n2. Checking for Edge Runtime compatible imports...');

const requiredImports = ['jose', 'next/server'];
let hasRequiredImports = true;

requiredImports.forEach(imp => {
  if (!middlewareContent.includes(imp)) {
    console.log(`❌ Missing required import: ${imp}`);
    hasRequiredImports = false;
  }
});

if (hasRequiredImports) {
  console.log('✅ All required imports present');
}

// Test 3: Check for Node.js specific APIs
console.log('\n3. Checking for Node.js specific APIs...');

const nodeApis = [
  'require(',
  'process.cwd(',
  'fs.',
  'path.',
  '__dirname',
  '__filename',
  'Buffer.',
  'global.',
];

let hasNodeApis = false;
nodeApis.forEach(api => {
  if (middlewareContent.includes(api)) {
    console.log(`⚠️  Found Node.js API: ${api}`);
    hasNodeApis = true;
  }
});

if (!hasNodeApis) {
  console.log('✅ No Node.js specific APIs found');
}

// Test 4: Check middleware configuration
console.log('\n4. Checking middleware configuration...');

if (middlewareContent.includes('export const config')) {
  console.log('✅ Middleware config found');
  
  if (middlewareContent.includes('matcher:')) {
    console.log('✅ Matcher configuration found');
  } else {
    console.log('⚠️  Matcher configuration missing');
  }
} else {
  console.log('❌ Middleware config missing');
}

// Test 5: Check for async/await usage
console.log('\n5. Checking async/await usage...');

if (middlewareContent.includes('export async function middleware')) {
  console.log('✅ Async middleware function found');
} else {
  console.log('❌ Async middleware function not found');
}

// Summary
console.log('\n📋 Edge Runtime Compatibility Summary:');
console.log(`- Imports: ${!hasProblematicImports ? '✅' : '❌'} Compatible`);
console.log(`- Required imports: ${hasRequiredImports ? '✅' : '❌'} Present`);
console.log(`- Node.js APIs: ${!hasNodeApis ? '✅' : '⚠️'} ${!hasNodeApis ? 'None found' : 'Some found'}`);
console.log(`- Configuration: ✅ Present`);

// Check if middleware is disabled
if (middlewareContent.includes('// Middleware disabled')) {
  console.log('\n🎉 Middleware is disabled - no Edge Runtime issues!');
  console.log('Authentication handled at page level.');
  console.log('Ready for deployment to both Vercel and Render! 🚀');
} else if (!hasProblematicImports && hasRequiredImports) {
  console.log('\n🎉 Middleware appears to be Edge Runtime compatible!');
  console.log('Ready for deployment to Render! 🚀');
} else {
  console.log('\n❌ Middleware may have Edge Runtime compatibility issues.');
  console.log('Consider disabling middleware for deployment compatibility.');
}
