/**
 * HTML parser for owt.php endpoint (taco cards)
 * @module gigatacos-client/parsers/taco-cards
 */

import { load } from 'cheerio';
import type { Logger, StockAvailability, Taco } from '../types';
import { TacoSize } from '../types';
import { noopLogger } from '../utils/logger';
import { deterministicUUID } from '../utils/uuid';
import {
  type CheerioSelection,
  extractValueAfterColonFromParagraph,
  findIdByName,
  findLabeledParagraph,
  isRealTacoTitle,
  isSansEntry,
  nameToSlug,
  parseListFromLabeledParagraph,
} from './shared.utils';

/**
 * Parse size from taco title
 */
function parseSizeFromTitle(title: string): TacoSize | null {
  if (/tacos\s+L\s+mixte/i.test(title)) {
    return TacoSize.L_MIXTE;
  }
  const match = /tacos\s+(XL|XXL|L|BOWL|GIGA)\b/i.exec(title);
  const variant = match?.[1]?.toUpperCase();
  if (!variant) return null;
  return variant === 'L' ? TacoSize.L : (('tacos_' + variant) as TacoSize);
}

/**
 * Parse price from taco title
 */
function parsePriceFromTitle(title: string): number {
  const match = /-\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:CHF|EUR|€|\$)\.?/i.exec(title);
  return match?.[1] ? Number.parseFloat(match[1].replace(',', '.')) : 0;
}

/**
 * Parse meat items with quantity support
 */
function parseMeats(
  $body: CheerioSelection,
  stockData?: StockAvailability
): Array<{ id: string; name: string; quantity: number }> {
  const meats: Array<{ id: string; name: string; quantity: number }> = [];
  const values = parseListFromLabeledParagraph($body, ['Viande', 'Viande(s)']);

  for (const part of values) {
    const match = /^(.+?)\s+x\s*(\d+)$/i.exec(part);
    const meatName = (match?.[1] ?? part).trim();
    if (!meatName || /^sans(_?viande)?$/i.test(meatName)) continue;

    const quantity = match?.[2] ? Math.max(1, Number.parseInt(match[2], 10) || 1) : 1;
    let meatId = nameToSlug(meatName);

    if (stockData?.meats) {
      const found = findIdByName(meatName, stockData.meats);
      if (found) meatId = found;
    }

    meats.push({ id: meatId, name: meatName, quantity });
  }

  return meats;
}

/**
 * Parse simple ingredient lists (sauces or garnitures)
 */
function parseSimpleIngredients(
  $body: CheerioSelection,
  labels: string[],
  stockKey: 'sauces' | 'garnitures',
  stockData?: StockAvailability
): Array<{ id: string; name: string }> {
  const items: Array<{ id: string; name: string }> = [];
  const values = parseListFromLabeledParagraph($body, labels);

  for (const value of values) {
    const name = value.trim();
    if (!name || isSansEntry(name)) continue;

    let itemId = nameToSlug(name);
    const stock = stockData?.[stockKey];
    if (stock) {
      const found = findIdByName(name, stock);
      if (found) itemId = found;
    }

    items.push({ id: itemId, name });
  }

  return items;
}

/**
 * Transform ingredients to final structure with UUIDs
 */
function transformIngredients<T extends { id: string; name: string }>(
  items: T[],
  category: string
): Array<T & { id: string }> {
  return items.map((item) => ({
    ...item,
    id: deterministicUUID(item.id || item.name, category),
  }));
}

export function parseTacoCard(
  html: string,
  tacoId: string,
  stockData?: StockAvailability,
  logger: Logger = noopLogger
): Taco | null {
  try {
    if (!html) return null;

    const $ = load(html);
    const $card = $('div.card[id^="tacos-"]').first();
    if (!$card.length) return null;

    const $body = $card.find('.card-body').first();
    const title = $body.find('.card-title, h6, h5').first().text().replaceAll(/\s+/g, ' ').trim();

    // Parse components using helper functions
    let size = parseSizeFromTitle(title);
    const price = parsePriceFromTitle(title);
    const meats = parseMeats($body, stockData);
    const sauces = parseSimpleIngredients($body, ['Sauce', 'Sauces'], 'sauces', stockData);
    const garnitures = parseSimpleIngredients($body, ['Garniture', 'Garnitures'], 'garnitures', stockData);

    // Parse note
    const noteText = extractValueAfterColonFromParagraph(findLabeledParagraph($body, ['Remarque']));
    const note = noteText || undefined;

    // Validation
    const hasIngredients = meats.length + sauces.length + garnitures.length > 0;
    if ((!isRealTacoTitle(title) && !size) || (!hasIngredients && price === 0)) {
      return null;
    }

    // Fallback size
    if (!size && isRealTacoTitle(title)) {
      size = TacoSize.L;
    }

    // Transform to final structure
    return {
      id: tacoId,
      size: size as TacoSize,
      meats: transformIngredients(meats, 'meats'),
      sauces: transformIngredients(sauces, 'sauces'),
      garnitures: transformIngredients(garnitures, 'garnitures'),
      note,
      price,
    };
  } catch (error) {
    logger.error('Failed to parse taco card HTML', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return null;
  }
}

/**
 * Parse multiple taco cards from HTML using a mapping
 */
export function parseTacoCards(
  html: string,
  mapping: Map<number, string>,
  stockData?: StockAvailability,
  logger: Logger = noopLogger
): Taco[] {
  const tacos = parseCategorySummaryFromTacos(html, stockData, logger);
  return tacos.map((taco, index) => {
    const mappedId = mapping.get(index);
    return mappedId ? { ...taco, id: mappedId } : taco;
  });
}

export function parseCategorySummaryFromTacos(
  html: string,
  stockData?: StockAvailability,
  logger: Logger = noopLogger
): Taco[] {
  try {
    const $ = load(html);
    const tacos: Taco[] = [];

    const $cards = $('div.card[id^="tacos-"]');
    const ids: number[] = [];
    $cards.each((_, el) => {
      const idAttr = $(el).attr('id') || '';
      const match = new RegExp(/tacos-(\d+)/).exec(idAttr);
      const identifier = match?.[1];
      if (identifier) {
        ids.push(Number.parseInt(identifier, 10));
      }
    });
    ids.sort((a, b) => a - b);

    for (const idx of ids) {
      const $card = $(`div.card#tacos-${idx}`);
      const rawHtml = $.html($card);
      if (rawHtml == null) {
        continue;
      }
      const htmlContent: string = rawHtml;
      // Generate a temporary UUID for parsing - will be replaced by mapping if provided
      const tempId = deterministicUUID(`temp-taco-${idx}`, 'meats');
      const parsed = parseTacoCard(htmlContent as unknown as string, tempId, stockData, logger);
      if (parsed) tacos.push(parsed);
    }

    logger.info('Parsed tacos from owt.php HTML', {
      count: tacos.length,
      ids,
    });

    return tacos;
  } catch (error) {
    logger.error('Failed to parse category summary from tacos HTML', { error });
    return [];
  }
}

