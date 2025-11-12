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
  extractValueAfterColonFromParagraph,
  findIdByName,
  findLabeledParagraph,
  isRealTacoTitle,
  isSansEntry,
  nameToSlug,
  parseListFromLabeledParagraph,
} from './shared.utils';

export function parseTacoCard(
  html: string,
  tacoId: string,
  stockData?: StockAvailability,
  logger: Logger = noopLogger
): Taco | null {
  try {
    if (!html) {
      return null;
    }
    const $ = load(html);
    const $card = $('div.card[id^="tacos-"]').first();
    if (!$card.length) return null;

    const $body = $card.find('.card-body').first();

    const title = $body.find('.card-title, h6, h5').first().text().replaceAll(/\s+/g, ' ').trim();

    // Strict size parsing from title
    let size: TacoSize | null = null;
    if (/tacos\s+L\s+mixte/i.test(title)) {
      size = TacoSize.L_MIXTE;
    } else {
      const match = new RegExp(/tacos\s+(XL|XXL|L|BOWL|GIGA)\b/i).exec(title);
      const variant = match?.[1]?.toUpperCase();
      if (variant) {
        size = variant === 'L' ? TacoSize.L : (('tacos_' + variant) as TacoSize);
      }
    }

    // Price from title " - 12 CHF."
    let price = 0;
    const mPrice = new RegExp(/-\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:CHF|EUR|€|\$)\.?/i).exec(title);
    if (mPrice?.[1]) {
      price = Number.parseFloat(mPrice[1].replace(',', '.'));
    }

    // Ingredients
    const meats: Array<{ id: string; name: string; quantity: number }> = [];
    const sauces: Array<{ id: string; name: string }> = [];
    const garnitures: Array<{ id: string; name: string }> = [];

    const viandeValues = parseListFromLabeledParagraph($body, ['Viande', 'Viande(s)']);
    for (const part of viandeValues) {
      const match = new RegExp(/^(.+?)\s+x\s*(\d+)$/i).exec(part);
      const meatName = (match?.[1] ?? part).trim();
      const quantityValue = match?.[2];
      const quantity = quantityValue ? Math.max(1, Number.parseInt(quantityValue, 10) || 1) : 1;
      if (!meatName || /^sans(_?viande)?$/i.test(meatName)) continue;
      let meatId = nameToSlug(meatName);
      const meatsStock = stockData?.meats;
      if (meatsStock) {
        const found = findIdByName(meatName, meatsStock);
        if (found) meatId = found;
      }
      meats.push({ id: meatId, name: meatName, quantity });
    }

    const sauceValues = parseListFromLabeledParagraph($body, ['Sauce', 'Sauces']);
    for (const s of sauceValues) {
      const name = s.trim();
      if (!name || isSansEntry(name)) continue;
      let sauceId = nameToSlug(name);
      const saucesStock = stockData?.sauces;
      if (saucesStock) {
        const found = findIdByName(name, saucesStock);
        if (found) sauceId = found;
      }
      sauces.push({ id: sauceId, name });
    }

    const garnitureValues = parseListFromLabeledParagraph($body, ['Garniture', 'Garnitures']);
    for (const g of garnitureValues) {
      const name = g.trim();
      if (!name || isSansEntry(name)) continue;
      let garnitureId = nameToSlug(name);
      const garnishesStock = stockData?.garnitures;
      if (garnishesStock) {
        const found = findIdByName(name, garnishesStock);
        if (found) garnitureId = found;
      }
      garnitures.push({ id: garnitureId, name });
    }

    // Note
    let note: string | undefined;
    const noteText = extractValueAfterColonFromParagraph(findLabeledParagraph($body, ['Remarque']));
    if (noteText) note = noteText;

    // Placeholder guard: require a real taco title OR a valid size; also discard pure placeholders "- 0 CHF." with no ingredients
    const hasIngredients = meats.length + sauces.length + garnitures.length > 0;
    if ((!isRealTacoTitle(title) && !size) || (!hasIngredients && price === 0)) {
      return null;
    }

    // Final size fallback only if title clearly mentions tacos
    if (!size && isRealTacoTitle(title)) size = TacoSize.L;

    // Transform items to new structure: id (UUID) and code (stock code)
    const transformedMeats = meats.map((meat) => ({
      id: deterministicUUID(meat.id, 'meats'),
      name: meat.name,
      quantity: meat.quantity,
    }));

    const transformedSauces = sauces.map((sauce) => ({
      id: deterministicUUID(sauce.id || sauce.name, 'sauces'),
      name: sauce.name,
    }));

    const transformedGarnitures = garnitures.map((garniture) => ({
      id: deterministicUUID(garniture.id || garniture.name, 'garnitures'),
      name: garniture.name,
    }));

    return {
      id: tacoId,
      size: size as TacoSize,
      meats: transformedMeats,
      sauces: transformedSauces,
      garnitures: transformedGarnitures,
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

