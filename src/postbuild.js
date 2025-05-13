// src/postbuild.js
/**
 * This script runs after the TypeScript build and fixes any issues with the compiled files
 * to ensure compatibility with ESM modules in Node.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory with the compiled files
const distDir = path.resolve(__dirname, '../dist');

/**
 * Recursively process all JavaScript files in a directory
 */
async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      await fixImports(fullPath);
    }
  }
}

/**
 * Fix imports in a JavaScript file by ensuring .js extensions are present
 */
async function fixImports(filePath) {
  console.log(`Processing: ${filePath}`);
  
  // Read the file content
  let content = await fs.readFile(filePath, 'utf8');
  
  // Fix imports that are missing .js extension
  // This regex matches import statements and checks if they reference local files without .js extension
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  content = content.replace(importRegex, (match, importPath) => {
    // Only add .js extension to relative imports that don't already have an extension
    if ((importPath.startsWith('./') || importPath.startsWith('../')) && 
        !path.extname(importPath)) {
      return `from '${importPath}.js'`;
    }
    return match;
  });
  
  // Write the modified content back to the file
  await fs.writeFile(filePath, content, 'utf8');
}

// Main function
async function main() {
  try {
    console.log('Post-build script: Fixing ESM imports...');
    await processDirectory(distDir);
    console.log('Post-build script: Done fixing imports');
  } catch (error) {
    console.error('Error in post-build script:', error);
    process.exit(1);
  }
}

main();