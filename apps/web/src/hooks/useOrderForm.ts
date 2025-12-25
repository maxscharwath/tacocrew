/**
 * Professional order form hook
 * Manages form state with clean API and helper functions
 * Uses TanStack Query for async data, simple useState for form inputs
 */

import { useEffect, useState } from 'react';
import type { StockResponse } from '@/lib/api';
import type { UserOrderDetail } from '@/lib/api/orders';
import { TacoKind } from '@/lib/api/types';
import type {
  MeatSelection,
  OrderFormData,
  OrderItemSelection,
  TacoSelection,
} from '@/types/form-data';
import type { TacoSizeItem } from '@/types/orders';
import { calculateOrderTotalPrice, generatePriceBreakdown } from '@/utils/priceCalculations';

interface UseOrderFormProps {
  stock?: StockResponse;
  myOrder?: UserOrderDetail;
}

/**
 * Helper: Initialize form data from existing order
 */
function initializeFormData(myOrder?: UserOrderDetail): OrderFormData {
  if (!myOrder) {
    return {
      taco: null,
      extras: [],
      drinks: [],
      desserts: [],
    };
  }

  const taco = myOrder.items.tacos[0];
  const isMystery = taco?.kind === TacoKind.MYSTERY;

  return {
    taco: taco
      ? {
          size: taco.size as TacoSelection['size'],
          meats:
            taco && !isMystery && taco.meats
              ? taco.meats.map((item) => ({
                  id: item.id,
                  quantity: item.quantity ?? 1,
                }))
              : [],
          sauces: taco && !isMystery && taco.sauces ? taco.sauces.map((item) => item.id) : [],
          garnitures:
            taco && !isMystery && taco.garnitures ? taco.garnitures.map((item) => item.id) : [],
          kind: taco.kind,
          note: taco.note ?? '',
        }
      : null,
    extras: myOrder.items.extras.map((extra) => ({ id: extra.id, quantity: 1 })),
    drinks: myOrder.items.drinks.map((drink) => ({ id: drink.id, quantity: 1 })),
    desserts: myOrder.items.desserts.map((dessert) => ({ id: dessert.id, quantity: 1 })),
  };
}

/**
 * Helper: Find taco size from stock
 */
function findTacoSize(stock: StockResponse | undefined, size: string): TacoSizeItem | null {
  if (!stock || !size) return null;
  return stock.tacos.find((t) => t.code === size) ?? null;
}

/**
 * Helper: Check if item is in stock
 */
function isItemInStock(stock: StockResponse | undefined, id: string): boolean {
  if (!stock) return true; // Assume in stock if no stock data

  const allItems = [
    ...stock.sauces,
    ...stock.garnishes,
    ...stock.extras,
    ...stock.drinks,
    ...stock.desserts,
  ];
  const item = allItems.find((i) => i.id === id);
  return !item || item.in_stock;
}

/**
 * Professional hook for order form management
 * Clean API, simple state, easy to test
 */
export function useOrderForm({ stock, myOrder }: UseOrderFormProps) {
  // Initialize form data
  const initialData = initializeFormData(myOrder);

  // Form state
  const [size, setSize] = useState(initialData.taco?.size ?? '');
  const [meats, setMeats] = useState<MeatSelection[]>(initialData.taco?.meats ?? []);
  const [sauces, setSauces] = useState<string[]>(initialData.taco?.sauces ?? []);
  const [garnitures, setGarnitures] = useState<string[]>(initialData.taco?.garnitures ?? []);
  const [extras, setExtras] = useState<OrderItemSelection[]>(initialData.extras);
  const [drinks, setDrinks] = useState<OrderItemSelection[]>(initialData.drinks);
  const [desserts, setDesserts] = useState<OrderItemSelection[]>(initialData.desserts);
  const [note, setNote] = useState(initialData.taco?.note ?? '');
  const [kind, setKind] = useState<TacoKind>(initialData.taco?.kind ?? TacoKind.REGULAR);

  // Refill form when myOrder changes (e.g., after async fetch)
  useEffect(() => {
    const data = initializeFormData(myOrder);
    setSize(data.taco?.size ?? '');
    setMeats(data.taco?.meats ?? []);
    setSauces(data.taco?.sauces ?? []);
    setGarnitures(data.taco?.garnitures ?? []);
    setExtras(data.extras);
    setDrinks(data.drinks);
    setDesserts(data.desserts);
    setNote(data.taco?.note ?? '');
    setKind(data.taco?.kind ?? TacoKind.REGULAR);
  }, [myOrder]);

  // Computed values
  const selectedTacoSize: TacoSizeItem | null = findTacoSize(stock, size);

  const fallbackStock: StockResponse = {
    tacos: [],
    meats: [],
    sauces: [],
    garnishes: [],
    extras: [],
    drinks: [],
    desserts: [],
  };

  const totalPrice = calculateOrderTotalPrice(
    selectedTacoSize,
    meats,
    extras,
    drinks,
    desserts,
    stock || fallbackStock
  );

  const priceBreakdown = generatePriceBreakdown(
    selectedTacoSize,
    extras,
    drinks,
    desserts,
    stock || fallbackStock
  );

  // Toggle selection helper - handles multiple selection types
  const toggleSelection = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
    max?: number
  ) => {
    // Check stock
    if (!isItemInStock(stock, id)) {
      return;
    }

    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else if (max === undefined || current.length < max) {
      setter([...current, id]);
    }
  };

  // Update meat quantity
  const updateMeatQuantity = (id: string, delta: number) => {
    if (!size || !selectedTacoSize || !stock) {
      return;
    }

    const meatItem = stock.meats.find((m) => m.id === id);
    if (meatItem && !meatItem.in_stock) {
      return;
    }

    const existing = meats.find((m) => m.id === id);
    const currentQuantity = existing?.quantity ?? 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
    const quantityChange = newQuantity - currentQuantity;
    const newTotal = currentTotal + quantityChange;

    if (newTotal > selectedTacoSize.maxMeats) {
      return;
    }

    if (newQuantity === 0) {
      setMeats(meats.filter((m) => m.id !== id));
    } else {
      if (existing) {
        setMeats(meats.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)));
      } else {
        if (newTotal <= selectedTacoSize.maxMeats) {
          setMeats([...meats, { id, quantity: newQuantity }]);
        }
      }
    }
  };

  // Reset selections when size changes
  useEffect(() => {
    if (!selectedTacoSize) {
      if (!size) {
        setMeats([]);
        setSauces([]);
        setGarnitures([]);
      }
      return;
    }

    // Check total quantity limit
    const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
    if (currentTotal > selectedTacoSize.maxMeats) {
      let remaining = selectedTacoSize.maxMeats;
      setMeats(
        meats
          .map((m) => {
            const take = Math.min(m.quantity, remaining);
            remaining -= take;
            return { ...m, quantity: take };
          })
          .filter((m) => m.quantity > 0)
      );
    }
    if (sauces.length > selectedTacoSize.maxSauces) {
      setSauces(sauces.slice(0, selectedTacoSize.maxSauces));
    }
    if (!selectedTacoSize.allowGarnitures && garnitures.length > 0) {
      setGarnitures([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Prefill taco from previous order
  const prefillTaco = (taco: Partial<TacoSelection>) => {
    if (taco.size) setSize(taco.size);
    if (taco.meats) setMeats(taco.meats.map((m) => ({ id: m.id, quantity: m.quantity ?? 1 })));
    if (taco.sauces) setSauces(taco.sauces);
    if (taco.garnitures) setGarnitures(taco.garnitures);
    if (taco.note !== undefined) setNote(taco.note);
    if (taco.kind) setKind(taco.kind);
  };

  // Add mystery taco (chef decides everything)
  const addMysteryTaco = (tacoSize: string) => {
    setSize(tacoSize);
    setMeats([]);
    setSauces([]);
    setGarnitures([]);
    setNote('');
    setKind(TacoKind.MYSTERY);
  };

  // Handle size change (clear mystery flag)
  const handleSetSize = (newSize: string) => {
    setSize(newSize);
    if (kind === TacoKind.MYSTERY) {
      setKind(TacoKind.REGULAR);
    }
  };

  // Toggle mystery mode
  const toggleMystery = () => {
    if (kind === TacoKind.MYSTERY) {
      setKind(TacoKind.REGULAR);
    } else {
      setMeats([]);
      setSauces([]);
      setGarnitures([]);
      setKind(TacoKind.MYSTERY);
    }
  };

  return {
    // State accessors
    size,
    meats,
    sauces,
    garnitures,
    extras,
    drinks,
    desserts,
    note,
    kind,

    // State setters
    setSize: handleSetSize,
    setSauces,
    setGarnitures,
    setExtras,
    setDrinks,
    setDesserts,
    setNote,

    // Computed
    selectedTacoSize,
    totalPrice,
    priceBreakdown,

    // Actions
    toggleSelection,
    updateMeatQuantity,
    prefillTaco,
    addMysteryTaco,
    toggleMystery,
  };
}
