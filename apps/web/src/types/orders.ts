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
  icon: React.ComponentType<{ size?: number; className?: string }>;
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

export type StockItem =
  | StockResponse['meats'][number]
  | StockResponse['sauces'][number]
  | StockResponse['garnishes'][number]
  | StockResponse['extras'][number]
  | StockResponse['drinks'][number]
  | StockResponse['desserts'][number];
