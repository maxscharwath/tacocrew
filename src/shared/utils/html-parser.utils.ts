// html.parser.ts
import { type Cheerio, load } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import {
  GarnitureIdSchema,
  MeatIdSchema,
  SauceIdSchema,
  TacoIdSchema,
} from '@/schemas/taco.schema';
import { StockAvailability, StockCategory, Taco, TacoSize } from '@/shared/types/types';
import { logger } from '@/shared/utils/logger.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

function nameToSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'et')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findIdByName(
  name: string,
  stockData: Array<{ code: string; in_stock: boolean }> | undefined
): string | null {
  if (!stockData) return null;

  const slug = nameToSlug(name);
  const exactMatch = stockData.find((item) => item.code === slug);
  if (exactMatch) return exactMatch.code;

  const lowerMatch = stockData.find((item) => item.code.toLowerCase() === slug);
  if (lowerMatch) return lowerMatch.code;

  const parts = slug.split('_');
  for (const part of parts) {
    if (part.length > 3) {
      const partialMatch = stockData.find(
        (item) => item.code.includes(part) || part.includes(item.code)
      );
      if (partialMatch) return partialMatch.code;
    }
  }
  return null;
}

function findLabeledParagraph($scope: Cheerio<AnyNode>, labels: string[]): Cheerio<AnyNode> {
  let $p = $scope
    .find(labels.map((l) => `p:has(strong:contains("${l}"))`).join(', '))
    .first() as Cheerio<AnyNode>;
  if ($p.length) return $p;
  $p = $scope.find(labels.map((l) => `p:contains("${l}")`).join(', ')).first() as Cheerio<AnyNode>;
  const el = $p.get(0) as Element | undefined;
  if (el?.tagName && el.tagName !== 'p') {
    $p = $p.closest('p') as Cheerio<AnyNode>;
  }
  return $p;
}

function extractValueAfterColonFromParagraph($p: Cheerio<AnyNode>): string | null {
  if (!$p.length) return null;
  const text = $p.text().replace(/\s+/g, ' ').trim();
  const idx = text.indexOf(':');
  if (idx < 0) return null;
  const after = text.slice(idx + 1).trim();
  return after || null;
}

function parseListFromLabeledParagraph($scope: Cheerio<AnyNode>, labels: string[]): string[] {
  const $p = findLabeledParagraph($scope, labels);
  const val = extractValueAfterColonFromParagraph($p);
  if (!val) return [];
  return val
    .split(/[,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isSansEntry(s: string): boolean {
  const n = s.toLowerCase();
  return n === 'sans' || n === 'sans garniture' || n === 'sans sauce';
}

function isRealTacoTitle(title: string): boolean {
  return /(^|\s)tacos(\s|$)/i.test(title);
}

export function parseTacoCard(
  html: string,
  tacoId: string,
  stockData?: StockAvailability
): Taco | null {
  try {
    if (!html) {
      return null;
    }
    const $ = load(html);
    const $card = $('div.card[id^="tacos-"]').first();
    if (!$card.length) return null;

    const $body = $card.find('.card-body').first();

    const title = $body.find('.card-title, h6, h5').first().text().replace(/\s+/g, ' ').trim();

    // Strict size parsing from title
    let size: TacoSize | null = null;
    if (/tacos\s+L\s+mixte/i.test(title)) {
      size = TacoSize.L_MIXTE;
    } else {
      const match = title.match(/tacos\s+(XL|XXL|L|BOWL|GIGA)\b/i);
      const variant = match?.[1]?.toUpperCase();
      if (variant) {
        size = variant === 'L' ? TacoSize.L : (('tacos_' + variant) as TacoSize);
      }
    }

    // Price from title " - 12 CHF."
    let price = 0;
    const mPrice = title.match(/-\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:CHF|EUR|€|\$)\.?/i);
    if (mPrice && mPrice[1]) {
      price = parseFloat(mPrice[1].replace(',', '.'));
    }

    // Ingredients
    const meats: Array<{ id: string; name: string; quantity: number }> = [];
    const sauces: Array<{ id: string; name: string }> = [];
    const garnitures: Array<{ id: string; name: string }> = [];

    const viandeValues = parseListFromLabeledParagraph($body, ['Viande', 'Viande(s)']);
    viandeValues.forEach((part) => {
      const match = part.match(/^(.+?)\s+x\s*(\d+)$/i);
      const meatName = (match?.[1] ?? part).trim();
      const quantityValue = match?.[2];
      const quantity = quantityValue ? Math.max(1, parseInt(quantityValue, 10) || 1) : 1;
      if (!meatName || /^sans(_?viande)?$/i.test(meatName)) return;
      let meatId = nameToSlug(meatName);
      const meatsStock = stockData?.meats;
      if (meatsStock) {
        const found = findIdByName(meatName, meatsStock);
        if (found) meatId = found;
      }
      meats.push({ id: meatId, name: meatName, quantity });
    });

    const sauceValues = parseListFromLabeledParagraph($body, ['Sauce', 'Sauces']);
    sauceValues.forEach((s) => {
      const name = s.trim();
      if (!name || isSansEntry(name)) return;
      let sauceId = nameToSlug(name);
      const saucesStock = stockData?.sauces;
      if (saucesStock) {
        const found = findIdByName(name, saucesStock);
        if (found) sauceId = found;
      }
      sauces.push({ id: sauceId, name });
    });

    const garnitureValues = parseListFromLabeledParagraph($body, ['Garniture', 'Garnitures']);
    garnitureValues.forEach((g) => {
      const name = g.trim();
      if (!name || isSansEntry(name)) return;
      let garnitureId = nameToSlug(name);
      const garnishesStock = stockData?.garnishes;
      if (garnishesStock) {
        const found = findIdByName(name, garnishesStock);
        if (found) garnitureId = found;
      }
      garnitures.push({ id: garnitureId, name });
    });

    // Note
    let note: string | undefined;
    const noteText = extractValueAfterColonFromParagraph(findLabeledParagraph($body, ['Remarque']));
    if (noteText) note = noteText;

    // Quantity (scoped to THIS card only)
    let quantity = 1;
    const $qty = $body.find('.quantity-controls .quantity-input[readonly]').first();
    const qtyRaw = $qty.attr('value') ?? ($qty.val() as string | undefined);
    if (qtyRaw) {
      const q = parseInt(qtyRaw, 10);
      if (!Number.isNaN(q) && q > 0) quantity = q;
    }

    // Placeholder guard: require a real taco title OR a valid size; also discard pure placeholders "- 0 CHF." with no ingredients
    const hasIngredients = meats.length + sauces.length + garnitures.length > 0;
    if ((!isRealTacoTitle(title) && !size) || (!hasIngredients && price === 0)) {
      return null;
    }

    // Final size fallback only if title clearly mentions tacos
    if (!size && isRealTacoTitle(title)) size = TacoSize.L;

    // Transform items to new structure: id (UUID) and code (stock code)
    const transformedMeats = meats.map((meat) => ({
      id: MeatIdSchema.parse(deterministicUUID(meat.id, StockCategory.Meats)),
      code: meat.id,
      name: meat.name,
      quantity: meat.quantity,
    }));

    const transformedSauces = sauces.map((sauce) => ({
      id: SauceIdSchema.parse(deterministicUUID(sauce.id || sauce.name, StockCategory.Sauces)),
      code: sauce.id,
      name: sauce.name,
    }));

    const transformedGarnitures = garnitures.map((garniture) => ({
      id: GarnitureIdSchema.parse(
        deterministicUUID(garniture.id || garniture.name, StockCategory.Garnishes)
      ),
      code: garniture.id,
      name: garniture.name,
    }));

    return {
      id: TacoIdSchema.parse(tacoId),
      size: size as TacoSize,
      meats: transformedMeats,
      sauces: transformedSauces,
      garnitures: transformedGarnitures,
      note,
      quantity,
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
  stockData?: StockAvailability
): Taco[] {
  const tacos = parseCategorySummaryFromTacos(html, stockData);
  return tacos.map((taco, index) => {
    const mappedId = mapping.get(index);
    return mappedId ? { ...taco, id: TacoIdSchema.parse(mappedId) } : taco;
  });
}

/**
 * Parse cart summary from HTML
 * This is a placeholder - actual implementation depends on HTML structure
 */
export function parseCartSummary(html: string): {
  tacos: { totalQuantity: number; totalPrice: number };
  extras: { totalQuantity: number; totalPrice: number };
  boissons: { totalQuantity: number; totalPrice: number };
  desserts: { totalQuantity: number; totalPrice: number };
} {
  if (!html) {
    return {
      tacos: { totalQuantity: 0, totalPrice: 0 },
      extras: { totalQuantity: 0, totalPrice: 0 },
      boissons: { totalQuantity: 0, totalPrice: 0 },
      desserts: { totalQuantity: 0, totalPrice: 0 },
    };
  }
  // Placeholder implementation
  return {
    tacos: { totalQuantity: 0, totalPrice: 0 },
    extras: { totalQuantity: 0, totalPrice: 0 },
    boissons: { totalQuantity: 0, totalPrice: 0 },
    desserts: { totalQuantity: 0, totalPrice: 0 },
  };
}

export function parseCategorySummaryFromTacos(html: string, stockData?: StockAvailability): Taco[] {
  try {
    const $ = load(html);
    const tacos: Taco[] = [];

    const $cards = $('div.card[id^="tacos-"]');
    const ids: number[] = [];
    $cards.each((_, el) => {
      const idAttr = $(el).attr('id') || '';
      const match = idAttr.match(/tacos-(\d+)/);
      const identifier = match?.[1];
      if (identifier) {
        ids.push(parseInt(identifier, 10));
      }
    });
    ids.sort((a, b) => a - b);

    ids.forEach((idx) => {
      const $card = $(`div.card#tacos-${idx}`);
      const rawHtml = $.html($card);
      if (rawHtml == null) {
        return;
      }
      const htmlContent: string = rawHtml;
      // Generate a temporary UUID for parsing - will be replaced by mapping if provided
      const tempId = deterministicUUID(`temp-taco-${idx}`, StockCategory.Meats);
      const parsed = parseTacoCard(htmlContent as unknown as string, tempId, stockData);
      if (parsed) tacos.push(parsed);
    });

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

/**
 * Extract CSRF token from HTML page
 * Looks for input element with name="csrf_token" and id="csrf_token"
 */
export function extractCsrfTokenFromHtml(html: string): string | null {
  try {
    const $ = load(html);

    // Try to find by id first (more specific)
    const $tokenInput = $('#csrf_token');
    if ($tokenInput.length) {
      const token = $tokenInput.attr('value');
      if (token) {
        logger.debug('CSRF token extracted from HTML by id', {
          tokenLength: token.length,
        });
        return token;
      }
    }

    // Fallback: try to find by name attribute
    const $tokenByName = $('input[name="csrf_token"]');
    if ($tokenByName.length) {
      const token = $tokenByName.attr('value');
      if (token) {
        logger.debug('CSRF token extracted from HTML by name', {
          tokenLength: token.length,
        });
        return token;
      }
    }

    logger.warn('CSRF token not found in HTML');
    return null;
  } catch (error) {
    logger.error('Failed to extract CSRF token from HTML', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return null;
  }
}
