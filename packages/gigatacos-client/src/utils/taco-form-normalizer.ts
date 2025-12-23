/**
 * Taco form data normalizer
 * Ensures empty items are added when arrays are empty (required by backend)
 */

import { EMPTY_GARNITURE_CODE, EMPTY_MEAT_CODE, EMPTY_SAUCE_CODE } from '../config/empty-items.config';
import type { TacoFormData } from '../types';

/**
 * Normalize taco form data by adding empty items when arrays are empty
 * The backend requires at least one item in each array, so we add empty items if arrays are empty
 */
export function normalizeTacoFormData(formData: TacoFormData): TacoFormData {
  const meats = formData['viande[]'] || [];
  const sauces = formData['sauce[]'] || [];
  const garnitures = formData['garniture[]'] || [];
  
  const hasMeats = meats.length > 0;
  const hasSauces = sauces.length > 0;
  const hasGarnitures = garnitures.length > 0;

  return {
    ...formData,
    'viande[]': hasMeats ? meats : [EMPTY_MEAT_CODE],
    'sauce[]': hasSauces ? sauces : [EMPTY_SAUCE_CODE],
    'garniture[]': hasGarnitures ? garnitures : [EMPTY_GARNITURE_CODE],
    ...(!hasMeats && { [`meat_quantity[${EMPTY_MEAT_CODE}]`]: 1 }),
  };
}

