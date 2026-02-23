#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'node_modules', 'ada-design-system', 'dist');

function fixImports(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace @/lib/utils with ../../lib/utils
    content = content.replace(/@\/lib\/utils/g, '../../lib/utils');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${filePath}`);
  }
}

// Find all .js files in the dist directory that might have the import issue
function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAndFixFiles(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('@/lib/utils')) {
        fixImports(filePath);
      }
    }
  }
}

if (fs.existsSync(packagePath)) {
  console.log('Fixing ada-design-system import issues...');
  findAndFixFiles(packagePath);
  console.log('Done!');
} else {
  console.log('ada-design-system not found in node_modules');
}