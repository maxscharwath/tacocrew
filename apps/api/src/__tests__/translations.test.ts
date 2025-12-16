/**
 * Backend translation key validation test
 * Ensures all translation keys used in code exist in all locale files
 */

import { describe, test } from 'bun:test';

interface TranslationUsage {
  key: string;
  file: string;
  line: number;
}

/**
 * Extract translation keys from code files
 */
async function extractTranslationKeys(files: string[]): Promise<TranslationUsage[]> {
  const usages: TranslationUsage[] = [];
  const pattern = /\bt\(['"]([^'"]+)['"]/g;

  await Promise.all(
    files.map(async (file) => {
      try {
        const fileContent = Bun.file(file);
        const content = await fileContent.text();
        const lines = content.split('\n');

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum]!;
          const matches = Array.from(line.matchAll(pattern));
          for (const match of matches) {
            const key = match[1];
            if (key) {
              usages.push({
                key: key.trim(),
                file,
                line: lineNum + 1,
              });
            }
          }
        }
      } catch (_error) {
        // Skip files that can't be read
      }
    })
  );

  return usages;
}

/**
 * Check if a key exists in translation object
 */
function keyExists(obj: unknown, key: string): boolean {
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return false;
    }
  }

  return true;
}

describe('Backend Translation Keys', () => {
  test('should have all translation keys present in all locale files', async () => {
    const cwd = process.cwd();
    const apiSrc = `${cwd}/apps/api/src`;
    const localeDir = `${cwd}/apps/api/src/locales`;

    // Find all TypeScript files using Bun's glob
    const globPattern = `${apiSrc}/**/*.ts`;
    const codeFiles: string[] = [];
    const glob = new Bun.Glob(globPattern);
    for await (const file of glob.scan('.')) {
      const fullPath = `${cwd}/${file}`;
      if (
        !fullPath.includes('.test.') &&
        !fullPath.includes('__tests__') &&
        !fullPath.includes('test-setup.ts') &&
        !fullPath.includes('node_modules')
      ) {
        codeFiles.push(fullPath);
      }
    }

    // Extract translation keys from code
    const usages = await extractTranslationKeys(codeFiles);

    // Group by key
    const keyUsages = new Map<string, TranslationUsage[]>();
    for (const usage of usages) {
      const existing = keyUsages.get(usage.key) || [];
      existing.push(usage);
      keyUsages.set(usage.key, existing);
    }

    // Load all locale files
    const locales: Record<string, unknown> = {};
    const localeGlob = new Bun.Glob('*.json');

    for await (const file of localeGlob.scan(localeDir)) {
      const lang = file.replace('.json', '');
      const fileContent = Bun.file(`${localeDir}/${file}`);
      const parsed = await fileContent.json();
      // Backend uses 'translation' namespace
      locales[lang] = parsed.translation || parsed;
    }

    // Check for missing keys
    const missingKeys: Array<{ key: string; missingIn: string[]; usedIn: string }> = [];
    for (const [key, usageList] of Array.from(keyUsages.entries())) {
      const missingIn: string[] = [];
      for (const [lang, translations] of Object.entries(locales)) {
        if (!keyExists(translations, key)) {
          missingIn.push(lang);
        }
      }
      if (missingIn.length > 0) {
        const firstUsage = usageList[0]!;
        const relPath = firstUsage.file.replace(process.cwd() + '/', '');
        missingKeys.push({
          key,
          missingIn,
          usedIn: `${relPath}:${firstUsage.line}`,
        });
      }
    }

    if (missingKeys.length > 0) {
      const message = `Missing translation keys found:\n${missingKeys
        .map(
          ({ key, missingIn, usedIn }) =>
            `  - ${key} (missing in: ${missingIn.join(', ')}, used in: ${usedIn})`
        )
        .join('\n')}\n\nRun 'bun check:translations' for more details.`;
      throw new Error(message);
    }
  });
});
