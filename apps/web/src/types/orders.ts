import type { TacoSize } from '@tacocrew/gigatacos-client';
import type { ComponentType } from 'react';
import type { StockResponse } from '@/lib/api';
/**
 * Shared types for order-related components and hooks
 */

export type MeatSelection = {
  id: string;
  quantity: number;
};

export type PriceBreakdownItem = {
  label: string;
  price: number;
};

export type ProgressStep = {
  key: string;
  completed: boolean;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  description: string;
};

export type OrderFormState = {
  size: string;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  extras: string[];
  drinks: string[];
  desserts: string[];
  note: string;
};

export type TacoSizeItem = StockResponse['tacos'][number];

/**
 * Taco customization state for the taco builder
 */
export type TacoCustomization = {
  size: TacoSize;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  note: string;
  selectedTacoSize: TacoSizeItem | null;
};

export type StockItem =
  | StockResponse['meats'][number]
  | StockResponse['sauces'][number]
  | StockResponse['garnishes'][number]
  | StockResponse['extras'][number]
  | StockResponse['drinks'][number]
  | StockResponse['desserts'][number];
