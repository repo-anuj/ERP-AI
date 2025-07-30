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

function fixNextAuthImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file imports next-auth
    if (content.includes('next-auth') || content.includes('getServerSession')) {
      console.log(`🔧 Fixing NextAuth imports in ${filePath}`);
      
      let fixedContent = content;
      
      // Replace next-auth imports
      fixedContent = fixedContent.replace(
        /import\s*\{\s*getServerSession\s*\}\s*from\s*['"]next-auth['"];?\s*/g,
        ''
      );
      
      fixedContent = fixedContent.replace(
        /import\s*\{\s*authOptions\s*\}\s*from\s*['"]@\/lib\/auth['"];?\s*/g,
        ''
      );
      
      // Add correct imports if not already present
      if (!fixedContent.includes('import { cookies }')) {
        fixedContent = fixedContent.replace(
          /(import\s*\{\s*NextRequest,\s*NextResponse\s*\}\s*from\s*['"]next\/server['"];?\s*)/,
          '$1import { cookies } from \'next/headers\';\n'
        );
      }
      
      if (!fixedContent.includes('import { verifyAuth }')) {
        fixedContent = fixedContent.replace(
          /(import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"];?\s*)/,
          '$1import { verifyAuth } from \'@/lib/auth\';\n'
        );
      }
      
      // Add export statements if not present
      if (!fixedContent.includes('export const dynamic')) {
        fixedContent = fixedContent.replace(
          /(const prisma = new PrismaClient\(\);?\s*)/,
          '$1\nexport const dynamic = \'force-dynamic\';\nexport const runtime = \'nodejs\';\n'
        );
      }
      
      // Replace getServerSession usage
      fixedContent = fixedContent.replace(
        /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);?\s*/g,
        `const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }

    `
      );
      
      // Replace session checks
      fixedContent = fixedContent.replace(
        /if\s*\(\s*!session\?\.\w+\?\.\w+\s*\)\s*\{[^}]*\}/g,
        '// Authentication already handled above'
      );
      
      // Replace session.user.companyId references
      fixedContent = fixedContent.replace(
        /session\.user\.companyId/g,
        'user.companyId'
      );
      
      // Replace session.user references
      fixedContent = fixedContent.replace(
        /session\.user/g,
        'user'
      );
      
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`✓ ${filePath} is OK (no NextAuth imports)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const apiDir = path.join(process.cwd(), 'app', 'api');
console.log('🔍 Checking for NextAuth imports in API routes...');

const routes = findApiRoutes(apiDir);
console.log(`📁 Found ${routes.length} API routes`);

console.log('🔧 Fixing NextAuth imports...');
routes.forEach(fixNextAuthImports);

console.log('✅ Done! All NextAuth imports have been fixed.');
