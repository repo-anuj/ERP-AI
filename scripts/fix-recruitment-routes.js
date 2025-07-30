#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findProblematicRoutes(dir) {
  const routes = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      routes.push(...findProblematicRoutes(fullPath));
    } else if (item === 'route.ts' && (fullPath.includes('recruitment') || fullPath.includes('onboarding'))) {
      routes.push(fullPath);
    }
  }

  return routes;
}

function fixProblematicRoute(filePath) {
  try {
    console.log(`🔧 Fixing ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix 1: Replace PrismaClient import with shared prisma import
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
    
    // Fix 2: Remove await from cookies() calls
    if (content.includes('const cookieStore = await cookies()')) {
      content = content.replace(/const\s+cookieStore\s*=\s*await\s+cookies\(\);?/g, 'const cookieStore = cookies();');
      hasChanges = true;
      console.log(`  ✓ Fixed async cookies() calls`);
    }
    
    // Fix 3: Remove malformed authentication comments and extra braces
    if (content.includes('// Authentication already handled above')) {
      content = content.replace(/\s*\/\/\s*Authentication\s+already\s+handled\s+above[^}]*\}\s*/g, '');
      hasChanges = true;
      console.log(`  ✓ Removed malformed authentication comments`);
    }
    
    // Fix 4: Ensure proper imports are present
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
    
    // Fix 5: Ensure dynamic export is present
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      // Find the last import statement
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
    
    // Fix 6: Standardize error responses to use NextResponse instead of NextResponse.json for simple errors
    content = content.replace(
      /return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]([^'"]+)['"]\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\);?/g,
      "return new NextResponse('$1', { status: $2 });"
    );
    
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
console.log('🔍 Finding problematic API routes...');

const routes = findProblematicRoutes(apiDir);
console.log(`📁 Found ${routes.length} problematic routes`);

if (routes.length === 0) {
  console.log('❌ No problematic routes found');
  process.exit(1);
}

console.log('🔧 Fixing problematic routes...');
routes.forEach(fixProblematicRoute);

console.log('✅ Done! All problematic routes have been fixed.');
