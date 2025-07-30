#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with syntax errors that need fixing
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
  'app/api/hr/recruitment/offers/route.ts',
  'app/api/push/send/route.ts',
  'app/api/push/subscribe/route.ts',
  'app/api/push/unsubscribe/route.ts',
  'app/hr/recruitment/onboarding/page.tsx'
];

function fixSyntaxErrors(filePath) {
  try {
    console.log(`🔧 Fixing ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix common syntax patterns
    const fixes = [
      // Fix missing closing braces for if statements
      {
        pattern: /(\s+if\s*\([^)]+\)\s*\{\s*return[^}]+;\s*)\n(\s+[^}])/g,
        replacement: '$1}\n$2',
        description: 'Add missing closing brace for if statement'
      },
      
      // Fix extra parentheses after return statements
      {
        pattern: /return new NextResponse\([^)]+\);\s*\}\);/g,
        replacement: (match) => match.replace('});', '}'),
        description: 'Remove extra parenthesis after return statement'
      },
      
      // Fix malformed try-catch blocks
      {
        pattern: /(\s+}\s*catch\s*\([^)]+\)\s*\{[^}]+}\s*)\n(\s*}\s*\n\s*\/\/[^\n]*\n\s*export)/g,
        replacement: '$1\n$2',
        description: 'Fix malformed try-catch blocks'
      }
    ];

    fixes.forEach(fix => {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== originalContent) {
        console.log(`  ✅ Applied: ${fix.description}`);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  💾 Saved changes to ${filePath}`);
    } else {
      console.log(`  ℹ️  No changes needed for ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Starting batch syntax error fixes...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixSyntaxErrors(fullPath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('✅ Batch syntax error fixes completed!');
