import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { glob } from 'glob';

const SRC_DIR = resolve(process.cwd(), 'src');

function convertRelativeToAlias(importPath: string, currentFilePath: string): string {
  // Skip if already using alias or is an external package
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  // Get the directory of the current file
  const currentDir = dirname(currentFilePath);

  // Resolve the absolute path of the import
  const absolutePath = resolve(currentDir, importPath);

  // Get the path relative to src directory
  const relativeToSrc = relative(SRC_DIR, absolutePath);

  // If the path goes outside src directory, keep it as is
  if (relativeToSrc.startsWith('..')) {
    return importPath;
  }

  // Convert to @ alias
  return `@/${relativeToSrc}`;
}

function updateImportsInFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Match import statements with relative paths
  const importRegex = /from\s+['"](\..+?)['"]/g;

  const updatedContent = content.replace(importRegex, (match, importPath) => {
    const newPath = convertRelativeToAlias(importPath, filePath);
    if (newPath !== importPath) {
      modified = true;
      return match.replace(importPath, newPath);
    }
    return match;
  });

  if (modified) {
    writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`✓ Updated: ${relative(process.cwd(), filePath)}`);
  }

  return modified;
}

async function main() {
  const files = await glob('src/**/*.ts', {
    ignore: ['**/*.d.ts', '**/node_modules/**'],
  });

  let totalUpdated = 0;

  for (const file of files) {
    const filePath = resolve(process.cwd(), file);
    if (updateImportsInFile(filePath)) {
      totalUpdated++;
    }
  }

  console.log(`\n✨ Updated ${totalUpdated} files`);
}

main().catch(console.error);
