/**
 * Shared utilities for HTML parsing
 * @module gigatacos-client/parsers/shared
 */

import { load } from 'cheerio';

// Infer Cheerio selection type from actual usage (result of .find(), .first(), etc.)
const _$test = load('<div></div>');
const _$selection = _$test('div').first();
export type CheerioSelection = typeof _$selection;

export function nameToSlug(name: string): string {
  return name
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll('&', 'et')
    .replaceAll(/\s+/g, '_')
    .replaceAll(/[^a-z0-9_]/g, '')
    .replaceAll(/_+/g, '_')
    .replaceAll(/^_|_$/g, '');
}

export function findIdByName(
  name: string,
  stockData: Array<{ code: string; in_stock: boolean }> | Record<string, unknown> | undefined
): string | null {
  if (!stockData) return null;

  // Convert Record to array if needed
  const stockArray = Array.isArray(stockData)
    ? stockData
    : Object.keys(stockData).map((code) => ({ code, in_stock: true }));

  const slug = nameToSlug(name);
  const exactMatch = stockArray.find((item) => item.code === slug);
  if (exactMatch) return exactMatch.code;

  const lowerMatch = stockArray.find((item) => item.code.toLowerCase() === slug);
  if (lowerMatch) return lowerMatch.code;

  const parts = slug.split('_');
  for (const part of parts) {
    if (part.length > 3) {
      const partialMatch = stockArray.find(
        (item) => item.code.includes(part) || part.includes(item.code)
      );
      if (partialMatch) return partialMatch.code;
    }
  }
  return null;
}

export function findLabeledParagraph($scope: CheerioSelection, labels: string[]): CheerioSelection {
  let $p = $scope.find(labels.map((l) => `p:has(strong:contains("${l}"))`).join(', ')).first();
  if ($p.length) return $p;
  $p = $scope.find(labels.map((l) => `p:contains("${l}")`).join(', ')).first();
  const el = $p.get(0) as { tagName?: string } | undefined;
  if (el?.tagName && el.tagName !== 'p') {
    const $closest = $p.closest('p');
    return $closest as unknown as CheerioSelection;
  }
  return $p;
}

export function extractValueAfterColonFromParagraph($p: CheerioSelection): string | null {
  if (!$p.length) return null;
  const text = $p.text().replaceAll(/\s+/g, ' ').trim();
  const idx = text.indexOf(':');
  if (idx < 0) return null;
  const after = text.slice(idx + 1).trim();
  return after || null;
}

export function parseListFromLabeledParagraph($scope: CheerioSelection, labels: string[]): string[] {
  const $p = findLabeledParagraph($scope, labels);
  const val = extractValueAfterColonFromParagraph($p);
  if (!val) return [];
  return val
    .split(/[,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isSansEntry(s: string): boolean {
  const n = s.toLowerCase();
  return n === 'sans' || n === 'sans garniture' || n === 'sans sauce';
}

export function isRealTacoTitle(title: string): boolean {
  return /(^|\s)tacos(\s|$)/i.test(title);
}

