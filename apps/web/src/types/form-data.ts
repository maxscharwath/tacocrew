/**
 * Core form data types
 * Represents the structure of what user selects
 */

import { TacoKind } from '@/lib/api/types';
import type { TacoSize } from '@/lib/taco-config';

export interface MeatSelection {
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
  extras: string[];
  drinks: string[];
  desserts: string[];
}
