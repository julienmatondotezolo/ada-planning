#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'node_modules', 'ada-design-system', 'dist');

function fixImports(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Count replacements to track progress
      const before = content.match(/@\/lib\/utils/g);
      const replacementCount = before ? before.length : 0;
      
      if (replacementCount > 0) {
        // Replace @/lib/utils with ../../lib/utils
        content = content.replace(/@\/lib\/utils/g, '../../lib/utils');
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${replacementCount} imports in ${path.basename(filePath)}`);
        return replacementCount;
      }
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

// Find all .js files in the dist directory that might have the import issue
function findAndFixFiles(dir) {
  try {
    if (!fs.existsSync(dir)) {
      return 0;
    }
    
    const files = fs.readdirSync(dir);
    let totalFixed = 0;
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          totalFixed += findAndFixFiles(filePath);
        } else if (file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('@/lib/utils')) {
            totalFixed += fixImports(filePath);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
    
    return totalFixed;
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
    return 0;
  }
}

console.log('🔧 Checking ada-design-system import issues...');

if (fs.existsSync(packagePath)) {
  const fixedCount = findAndFixFiles(packagePath);
  
  if (fixedCount > 0) {
    console.log(`✅ Fixed ${fixedCount} import issues in ada-design-system package`);
  } else {
    console.log('✅ No import issues found - package already fixed!');
  }
} else {
  console.log('⚠️  ada-design-system not found in node_modules - will be installed during build');
  
  // Exit successfully even if package not found yet (during install process)
  process.exit(0);
}