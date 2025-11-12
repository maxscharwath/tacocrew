/**
 * Taco ID generation utility
 * @module gigatacos-client/utils/taco-id
 */

import { createHash } from 'node:crypto';
import type { Taco } from '../types';

/**
 * Normalized taco structure for generating tacoId
 */
interface NormalizedTaco {
  size: string;
  meats: string[]; // sorted IDs
  sauces: string[]; // sorted IDs
  garnitures: string[]; // sorted IDs
}

/**
 * Normalize a single taco for tacoId generation
 */
function normalizeTaco(taco: Taco): NormalizedTaco {
  return {
    size: taco.size,
    meats: taco.meats.map((m) => m.id).sort(),
    sauces: taco.sauces.map((s) => s.id).sort(),
    garnitures: taco.garnitures.map((g) => g.id).sort(),
  };
}

/**
 * Generate tacoID from a taco
 * Returns a deterministic hash based on size and ingredients
 */
export function generateTacoID(taco: Taco): string {
  const normalized = normalizeTaco(taco);
  const json = JSON.stringify(normalized);
  const hash = createHash('sha256').update(json).digest('hex');
  // Return hex for now (can be base58 encoded if needed)
  return hash;
}

