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

function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if dynamic export already exists
    if (content.includes('export const dynamic')) {
      console.log(`✓ ${filePath} already has dynamic export`);
      return;
    }
    
    // Find the first import statement
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('export const runtime')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Found empty line after imports
        break;
      }
    }
    
    // Insert the dynamic export
    const dynamicExport = "export const dynamic = 'force-dynamic';";
    
    if (insertIndex === 0) {
      // No imports found, add at the beginning
      lines.unshift(dynamicExport, '');
    } else {
      // Add after imports
      lines.splice(insertIndex, 0, dynamicExport);
    }
    
    // Also fix cookies() calls
    const updatedContent = lines.join('\n').replace(/const cookieStore = await cookies\(\);/g, 'const cookieStore = cookies();');
    
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✓ Updated ${filePath}`);
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
const apiDir = path.join(process.cwd(), 'app', 'api');
console.log('🔧 Finding API routes...');

const routes = findApiRoutes(apiDir);
console.log(`📁 Found ${routes.length} API routes`);

console.log('🚀 Adding dynamic exports...');
routes.forEach(addDynamicExport);

console.log('✅ Done! All API routes have been updated.');
