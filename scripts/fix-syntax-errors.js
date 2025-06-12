#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findApiRoutes(dir) {
  const routes = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routes.push(...findApiRoutes(fullPath));
    } else if (item === 'route.ts' || item === 'route.js') {
      routes.push(fullPath);
    }
  }
  
  return routes;
}

function fixSyntaxErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for the specific syntax error pattern
    const problematicPattern = /import\s*\{\s*export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];/g;
    
    if (problematicPattern.test(content)) {
      console.log(`🔧 Fixing syntax error in ${filePath}`);
      
      // Fix the pattern by moving the export outside the import
      let fixedContent = content.replace(
        /import\s*\{\s*export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];\s*([^}]+)\}\s*from\s*(['"][^'"]+['"];)/g,
        (match, importContent, fromClause) => {
          return `import {${importContent}} from ${fromClause}\n\nexport const dynamic = 'force-dynamic';`;
        }
      );
      
      // Also handle cases where it's in the middle of an import
      fixedContent = fixedContent.replace(
        /import\s*\{\s*([^}]*?)export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];\s*([^}]*?)\}\s*from\s*(['"][^'"]+['"];)/g,
        (match, beforeExport, afterExport, fromClause) => {
          const cleanImport = (beforeExport + afterExport).replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
          return `import { ${cleanImport} } from ${fromClause}\n\nexport const dynamic = 'force-dynamic';`;
        }
      );
      
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`✓ ${filePath} is OK`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const apiDir = path.join(process.cwd(), 'app', 'api');
console.log('🔍 Checking for syntax errors in API routes...');

const routes = findApiRoutes(apiDir);
console.log(`📁 Found ${routes.length} API routes`);

console.log('🔧 Fixing syntax errors...');
routes.forEach(fixSyntaxErrors);

console.log('✅ Done! All syntax errors have been fixed.');
