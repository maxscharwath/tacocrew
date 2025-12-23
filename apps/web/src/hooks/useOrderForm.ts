import { useEffect, useState } from 'react';
import type { StockResponse } from '@/lib/api';
import type { UserOrderDetail } from '@/lib/api/orders';
import { TacoKind } from '@/lib/api/types';
import type { MeatSelection, TacoSizeItem } from '@/types/orders';
import { calculateOrderTotalPrice, generatePriceBreakdown } from '@/utils/priceCalculations';

/**
 * Hook for managing order form state
 */
type UseOrderFormProps = {
  stock: StockResponse;
  myOrder?: UserOrderDetail;
};

export function useOrderForm({ stock, myOrder }: UseOrderFormProps) {
  const getDefaultSelections = () => {
    if (!myOrder) {
      return {
        size: '',
        meats: [] as Array<{ id: string; quantity: number }>,
        sauces: [] as string[],
        garnitures: [] as string[],
        extras: [] as string[],
        drinks: [] as string[],
        desserts: [] as string[],
        note: '',
      };
    }

    const taco = myOrder.items.tacos[0];
    const isMystery = taco?.kind === TacoKind.MYSTERY;
    return {
      size: taco?.size ?? '',
      meats:
        taco && !isMystery && taco.meats
          ? taco.meats.map((item: { id: string; quantity?: number }) => ({
              id: item.id,
              quantity: item.quantity ?? 1,
            }))
          : [],
      sauces: taco && !isMystery && taco.sauces ? taco.sauces.map((item: { id: string }) => item.id) : [],
      garnitures:
        taco && !isMystery && taco.garnitures ? taco.garnitures.map((item: { id: string }) => item.id) : [],
      extras: myOrder.items.extras.map((extra: { id: string }) => extra.id),
      drinks: myOrder.items.drinks.map((drink: { id: string }) => drink.id),
      desserts: myOrder.items.desserts.map((dessert: { id: string }) => dessert.id),
      note: taco?.note ?? '',
      kind: taco?.kind ?? TacoKind.REGULAR,
    };
  };

  const defaultSelections = getDefaultSelections();

  const [size, setSize] = useState(defaultSelections.size);
  const [meats, setMeats] = useState<MeatSelection[]>(defaultSelections.meats);
  const [sauces, setSauces] = useState<string[]>(defaultSelections.sauces);
  const [garnitures, setGarnitures] = useState<string[]>(defaultSelections.garnitures);
  const [extras, setExtras] = useState<string[]>(defaultSelections.extras);
  const [drinks, setDrinks] = useState<string[]>(defaultSelections.drinks);
  const [desserts, setDesserts] = useState<string[]>(defaultSelections.desserts);
  const [note, setNote] = useState(defaultSelections.note);
  const [kind, setKind] = useState<TacoKind>(defaultSelections.kind ?? TacoKind.REGULAR);

  const selectedTacoSize: TacoSizeItem | null = size
    ? (stock.tacos.find((t) => t.code === size) ?? null)
    : null;

  const toggleSelection = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
    max?: number
  ) => {
    // Check if item is in stock
    const item = [
      ...stock.sauces,
      ...stock.garnishes,
      ...stock.extras,
      ...stock.drinks,
      ...stock.desserts,
    ].find((i) => i.id === id);
    if (item && !item.in_stock) {
      return; // Don't allow selection of out-of-stock items
    }

    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else if (max === undefined || current.length < max) {
      setter([...current, id]);
    }
  };

  const updateMeatQuantity = (id: string, delta: number) => {
    // Don't allow if no taco size is selected
    if (!size || !selectedTacoSize) {
      return;
    }

    const meatItem = stock.meats.find((m) => m.id === id);
    // Don't allow if item is out of stock
    if (meatItem && !meatItem.in_stock) {
      return;
    }

    const existing = meats.find((m) => m.id === id);
    const currentQuantity = existing?.quantity ?? 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    // Calculate current total quantity
    const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
    const quantityChange = newQuantity - currentQuantity;
    const newTotal = currentTotal + quantityChange;

    // Check max meats limit (total quantity)
    if (newTotal > selectedTacoSize.maxMeats) {
      return; // Don't allow if it would exceed the limit
    }

    if (newQuantity === 0) {
      // Remove meat if quantity becomes 0
      setMeats(meats.filter((m) => m.id !== id));
    } else {
      // Add or update meat quantity
      if (existing) {
        setMeats(meats.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)));
      } else {
        // Check max meats limit before adding (check total quantity)
        if (newTotal <= selectedTacoSize.maxMeats) {
          setMeats([...meats, { id, quantity: newQuantity }]);
        }
      }
    }
  };

  // Reset selections when size changes if they exceed limits
  useEffect(() => {
    if (!selectedTacoSize) {
      // Clear taco-related selections if size is unselected
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
      // Reduce quantities to fit within limit
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

  // Calculate total price
  const totalPrice = calculateOrderTotalPrice(
    selectedTacoSize,
    meats,
    extras,
    drinks,
    desserts,
    stock
  );

  // Generate price breakdown
  const priceBreakdown = generatePriceBreakdown(selectedTacoSize, extras, drinks, desserts, stock);

  /**
   * Prefill form with taco data - only sets form state, does NOT validate or submit
   * User must manually review and submit the form after prefilling
   */
  const prefillTaco = (taco: {
    size: string;
    meats?: Array<{ id: string; quantity: number }>;
    sauces?: Array<{ id: string }>;
    garnitures?: Array<{ id: string }>;
    note?: string;
    kind?: TacoKind;
  }) => {
    // Only update form state - no validation, no submission
    setSize(taco.size);
    setMeats(taco.meats?.map((m) => ({ id: m.id, quantity: m.quantity ?? 1 })) ?? []);
    setSauces(taco.sauces?.map((s) => s.id) ?? []);
    setGarnitures(taco.garnitures?.map((g) => g.id) ?? []);
    setNote(taco.note ?? '');
    setKind(taco.kind ?? TacoKind.REGULAR);
  };

  /**
   * Add a mystery taco - chef chooses everything (meats, sauces, garnitures)
   */
  const addMysteryTaco = (tacoSize: string) => {
    setSize(tacoSize);
    setMeats([]); // No meats - chef decides
    setSauces([]); // No sauces - chef decides
    setGarnitures([]); // No garnitures - chef decides
    setNote('');
    setKind(TacoKind.MYSTERY);
  };

  /**
   * Clear mystery state when user manually selects a size
   */
  const handleSetSize = (newSize: string) => {
    setSize(newSize);
    if (kind === TacoKind.MYSTERY) {
      setKind(TacoKind.REGULAR);
    }
  };

  /**
   * Toggle mystery mode - when enabled, clears all ingredients (chef picks everything)
   */
  const toggleMystery = () => {
    if (kind === TacoKind.MYSTERY) {
      // Turning off mystery - keep the size, just clear mystery flag
      setKind(TacoKind.REGULAR);
    } else {
      // Turning on mystery - clear all ingredients
      setMeats([]);
      setSauces([]);
      setGarnitures([]);
      setKind(TacoKind.MYSTERY);
    }
  };

  return {
    // State
    size,
    setSize: handleSetSize,
    meats,
    sauces,
    setSauces,
    garnitures,
    setGarnitures,
    extras,
    setExtras,
    drinks,
    setDrinks,
    desserts,
    setDesserts,
    note,
    setNote,
    kind,
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
