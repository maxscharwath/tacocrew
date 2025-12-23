/**
 * Utility to convert mystery tacos to regular tacos with ingredients
 * Uses deterministic generation based on taco ID
 * @module utils/mystery-taco-converter
 */

import type { Taco } from '@/schemas/taco.schema';
import { GarnitureId, MeatId, SauceId, TacoKind } from '@/schemas/taco.schema';
import { PriceCalculator } from '@/services/user-order/processors/price-calculator';
import { type StockAvailability, StockCategory } from '@/shared/types/types';
import { generateTacoID } from '@/shared/utils/order-taco-id.utils';
import { createSeededRandom } from './seeded-random.utils';

/**
 * Convert a mystery taco to a regular taco with ingredients generated deterministically from taco ID
 */
export function convertMysteryTacoToRegular(
  mysteryTaco: Taco,
  stock: StockAvailability
): Extract<Taco, { kind: typeof TacoKind.REGULAR }> {
  // Use taco ID as seed for deterministic random generation
  const rng = createSeededRandom(mysteryTaco.id);

  // Get taco size constraints
  const tacoSize = stock.tacos.find((t) => t.code === mysteryTaco.size);
  if (!tacoSize) {
    throw new Error(`Taco size not found: ${mysteryTaco.size}`);
  }

  // Generate ingredients deterministically
  const meats = generateRandomMeats(stock, tacoSize.maxMeats, rng);
  const sauces = generateRandomSauces(stock, tacoSize.maxSauces, rng);
  const garnitures = tacoSize.allowGarnitures ? generateRandomGarnitures(stock, rng) : [];

  const price = PriceCalculator.calculateRegularTacoPrice(mysteryTaco.size, meats, stock);

  const baseTaco = {
    id: mysteryTaco.id,
    size: mysteryTaco.size,
    meats,
    sauces,
    garnitures,
    note: mysteryTaco.note,
    price,
  };

  return {
    ...baseTaco,
    kind: TacoKind.REGULAR,
    tacoID: generateTacoID({ ...baseTaco, kind: TacoKind.REGULAR }),
  };
}

/**
 * Generate random meats deterministically using seeded RNG
 * Allows selecting the same meat multiple times (quantity > 1)
 * Always uses the maximum number of meats allowed
 */
function generateRandomMeats(
  stock: StockAvailability,
  maxMeats: number,
  rng: ReturnType<typeof createSeededRandom>
): Array<{ id: MeatId; code: string; name: string; quantity: number }> {
  const availableMeats = stock[StockCategory.Meats].filter((m) => m.in_stock);
  if (availableMeats.length === 0) {
    return [];
  }

  // Always use maximum number of meats
  const totalQuantity = maxMeats;

  // Randomly select meats (with replacement) until we reach totalQuantity
  const meatMap = new Map<string, { id: MeatId; code: string; name: string; quantity: number }>();

  for (let i = 0; i < totalQuantity; i++) {
    // Randomly select a meat (with replacement - same meat can be selected multiple times)
    const randomIndex = rng.nextInt(0, availableMeats.length);
    const selectedMeat = availableMeats[randomIndex]!;

    const existing = meatMap.get(selectedMeat.id);

    if (existing) {
      // Increment quantity if meat already selected
      existing.quantity++;
    } else {
      // Add new meat entry
      meatMap.set(selectedMeat.id, {
        id: MeatId.parse(selectedMeat.id),
        code: selectedMeat.code,
        name: selectedMeat.name,
        quantity: 1,
      });
    }
  }

  return Array.from(meatMap.values());
}

/**
 * Generate random sauces deterministically using seeded RNG
 */
function generateRandomSauces(
  stock: StockAvailability,
  maxSauces: number,
  rng: ReturnType<typeof createSeededRandom>
): Array<{ id: SauceId; code: string; name: string }> {
  const availableSauces = stock[StockCategory.Sauces].filter((s) => s.in_stock);
  if (availableSauces.length === 0) {
    return [];
  }

  // Randomly select 1 to maxSauces sauces
  const count = Math.max(1, rng.nextInt(1, maxSauces + 1));
  const selected = rng.shuffle([...availableSauces]).slice(0, count);

  return selected.map((sauce) => ({
    id: SauceId.parse(sauce.id),
    code: sauce.code,
    name: sauce.name,
  }));
}

/**
 * Generate random garnitures deterministically using seeded RNG
 */
function generateRandomGarnitures(
  stock: StockAvailability,
  rng: ReturnType<typeof createSeededRandom>
): Array<{ id: GarnitureId; code: string; name: string }> {
  const availableGarnitures = stock[StockCategory.Garnishes].filter((g) => g.in_stock);
  if (availableGarnitures.length === 0) {
    return [];
  }

  // Randomly select 0 to all available garnitures
  const count = rng.nextInt(0, availableGarnitures.length + 1);
  const selected = rng.shuffle([...availableGarnitures]).slice(0, count);

  return selected.map((garniture) => ({
    id: GarnitureId.parse(garniture.id),
    code: garniture.code,
    name: garniture.name,
  }));
}
