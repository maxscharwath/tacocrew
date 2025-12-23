/**
 * Parse form data into order request data
 * @module utils/order-form-parser
 */

import { TacoSize } from '@tacocrew/gigatacos-client';
import { TacoKind } from '@/lib/api/types';

export type ParsedOrderFormData = {
  size: TacoSize | undefined;
  editOrderId: string | undefined;
  kind: TacoKind;
  meats: Array<{ id: string; quantity: number }>;
  sauces: Array<{ id: string }>;
  garnitures: Array<{ id: string }>;
  extras: Array<{ id: string; quantity: number }>;
  drinks: Array<{ id: string; quantity: number }>;
  desserts: Array<{ id: string; quantity: number }>;
  note: string | undefined;
};

const VALID_TACO_SIZES = Object.values(TacoSize);

function isTacoSize(value: string): value is TacoSize {
  return VALID_TACO_SIZES.includes(value as TacoSize);
}

/**
 * Parse form data into structured order data
 */
export function parseOrderFormData(formData: FormData): ParsedOrderFormData {
  const sizeValue = formData.get('tacoSize')?.toString();
  const size = sizeValue && isTacoSize(sizeValue) ? sizeValue : undefined;
  const editOrderId = formData.get('editOrderId')?.toString();
  const kindStr = formData.get('kind')?.toString() || 'regular';
  const kind = kindStr === 'mystery' ? TacoKind.MYSTERY : TacoKind.REGULAR;

  const meats = parseMeats(formData);
  const sauces = formData.getAll('sauces').map((value) => ({ id: value.toString() }));
  const garnitures = formData.getAll('garnitures').map((value) => ({ id: value.toString() }));
  const extras = parseItems(formData, 'extras');
  const drinks = parseItems(formData, 'drinks');
  const desserts = parseItems(formData, 'desserts');
  const note = formData.get('note')?.toString().trim();

  return {
    size,
    editOrderId,
    kind,
    meats,
    sauces,
    garnitures,
    extras,
    drinks,
    desserts,
    note,
  };
}

function parseMeats(formData: FormData): Array<{ id: string; quantity: number }> {
  const meatIds = formData.getAll('meats').map((value) => value.toString());
  return meatIds
    .map((id) => {
      const quantityStr = formData.get(`meat_quantity_${id}`);
      const quantity = quantityStr ? Number(quantityStr) : 0;
      return quantity > 0 ? { id, quantity } : null;
    })
    .filter((m): m is { id: string; quantity: number } => m !== null);
}

function parseItems(formData: FormData, fieldName: string): Array<{ id: string; quantity: number }> {
  return formData.getAll(fieldName).map((value) => ({ id: value.toString(), quantity: 1 }));
}

