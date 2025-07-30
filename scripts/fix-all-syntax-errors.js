#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findAllRoutes(dir) {
  const routes = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routes.push(...findAllRoutes(fullPath));
    } else if (item === 'route.ts') {
      routes.push(fullPath);
    }
  }
  
  return routes;
}

function fixSyntaxErrors(filePath) {
  try {
    console.log(`🔧 Fixing ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix 1: Remove malformed authentication comments and extra braces
    const malformedPatterns = [
      /\s*\/\/\s*Authentication\s+already\s+handled\s+above[^}]*\}\s*/g,
      /\s*\/\/\s*Authentication\s+already\s+handled\s+above[^;]*;\s*\}\s*/g,
      /\s*\/\/\s*Authentication\s+already\s+handled\s+above[^)]*\);\s*\}\s*/g,
    ];
    
    malformedPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        hasChanges = true;
      }
    });
    
    // Fix 2: Remove orphaned closing braces that break try-catch blocks
    const lines = content.split('\n');
    const fixedLines = [];
    let inTryBlock = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Track try blocks
      if (trimmedLine.includes('try {')) {
        inTryBlock = true;
        braceCount = 1;
        fixedLines.push(line);
        continue;
      }
      
      // Track braces in try blocks
      if (inTryBlock) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // If we hit a catch/finally, we're good
        if (trimmedLine.includes('} catch') || trimmedLine.includes('} finally')) {
          inTryBlock = false;
          braceCount = 0;
          fixedLines.push(line);
          continue;
        }
        
        // If we have an orphaned closing brace that would break the try block
        if (braceCount <= 0 && trimmedLine === '}' && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // Skip this orphaned brace if the next line is not catch/finally
          if (!nextLine.includes('catch') && !nextLine.includes('finally')) {
            console.log(`  ✓ Removed orphaned closing brace at line ${i + 1}`);
            hasChanges = true;
            continue;
          }
        }
      }
      
      fixedLines.push(line);
    }
    
    if (hasChanges) {
      content = fixedLines.join('\n');
    }
    
    // Fix 3: Replace PrismaClient import with shared prisma import
    if (content.includes('import { PrismaClient }') && content.includes('const prisma = new PrismaClient()')) {
      content = content.replace(
        /import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@\/prisma\/client['"];\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\);?/g,
        "import { prisma } from '@/lib/prisma';"
      );
      content = content.replace(
        /import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"];\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\);?/g,
        "import { prisma } from '@/lib/prisma';"
      );
      hasChanges = true;
      console.log(`  ✓ Fixed PrismaClient import`);
    }
    
    // Fix 4: Remove await from cookies() calls
    if (content.includes('const cookieStore = await cookies()')) {
      content = content.replace(/const\s+cookieStore\s*=\s*await\s+cookies\(\);?/g, 'const cookieStore = cookies();');
      hasChanges = true;
      console.log(`  ✓ Fixed async cookies() calls`);
    }
    
    // Fix 5: Ensure proper imports are present
    if (!content.includes("import { cookies }") && content.includes("cookies()")) {
      content = content.replace(
        /(import\s*\{\s*NextRequest,\s*NextResponse\s*\}\s*from\s*['"]next\/server['"];?\s*)/,
        "$1import { cookies } from 'next/headers';\n"
      );
      hasChanges = true;
      console.log(`  ✓ Added missing cookies import`);
    }
    
    if (!content.includes("import { verifyAuth }") && content.includes("verifyAuth(")) {
      content = content.replace(
        /(import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"];?\s*)/,
        "$1import { verifyAuth } from '@/lib/auth';\n"
      );
      hasChanges = true;
      console.log(`  ✓ Added missing verifyAuth import`);
    }
    
    // Fix 6: Ensure dynamic export is present
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';", "export const runtime = 'nodejs';");
      content = lines.join('\n');
      hasChanges = true;
      console.log(`  ✓ Added dynamic export`);
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Successfully fixed ${filePath}`);
    } else {
      console.log(`✓ ${filePath} is already correct`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
const apiDir = path.join(process.cwd(), 'app', 'api');
console.log('🔍 Finding all API routes...');

const routes = findAllRoutes(apiDir);
console.log(`📁 Found ${routes.length} API routes`);

if (routes.length === 0) {
  console.log('❌ No API routes found');
  process.exit(1);
}

console.log('🔧 Fixing all API routes...');
routes.forEach(fixSyntaxErrors);

console.log('✅ Done! All API routes have been fixed.');
