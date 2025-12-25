/**
 * Order tacoId generation utility
 * @module utils/order-taco-id
 */

import { createHash } from 'node:crypto';
import bs58 from 'bs58';
import type { Taco } from '@/schemas/taco.schema';
import { TacoKind } from '@/schemas/taco.schema';

/**
 * Normalized taco structure for generating tacoId
 * Ignores: notes, IDs, timestamps, prices, quantities
 * Includes: size, ingredient IDs (sorted)
 */
interface NormalizedTaco {
  size: string;
  meats: string[]; // sorted IDs
  sauces: string[]; // sorted IDs
  garnitures: string[]; // sorted IDs
}

/**
 * Normalize a single taco for tacoId generation
 * Ignores quantity - only matches the recipe (size + ingredients)
 * Sorts all arrays to ensure consistent hashing
 * Mystery tacos don't have ingredients, so this should only be called for regular tacos
 */
function normalizeTaco(taco: Taco): NormalizedTaco {
  // Mystery tacos don't have ingredients - this function should only be called for regular tacos
  if (taco.kind === TacoKind.MYSTERY) {
    throw new Error('Cannot normalize mystery taco - mystery tacos do not have ingredients');
  }

  return {
    size: taco.size,
    meats: taco.meats.map((m) => m.id).sort(),
    sauces: taco.sauces.map((s) => s.id).sort(),
    garnitures: taco.garnitures.map((g) => g.id).sort(),
  };
}

/**
 * Generate SHA-256 tacoId in hex format for a single taco (hex format for database storage)
 * Only considers the recipe (size + ingredients), not quantity, price, or notes
 * Returns hex string for database storage and queries
 */
export function generateTacoIdHex(taco: Taco): string {
  const normalized = normalizeTaco(taco);
  const json = JSON.stringify(normalized);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Generate tacoID (base58-encoded tacoId) from a taco
 * This is the user-friendly Bitcoin-style identifier for sharing
 * Accepts a taco without tacoID since it only uses the recipe (size + ingredients)
 */
export function generateTacoID(taco: Omit<Taco, 'tacoID'> | Taco): string {
  const normalized = normalizeTaco(taco as Taco);
  const json = JSON.stringify(normalized);
  const hash = createHash('sha256').update(json).digest();
  // Encode in base58 for a Bitcoin-style "tacoID" (removes confusing 0, O, I, l characters)
  return bs58.encode(hash);
}

/**
 * Convert hex tacoId to tacoID (base58)
 */
export function hexToTacoID(hexTacoId: string): string {
  try {
    const hash = Buffer.from(hexTacoId, 'hex');
    return bs58.encode(hash);
  } catch {
    throw new Error('Invalid tacoId format');
  }
}

/**
 * Convert a tacoID (base58) back to hex for database lookup
 * This is needed because we store hex tacoIds in the database
 */
export function tacoIDToHex(tacoID: string): string {
  try {
    const hash = bs58.decode(tacoID);
    return Buffer.from(hash).toString('hex');
  } catch {
    throw new Error('Invalid tacoID format');
  }
}

/**
 * Extract all taco IDs in hex format from user order items
 * Returns an array of unique hex tacoIds (one per taco)
 * Returns empty array if no tacos
 * Mystery tacos are excluded (they don't have tacoID)
 */
export function extractTacoIdsHex(items: { tacos: Taco[] }): string[] {
  return items.tacos
    .filter((taco): taco is Extract<Taco, { tacoID: string }> => taco.kind === TacoKind.REGULAR)
    .map((taco) => generateTacoIdHex(taco));
}
