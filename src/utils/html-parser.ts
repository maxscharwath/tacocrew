// html.parser.ts
import * as cheerio from 'cheerio';
import { Taco, TacoSize, StockAvailability } from '../types';
import { logger } from './logger';

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
  stockData: Record<string, { in_stock: boolean }>
): string | null {
  const slug = nameToSlug(name);
  if (stockData[slug]) return slug;

  for (const [id] of Object.entries(stockData)) {
    if (id.toLowerCase() === slug) return id;
  }

  const parts = slug.split('_');
  for (const part of parts) {
    if (part.length > 3) {
      for (const [id] of Object.entries(stockData)) {
        if (id.includes(part) || part.includes(id)) return id;
      }
    }
  }
  return null;
}

function findLabeledParagraph(
  $scope: cheerio.Cheerio<cheerio.Element>,
  labels: string[]
): cheerio.Cheerio<cheerio.Element> {
  let $p = $scope.find(labels.map((l) => `p:has(strong:contains("${l}"))`).join(', ')).first();
  if ($p.length) return $p;
  $p = $scope.find(labels.map((l) => `p:contains("${l}")`).join(', ')).first();
  if ($p.length && $p[0].tagName !== 'p') $p = $p.closest('p');
  return $p;
}

function extractValueAfterColonFromParagraph(
  $p: cheerio.Cheerio<cheerio.Element>
): string | null {
  if (!$p.length) return null;
  const text = $p.text().replace(/\s+/g, ' ').trim();
  const idx = text.indexOf(':');
  if (idx < 0) return null;
  const after = text.slice(idx + 1).trim();
  return after || null;
}

function parseListFromLabeledParagraph(
  $scope: cheerio.Cheerio<cheerio.Element>,
  labels: string[]
): string[] {
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
    const $ = cheerio.load(html);
    const $card = $('div.card[id^="tacos-"]').first();
    if (!$card.length) return null;

    const $body = $card.find('.card-body').first();

    const title =
      $body.find('.card-title, h6, h5').first().text().replace(/\s+/g, ' ').trim();

    // Strict size parsing from title
    let size: TacoSize | null = null;
    if (/tacos\s+L\s+mixte/i.test(title)) {
      size = TacoSize.L_MIXTE;
    } else {
      const m = title.match(/tacos\s+(XL|XXL|L|BOWL|GIGA)\b/i);
      if (m) {
        const s = m[1].toUpperCase();
        size =
          s === 'L'
            ? TacoSize.L
            : (('tacos_' + s) as TacoSize);
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
      const m = part.match(/^(.+?)\s+x\s*(\d+)$/i);
      const meatName = (m ? m[1] : part).trim();
      const quantity = m ? Math.max(1, parseInt(m[2], 10) || 1) : 1;
      if (!meatName || /^sans(_?viande)?$/i.test(meatName)) return;
      let meatId = nameToSlug(meatName);
      if (stockData?.viandes) {
        const found = findIdByName(meatName, stockData.viandes);
        if (found) meatId = found;
      }
      meats.push({ id: meatId, name: meatName, quantity });
    });

    const sauceValues = parseListFromLabeledParagraph($body, ['Sauce', 'Sauces']);
    sauceValues.forEach((s) => {
      const name = s.trim();
      if (!name || isSansEntry(name)) return;
      let sauceId = nameToSlug(name);
      if (stockData?.sauces) {
        const found = findIdByName(name, stockData.sauces);
        if (found) sauceId = found;
      }
      sauces.push({ id: sauceId, name });
    });

    const garnitureValues = parseListFromLabeledParagraph($body, ['Garniture', 'Garnitures']);
    garnitureValues.forEach((g) => {
      const name = g.trim();
      if (!name || isSansEntry(name)) return;
      let garnitureId = nameToSlug(name);
      if (stockData?.garnitures) {
        const found = findIdByName(name, stockData.garnitures);
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

    return {
      id: tacoId,
      size: size as TacoSize,
      meats,
      sauces,
      garnitures,
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

export function parseCategorySummaryFromTacos(
  html: string,
  stockData?: StockAvailability
): Taco[] {
  try {
    const $ = cheerio.load(html);
    const tacos: Taco[] = [];

    const $cards = $('div.card[id^="tacos-"]');
    const ids: number[] = [];
    $cards.each((_, el) => {
      const idAttr = $(el).attr('id') || '';
      const m = idAttr.match(/tacos-(\d+)/);
      if (m) ids.push(parseInt(m[1], 10));
    });
    ids.sort((a, b) => a - b);

    ids.forEach((idx) => {
      const $card = $(`div.card#tacos-${idx}`);
      const htmlContent = $.html($card);
      const parsed = parseTacoCard(htmlContent, `temp-${idx}`, stockData);
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
    const $ = cheerio.load(html);
    
    // Try to find by id first (more specific)
    const $tokenInput = $('#csrf_token');
    if ($tokenInput.length) {
      const token = $tokenInput.attr('value');
      if (token) {
        logger.debug('CSRF token extracted from HTML by id', { 
          tokenLength: token.length 
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
          tokenLength: token.length 
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
