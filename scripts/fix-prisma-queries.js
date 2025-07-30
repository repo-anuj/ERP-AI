#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need Prisma query fixes
const filesToFix = [
  'app/api/hr/onboarding/task-instances/[id]/route.ts',
  'app/api/hr/onboarding/workflows/[id]/route.ts',
  'app/api/hr/onboarding/workflows/route.ts',
  'app/api/hr/recruitment/background-check-vendors/route.ts',
  'app/api/hr/recruitment/evaluations/[id]/route.ts'
];

function fixPrismaQueries(filePath) {
  try {
    console.log(`🔧 Fixing Prisma queries in ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix missing commas in Prisma include/select objects
    const missingCommaPattern = /(\s+}\s*)\n(\s+}\s*\n\s+}\s*\n\s+\}\);)/g;
    if (content.match(missingCommaPattern)) {
      content = content.replace(missingCommaPattern, '$1,$2');
      hasChanges = true;
      console.log('  ✅ Fixed missing commas in Prisma queries');
    }

    // Fix malformed try-catch blocks that break module structure
    const malformedTryCatchPattern = /(\s+return NextResponse\.json\([^}]+\}\);\s*)\n(\s+\} catch \(error\) \{)/g;
    if (content.match(malformedTryCatchPattern)) {
      content = content.replace(malformedTryCatchPattern, '$1\n\n$2');
      hasChanges = true;
      console.log('  ✅ Fixed malformed try-catch blocks');
    }

    // Fix missing closing braces for include/select objects
    const missingIncludeBracePattern = /(\s+include:\s*\{[^}]+)\n(\s+\}\);)/g;
    if (content.match(missingIncludeBracePattern)) {
      content = content.replace(missingIncludeBracePattern, '$1\n    }$2');
      hasChanges = true;
      console.log('  ✅ Fixed missing include/select closing braces');
    }

    // Fix orphaned closing braces that break query structure
    const orphanedQueryBracePattern = /(\s+}\s*)\n(\s+}\s*)\n(\s+}\s*)\n(\s+\}\);)/g;
    if (content.match(orphanedQueryBracePattern)) {
      content = content.replace(orphanedQueryBracePattern, '$1,$2,$3$4');
      hasChanges = true;
      console.log('  ✅ Fixed orphaned query closing braces');
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  💾 Saved changes to ${filePath}`);
    } else {
      console.log(`  ℹ️  No Prisma query issues found in ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Starting Prisma query fixes...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixPrismaQueries(fullPath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('✅ Prisma query fixes completed!');
console.log('📝 Note: Complex query structure issues may need manual fixing.');
