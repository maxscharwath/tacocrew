/**
 * Core form data types
 * Represents the structure of what user selects
 */

import type { TacoSize } from '@tacocrew/gigatacos-client';
import { TacoKind } from '@/lib/api/types';

export interface MeatSelection {
  id: string;
  quantity: number;
}

export interface OrderItemSelection {
  id: string;
  quantity: number;
}

export interface TacoSelection {
  size: TacoSize;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  kind: TacoKind;
  note: string;
}

export interface OrderFormData {
  taco: TacoSelection | null;
  extras: OrderItemSelection[];
  drinks: OrderItemSelection[];
  desserts: OrderItemSelection[];
}
