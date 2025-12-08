#!/usr/bin/env bun
/**
 * Translation key validation script
 * Checks for missing translation keys in both frontend and backend
 */

import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

type Locales = Record<string, unknown>;

// Get nested value from object by dot-notation key
function getValue(obj: unknown, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

// Get all keys from nested object
function getAllKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [];
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Load locale files
async function loadLocales(localeDir: string, useNamespace = false): Promise<Locales> {
  const locales: Locales = {};
  for (const file of readdirSync(localeDir).filter((f) => f.endsWith('.json'))) {
    const lang = file.replace('.json', '');
    const content = await Bun.file(join(localeDir, file)).json();
    locales[lang] = useNamespace
      ? (content as { translation?: unknown }).translation || content
      : content;
  }
  return locales;
}

// Find code files
async function findFiles(
  srcDir: string,
  extensions: string[],
  exclude: string[]
): Promise<string[]> {
  const files: string[] = [];
  const glob = new Bun.Glob(join(srcDir, `**/*.{${extensions.join(',')}}`));
  for await (const file of glob.scan('.')) {
    const path = resolve(process.cwd(), file);
    if (!exclude.some((e) => path.includes(e))) files.push(path);
  }
  return files;
}

// Extract translation keys from code
async function extractKeys(files: string[]): Promise<{
  static: Map<string, Array<{ file: string; line: number }>>;
  dynamic: Map<string, Array<{ file: string; line: number }>>;
}> {
  const staticKeys = new Map<string, Array<{ file: string; line: number }>>();
  const dynamicPrefixes = new Map<string, Array<{ file: string; line: number }>>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const lines = (await Bun.file(file).text()).split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          // Static: t('key') or t("key") or t(`key`)
          for (const match of Array.from(line.matchAll(/\bt\(['"`]([^'"`${]+)['"`]/g))) {
            const key = match[1]?.trim();
            if (key && !key.includes('${')) {
              const existing = staticKeys.get(key) || [];
              existing.push({ file, line: i + 1 });
              staticKeys.set(key, existing);
            }
          }
          // Dynamic: t(`prefix.${var}`)
          for (const match of Array.from(line.matchAll(/\bt\(`([^`]*?)\$\{[^}]+\}/g))) {
            const prefix = match[1]?.trim().replace(/\.$/, '');
            if (prefix) {
              const existing = dynamicPrefixes.get(prefix) || [];
              existing.push({ file, line: i + 1 });
              dynamicPrefixes.set(prefix, existing);
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    })
  );

  return { static: staticKeys, dynamic: dynamicPrefixes };
}

function checkMissingStatic(
  staticKeys: Map<string, Array<{ file: string; line: number }>>,
  locales: Record<string, unknown>
) {
  const pluralSuffixes = ['_zero', '_one', '_two', '_few', '_many', '_other'];
  const missingStatic: Array<{
    key: string;
    missingIn: string[];
    usedIn: Array<{ file: string; line: number }>;
  }> = [];

  for (const [key, usedIn] of Array.from(staticKeys.entries())) {
    const hasPluralVariants = pluralSuffixes.some((suffix) => staticKeys.has(`${key}${suffix}`));
    if (hasPluralVariants) continue;

    const missingIn = Object.keys(locales).filter((lang) => {
      const keyExists = getValue(locales[lang], key) !== undefined;
      const hasPluralVariantsInLocale = pluralSuffixes.some(
        (suffix) => getValue(locales[lang], `${key}${suffix}`) !== undefined
      );
      return !keyExists && !hasPluralVariantsInLocale;
    });

    if (missingIn.length > 0) {
      missingStatic.push({ key, missingIn, usedIn });
    }
  }

  return missingStatic;
}

function checkMissingDynamic(
  dynamicPrefixes: Map<string, Array<{ file: string; line: number }>>,
  locales: Record<string, unknown>
) {
  const missingDynamic: Array<{
    prefix: string;
    missingKeys: string[];
    usedIn: Array<{ file: string; line: number }>;
  }> = [];

  const firstLang = Object.keys(locales)[0];
  if (!firstLang) return missingDynamic;

  for (const [prefix, usedIn] of Array.from(dynamicPrefixes.entries())) {
    const refKeys = getAllKeys(getValue(locales[firstLang], prefix), prefix);
    if (refKeys.length === 0) continue;

    const missing = new Set<string>();
    for (const [lang, translations] of Object.entries(locales)) {
      if (lang === firstLang) continue;
      const langKeys = getAllKeys(getValue(translations, prefix), prefix);
      refKeys.filter((k) => !langKeys.includes(k)).forEach((k) => missing.add(k));
    }

    if (missing.size > 0) {
      missingDynamic.push({ prefix, missingKeys: Array.from(missing), usedIn });
    }
  }

  return missingDynamic;
}

// Validate translations
async function validate(
  srcDir: string,
  localeDir: string,
  extensions: string[],
  exclude: string[],
  useNamespace = false
) {
  const files = await findFiles(srcDir, extensions, exclude);
  const { static: staticKeys, dynamic: dynamicPrefixes } = await extractKeys(files);
  const locales = await loadLocales(localeDir, useNamespace);

  const missingStatic = checkMissingStatic(staticKeys, locales);
  const missingDynamic = checkMissingDynamic(dynamicPrefixes, locales);

  return { missingStatic, missingDynamic };
}

function printMissingStatic(
  missingStatic: Array<{
    key: string;
    missingIn: string[];
    usedIn: Array<{ file: string; line: number }>;
  }>
) {
  if (missingStatic.length === 0) return;

  console.log(`\n❌ ${missingStatic.length} missing static key(s):\n`);
  for (const { key, missingIn, usedIn } of missingStatic) {
    console.log(`  ${key} (missing in: ${missingIn.join(', ')})`);
    for (const u of usedIn.slice(0, 2)) {
      console.log(`    ${u.file.replace(process.cwd() + '/', '')}:${u.line}`);
    }
    if (usedIn.length > 2) {
      console.log(`    ... ${usedIn.length - 2} more`);
    }
  }
}

function printMissingDynamic(
  missingDynamic: Array<{
    prefix: string;
    missingKeys: string[];
    usedIn: Array<{ file: string; line: number }>;
  }>
) {
  if (missingDynamic.length === 0) return;

  console.log(`\n⚠️  ${missingDynamic.length} dynamic pattern(s) with missing keys:\n`);
  for (const { prefix, missingKeys } of missingDynamic) {
    console.log(`  t(\`${prefix}.\${var}\`) - ${missingKeys.length} missing:`);
    for (const key of missingKeys.slice(0, 3)) {
      console.log(`    ${key}`);
    }
    if (missingKeys.length > 3) {
      console.log(`    ... ${missingKeys.length - 3} more`);
    }
  }
}

// Print results
function print(name: string, result: Awaited<ReturnType<typeof validate>>) {
  console.log(`\n${name}:`);

  printMissingStatic(result.missingStatic);
  printMissingDynamic(result.missingDynamic);

  if (result.missingStatic.length === 0 && result.missingDynamic.length === 0) {
    console.log('✅ All keys present!\n');
  }
}

// Main
async function main() {
  console.log('🔍 Checking translations...\n');

  const frontend = await validate(
    resolve('apps/web/src'),
    resolve('apps/web/src/locales'),
    ['ts', 'tsx'],
    ['.test.', '__tests__', 'node_modules']
  );
  print('📱 Frontend', frontend);

  const backend = await validate(
    resolve('apps/api/src'),
    resolve('apps/api/src/locales'),
    ['ts'],
    ['.test.', '__tests__', 'test-setup.ts', 'node_modules'],
    true
  );
  print('🔧 Backend', backend);

  const total = frontend.missingStatic.length + backend.missingStatic.length;
  const dynamic = frontend.missingDynamic.length + backend.missingDynamic.length;

  console.log('='.repeat(50));
  console.log(`Summary: ${total} missing static, ${dynamic} dynamic issues`);
  console.log('='.repeat(50));

  if (total > 0 || dynamic > 0) {
    process.exit(1);
  } else {
    console.log('\n✅ All complete!');
  }
}

main();
