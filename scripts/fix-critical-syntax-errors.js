#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need critical syntax fixes
const criticalFiles = [
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

function fixCriticalSyntaxErrors(filePath) {
  try {
    console.log(`🔧 Fixing critical syntax errors in ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Pattern 1: Fix missing return statements before catch blocks
    const missingReturnPattern = /(\s+return NextResponse\.json\([^}]+\}\);)\s*\n(\s+} catch)/g;
    if (content.match(missingReturnPattern)) {
      content = content.replace(missingReturnPattern, '$1\n$2');
      hasChanges = true;
      console.log('  ✅ Fixed missing return statement before catch');
    }

    // Pattern 2: Fix missing closing braces for if statements
    const missingIfBracePattern = /(\s+if\s*\([^)]+\)\s*\{\s*return[^;]+;\s*)\n(\s+[^}])/g;
    if (content.match(missingIfBracePattern)) {
      content = content.replace(missingIfBracePattern, '$1}\n$2');
      hasChanges = true;
      console.log('  ✅ Fixed missing closing brace for if statement');
    }

    // Pattern 3: Fix malformed try-catch blocks (missing try)
    const malformedTryCatchPattern = /(\s+}\s*)\n(\s+} catch \(error\) \{)/g;
    if (content.match(malformedTryCatchPattern)) {
      content = content.replace(malformedTryCatchPattern, '$1\n  } catch (error) {');
      hasChanges = true;
      console.log('  ✅ Fixed malformed try-catch block');
    }

    // Pattern 4: Fix orphaned catch blocks
    const orphanedCatchPattern = /(\s+}\s*\n\s*} catch \(error\) \{[^}]+}\s*\n\s*}\s*\n\s*\/\/[^\n]*\n\s*export)/g;
    if (content.match(orphanedCatchPattern)) {
      content = content.replace(orphanedCatchPattern, (match) => {
        return match.replace('} catch (error)', '  } catch (error)');
      });
      hasChanges = true;
      console.log('  ✅ Fixed orphaned catch block');
    }

    // Pattern 5: Fix missing closing braces for functions
    const missingFunctionBracePattern = /(\s+return NextResponse\.json\([^}]+\}\);)\s*\n(\s+} catch)/g;
    if (content.match(missingFunctionBracePattern)) {
      content = content.replace(missingFunctionBracePattern, '$1\n\n$2');
      hasChanges = true;
      console.log('  ✅ Fixed missing function closing brace');
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  💾 Saved changes to ${filePath}`);
    } else {
      console.log(`  ℹ️  No critical syntax errors found in ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Starting critical syntax error fixes...');

criticalFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixCriticalSyntaxErrors(fullPath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('✅ Critical syntax error fixes completed!');
console.log('📝 Note: Some complex syntax errors may need manual fixing.');
