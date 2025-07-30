#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need malformed return statement fixes
const filesToFix = [
  'app/api/hr/onboarding/task-instances/[id]/route.ts',
  'app/api/hr/onboarding/workflows/[id]/route.ts',
  'app/api/hr/onboarding/workflows/route.ts',
  'app/api/hr/recruitment/background-check-vendors/route.ts',
  'app/api/hr/recruitment/evaluations/[id]/route.ts',
  'app/api/hr/recruitment/evaluations/route.ts',
  'app/api/hr/recruitment/interviews/[id]/route.ts',
  'app/api/hr/recruitment/job-postings/[id]/route.ts',
  'app/api/hr/recruitment/offers/[id]/approve/route.ts',
  'app/api/hr/recruitment/offers/[id]/respond/route.ts',
  'app/api/hr/recruitment/offers/[id]/route.ts',
  'app/api/hr/recruitment/offers/route.ts'
];

function fixMalformedReturns(filePath) {
  try {
    console.log(`🔧 Fixing malformed returns in ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix malformed return statements with closing brace attached
    const malformedReturnPattern = /return new NextResponse\([^)]+\);\}/g;
    if (content.match(malformedReturnPattern)) {
      content = content.replace(malformedReturnPattern, (match) => {
        return match.replace(';}', ';');
      });
      hasChanges = true;
      console.log('  ✅ Fixed malformed return statements');
    }

    // Fix double closing braces
    const doubleBracePattern = /\}\s*\}\s*\n(\s+[^}])/g;
    if (content.match(doubleBracePattern)) {
      content = content.replace(doubleBracePattern, '}\n$1');
      hasChanges = true;
      console.log('  ✅ Fixed double closing braces');
    }

    // Fix orphaned closing braces after return statements
    const orphanedBracePattern = /(\s+return new NextResponse\([^)]+\);\s*)\n(\s+\}\s*\n)/g;
    if (content.match(orphanedBracePattern)) {
      content = content.replace(orphanedBracePattern, '$1\n$2');
      hasChanges = true;
      console.log('  ✅ Fixed orphaned closing braces');
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  💾 Saved changes to ${filePath}`);
    } else {
      console.log(`  ℹ️  No malformed returns found in ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Starting malformed return fixes...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixMalformedReturns(fullPath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('✅ Malformed return fixes completed!');
