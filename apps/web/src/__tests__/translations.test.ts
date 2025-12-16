/**
 * Frontend translation key validation test
 * Ensures all translation keys used in code exist in all locale files
 * Supports both static and dynamically generated keys
 */

import { describe, test } from 'bun:test';

interface TranslationUsage {
  key: string;
  file: string;
  line: number;
  isDynamic?: boolean;
  prefix?: string;
}

interface DynamicKeyPattern {
  prefix: string;
  usedIn: TranslationUsage[];
}

/**
 * Extract static translation keys from code files
 */
async function extractTranslationKeys(files: string[]): Promise<TranslationUsage[]> {
  const usages: TranslationUsage[] = [];
  const patterns = [
    // t('key') or t("key")
    /\bt\(['"]([^'"]+)['"]/g,
    // t(`key`) with template literals (simple strings only)
    /\bt\(`([^`${]+)`/g,
  ];

  await Promise.all(
    files.map(async (file) => {
      try {
        const fileContent = Bun.file(file);
        const content = await fileContent.text();
        const lines = content.split('\n');

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum]!;

          for (const pattern of patterns) {
            const matches = Array.from(line.matchAll(pattern));
            for (const match of matches) {
              const key = match[1];
              if (key && !key.includes('${')) {
                usages.push({
                  key: key.trim(),
                  file,
                  line: lineNum + 1,
                });
              }
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
 * Extract dynamic translation key patterns (e.g., `orders.create.${key}`)
 */
async function extractDynamicKeyPatterns(files: string[]): Promise<DynamicKeyPattern[]> {
  const patternMap = new Map<string, TranslationUsage[]>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const fileContent = Bun.file(file);
        const content = await fileContent.text();
        const lines = content.split('\n');

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum]!;

          // Match patterns like t(`prefix.${variable}`) or t(`prefix.${variable}.suffix`)
          const dynamicPattern = /\bt\(`([^`]*?)\$\{[^}]+}([^`]*?)`/g;
          const matches = Array.from(line.matchAll(dynamicPattern));

          for (const match of matches) {
            const fullMatch = match[0]!;
            const prefixPart = match[1] || '';
            // Extract the prefix (everything before ${variable})
            const prefix = prefixPart.trim().replace(/\.$/, '');

            if (prefix) {
              const existing = patternMap.get(prefix) || [];
              existing.push({
                key: fullMatch,
                file,
                line: lineNum + 1,
                isDynamic: true,
                prefix,
              });
              patternMap.set(prefix, existing);
            }
          }
        }
      } catch (_error) {
        // Skip files that can't be read
      }
    })
  );

  const patterns: DynamicKeyPattern[] = [];
  for (const [prefix, usages] of Array.from(patternMap.entries())) {
    patterns.push({ prefix, usedIn: usages });
  }

  return patterns;
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

/**
 * Get all keys from a translation JSON file
 */
function getTranslationKeys(obj: unknown, prefix = ''): string[] {
  const keys: string[] = [];

  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...getTranslationKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

/**
 * Get all keys under a prefix
 */
function getKeysUnderPrefix(obj: unknown, prefix: string): string[] {
  const parts = prefix.split('.');
  let current: unknown = obj;

  // Navigate to the prefix location
  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }

  // Get all keys under this prefix
  return getTranslationKeys(current, prefix);
}

async function loadLocaleFiles(localeDir: string): Promise<Record<string, unknown>> {
  const locales: Record<string, unknown> = {};
  const glob = new Bun.Glob('*.json');

  for await (const file of glob.scan(localeDir)) {
    const lang = file.replace('.json', '');
    const fileContent = Bun.file(`${localeDir}/${file}`);
    locales[lang] = await fileContent.json();
  }

  return locales;
}

function checkMissingStaticKeys(
  keyUsages: Map<string, TranslationUsage[]>,
  locales: Record<string, unknown>
): Array<{ key: string; missingIn: string[]; usedIn: string }> {
  const pluralSuffixes = ['_zero', '_one', '_two', '_few', '_many', '_other'];
  const missingKeys: Array<{ key: string; missingIn: string[]; usedIn: string }> = [];

  for (const [key, usageList] of Array.from(keyUsages.entries())) {
    const hasPluralVariants = pluralSuffixes.some((suffix) => keyUsages.has(`${key}${suffix}`));
    if (hasPluralVariants) continue;

    const missingIn: string[] = [];
    for (const [lang, translations] of Object.entries(locales)) {
      const keyExistsDirect = keyExists(translations, key);
      const hasPluralVariantsInLocale = pluralSuffixes.some((suffix) =>
        keyExists(translations, `${key}${suffix}`)
      );

      if (!keyExistsDirect && !hasPluralVariantsInLocale) {
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

  return missingKeys;
}

function validateDynamicKeyPatterns(
  dynamicPatterns: DynamicKeyPattern[],
  locales: Record<string, unknown>
): Array<{ prefix: string; missingKeys: string[] }> {
  const dynamicKeyIssues: Array<{ prefix: string; missingKeys: string[] }> = [];
  const firstLang = Object.keys(locales)[0];

  if (!firstLang) return dynamicKeyIssues;

  for (const { prefix } of dynamicPatterns) {
    const possibleKeys = getKeysUnderPrefix(locales[firstLang], prefix);
    const allMissing: string[] = [];

    for (const [lang, translations] of Object.entries(locales)) {
      if (lang === firstLang) continue;
      const langKeys = getKeysUnderPrefix(translations, prefix);
      const missing = possibleKeys.filter((key) => !langKeys.includes(key));
      allMissing.push(...missing);
    }

    if (allMissing.length > 0) {
      const uniqueMissing = Array.from(new Set(allMissing));
      dynamicKeyIssues.push({ prefix, missingKeys: uniqueMissing });
    }
  }

  return dynamicKeyIssues;
}

function buildErrorMessages(
  missingKeys: Array<{ key: string; missingIn: string[]; usedIn: string }>,
  dynamicKeyIssues: Array<{ prefix: string; missingKeys: string[] }>
): string[] {
  const errors: string[] = [];

  if (missingKeys.length > 0) {
    errors.push(
      `Missing static translation keys:\n${missingKeys
        .map(
          ({ key, missingIn, usedIn }) =>
            `  - ${key} (missing in: ${missingIn.join(', ')}, used in: ${usedIn})`
        )
        .join('\n')}`
    );
  }

  if (dynamicKeyIssues.length > 0) {
    errors.push(
      `Dynamic translation patterns with missing keys:\n${dynamicKeyIssues
        .map(
          ({ prefix, missingKeys: missing }) =>
            `  - Pattern: t(\`${prefix}.\${variable}\`) (missing: ${missing.slice(0, 3).join(', ')}${
              missing.length > 3 ? `, ...${missing.length - 3} more` : ''
            })`
        )
        .join('\n')}`
    );
  }

  return errors;
}

describe('Frontend Translation Keys', () => {
  test('should have all translation keys present in all locale files', async () => {
    // Determine paths based on whether we're running from project root or apps/web
    const cwd = process.cwd();
    const isInWebDir = cwd.endsWith('apps/web');
    const webSrc = isInWebDir ? `${cwd}/src` : `${cwd}/apps/web/src`;
    const localeDir = isInWebDir ? `${cwd}/src/locales` : `${cwd}/apps/web/src/locales`;

    // Find all TypeScript/TSX files using Bun's glob
    const globPattern = `${webSrc}/**/*.{ts,tsx}`;
    const codeFiles: string[] = [];
    const glob = new Bun.Glob(globPattern);
    for await (const file of glob.scan('.')) {
      const fullPath = `${cwd}/${file}`;
      if (
        !fullPath.includes('.test.') &&
        !fullPath.includes('__tests__') &&
        !fullPath.includes('node_modules')
      ) {
        codeFiles.push(fullPath);
      }
    }

    // Extract static translation keys from code
    const staticUsages = await extractTranslationKeys(codeFiles);
    const dynamicPatterns = await extractDynamicKeyPatterns(codeFiles);

    // Group static keys by key
    const keyUsages = new Map<string, TranslationUsage[]>();
    for (const usage of staticUsages) {
      const existing = keyUsages.get(usage.key) || [];
      existing.push(usage);
      keyUsages.set(usage.key, existing);
    }

    // Load all locale files
    const locales = await loadLocaleFiles(localeDir);

    // Check for missing static keys
    const missingKeys = checkMissingStaticKeys(keyUsages, locales);

    // Validate dynamic key patterns
    const dynamicKeyIssues = validateDynamicKeyPatterns(dynamicPatterns, locales);

    // Build error message
    const errors = buildErrorMessages(missingKeys, dynamicKeyIssues);

    if (errors.length > 0) {
      throw new Error(errors.join('\n\n') + '\n\nRun "bun check:translations" for more details.');
    }
  });
});
