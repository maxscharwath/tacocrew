/**
 * HTML parser for os.php endpoint (order summary)
 * @module gigatacos-client/parsers/order-summary
 */

import { load } from 'cheerio';
import type { Logger } from '../types';
import { noopLogger } from '../utils/logger';

/**
 * Order summary from os.php endpoint
 */
export interface OrderSummary {
  cartTotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: {
    tacos: Array<{
      quantity: number;
      size: string;
      price: number;
      meats: string;
      garnitures: string;
      sauces: string;
    }>;
    extras: Array<{
      quantity: number;
      name: string;
      price: number;
    }>;
    drinks: Array<{
      quantity: number;
      name: string;
      price: number;
    }>;
    desserts: Array<{
      quantity: number;
      name: string;
      price: number;
    }>;
  };
}

/**
 * Parse order summary from os.php HTML response
 */
export function parseOrderSummary(html: string, logger: Logger = noopLogger): OrderSummary | null {
  try {
    const $ = load(html);

    const items = {
      tacos: [] as OrderSummary['items']['tacos'],
      extras: [] as OrderSummary['items']['extras'],
      drinks: [] as OrderSummary['items']['drinks'],
      desserts: [] as OrderSummary['items']['desserts'],
    };

    // Parse Tacos section
    const $tacosCard = $('div.card:has(.card-header:contains("Tacos"))');
    if ($tacosCard.length) {
      $tacosCard.find('.card-body p.fs-6').each((_, el) => {
        const $p = $(el);
        const text = $p.text().trim();
        // Match: "1 x Tacos L Mixte - 12CHF"
        const match = new RegExp(/(\d+)\s+x\s+(.+?)\s+-\s+(\d+(?:\.\d+)?)CHF/i).exec(text);
        if (match?.[1] && match?.[2] && match?.[3]) {
          const quantity = Number.parseInt(match[1], 10);
          const size = match[2].trim();
          const price = Number.parseFloat(match[3]);

          // Get details from next siblings
          const $next = $p.nextAll('p.small');
          let meats = '';
          let garnitures = '';
          let sauces = '';

          $next.each((_, nextEl) => {
            const $nextP = $(nextEl);
            const nextText = $nextP.text();
            if (nextText.includes('Viande:')) {
              meats = nextText.replace(/^.*?Viande:\s*/i, '').trim();
            } else if (nextText.includes('Garniture:')) {
              garnitures = nextText.replace(/^.*?Garniture:\s*/i, '').trim();
            } else if (nextText.includes('Sauce:')) {
              sauces = nextText.replace(/^.*?Sauce:\s*/i, '').trim();
            }
          });

          items.tacos.push({
            quantity,
            size,
            price,
            meats,
            garnitures,
            sauces,
          });
        }
      });
    }

    // Parse Extras section
    const $extrasCard = $('div.card:has(.card-header:contains("Extras"))');
    if ($extrasCard.length) {
      $extrasCard.find('.card-body p.small').each((_, el) => {
        const text = $(el).text().trim();
        // Match: "1 x Portion frites - 4CHF"
        const match = new RegExp(/(\d+)\s+x\s+(.+?)\s+-\s+(\d+(?:\.\d+)?)CHF/i).exec(text);
        if (match?.[1] && match?.[2] && match?.[3]) {
          items.extras.push({
            quantity: Number.parseInt(match[1], 10),
            name: match[2].trim(),
            price: Number.parseFloat(match[3]),
          });
        }
      });
    }

    // Parse Drinks section
    const $drinksCard = $('div.card:has(.card-header:contains("Boissons"))');
    if ($drinksCard.length) {
      $drinksCard.find('.card-body p.small').each((_, el) => {
        const text = $(el).text().trim();
        const match = new RegExp(/(\d+)\s+x\s+(.+?)\s+-\s+(\d+(?:\.\d+)?)CHF/i).exec(text);
        if (match?.[1] && match?.[2] && match?.[3]) {
          items.drinks.push({
            quantity: Number.parseInt(match[1], 10),
            name: match[2].trim(),
            price: Number.parseFloat(match[3]),
          });
        }
      });
    }

    // Parse Desserts section
    const $dessertsCard = $('div.card:has(.card-header:contains("Desserts"))');
    if ($dessertsCard.length) {
      $dessertsCard.find('.card-body p.small').each((_, el) => {
        const text = $(el).text().trim();
        const match = new RegExp(/(\d+)\s+x\s+(.+?)\s+-\s+(\d+(?:\.\d+)?)CHF/i).exec(text);
        if (match?.[1] && match?.[2] && match?.[3]) {
          items.desserts.push({
            quantity: Number.parseInt(match[1], 10),
            name: match[2].trim(),
            price: Number.parseFloat(match[3]),
          });
        }
      });
    }

    // Parse totals from payment info card
    let cartTotal = 0;
    let deliveryFee = 0;
    let totalAmount = 0;

    const $paymentCard = $('div.card:has(.card-header:contains("Informations sur le paiement"))');
    if ($paymentCard.length) {
      $paymentCard.find('.d-flex.justify-content-between').each((_, el) => {
        const $div = $(el);
        const label = $div.find('p.small').first().text().trim();
        const valueText = $div.find('p.small').last().text().trim();

        // Extract number from "88.00CHF" or "2.00CHF"
        const match = new RegExp(/(\d+(?:\.\d+)?)CHF/i).exec(valueText);
        if (match?.[1]) {
          const value = Number.parseFloat(match[1]);
          if (label.includes('Total du panier')) {
            cartTotal = value;
          } else if (label.includes('Frais de livraison')) {
            deliveryFee = value;
          } else if (label.includes('Montant à payer')) {
            totalAmount = value;
          }
        }
      });
    }

    return {
      cartTotal,
      deliveryFee,
      totalAmount,
      items,
    };
  } catch (error) {
    logger.error('Failed to parse order summary from os.php', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return null;
  }
}

