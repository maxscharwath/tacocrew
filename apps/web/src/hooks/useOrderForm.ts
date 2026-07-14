/**
 * Order form state hook.
 *
 * The whole form lives in a single `useState` so the resync-from-server case
 * is one assignment, not nine. That removes a class of bugs where a focus
 * refetch would partially re-sync state and wipe in-progress edits.
 *
 * External API stays flat (`size`, `meats`, `setSauces`, …) for the consumers.
 */

import { useEffect, useState } from 'react';
import type { StockResponse } from '@/lib/api';
import type { UserOrderDetail } from '@/lib/api/orders';
import type { CroustyOrderInput } from '@/lib/api/types';
import { TacoKind } from '@/lib/api/types';
import {
  buildCartLines,
  collectFreeLineIds,
  findApplicablePromos,
  sumPromoSavings,
} from '@/lib/promos';
import { isOptionAvailableForSize } from '@/lib/taco-config';
import type { MeatSelection, TacoSelection } from '@/types/form-data';
import type { TacoSizeItem } from '@/types/orders';
import { calculateOrderTotalPrice, generatePriceBreakdown } from '@/utils/priceCalculations';

interface UseOrderFormProps {
  stock?: StockResponse;
  myOrder?: UserOrderDetail;
}

interface FormState {
  size: string;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  extras: string[];
  drinks: string[];
  desserts: string[];
  crousties: CroustyOrderInput[];
  note: string;
  kind: TacoKind;
}

const EMPTY_FORM: FormState = {
  size: '',
  meats: [],
  sauces: [],
  garnitures: [],
  extras: [],
  drinks: [],
  desserts: [],
  crousties: [],
  note: '',
  kind: TacoKind.REGULAR,
};

function buildFormState(myOrder?: UserOrderDetail): FormState {
  if (!myOrder) return EMPTY_FORM;
  const taco = myOrder.items.tacos[0];
  const isMystery = taco?.kind === TacoKind.MYSTERY;

  return {
    size: taco?.size ?? '',
    meats:
      taco && !isMystery && taco.meats
        ? taco.meats.map((item) => ({ id: item.id, quantity: item.quantity ?? 1 }))
        : [],
    sauces: taco && !isMystery && taco.sauces ? taco.sauces.map((item) => item.id) : [],
    garnitures: taco && !isMystery && taco.garnitures ? taco.garnitures.map((item) => item.id) : [],
    extras: myOrder.items.extras.map((extra) => extra.id),
    drinks: myOrder.items.drinks.map((drink) => drink.id),
    desserts: myOrder.items.desserts.map((dessert) => dessert.id),
    crousties: (myOrder.items.crousties ?? []).map((crousty) => ({
      code: crousty.code,
      options: crousty.options,
      quantity: crousty.quantity,
    })),
    note: taco?.note ?? '',
    kind: taco?.kind ?? TacoKind.REGULAR,
  };
}

/** A Crousty line resolved against stock for display + pricing in the summary. */
export interface CroustyLineView {
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  optionsLabel: string;
}

/** Resolve a Crousty line to its display name, unit price, and option summary. */
function resolveCroustyLine(line: CroustyOrderInput, stock: StockResponse): CroustyLineView {
  const product = stock.crousties.find((p) => p.code === line.code);
  let unitPrice = product?.price.value ?? 0;
  for (const selection of line.options) {
    const group = product?.optionGroups.find((g) => g.name === selection.groupName);
    const option = group?.options.find((o) => o.name === selection.optionName);
    if (option?.price) unitPrice += option.price.value;
  }
  return {
    code: line.code,
    name: product?.name ?? line.code,
    unitPrice,
    quantity: line.quantity ?? 1,
    optionsLabel: line.options.map((o) => o.optionName).join(' · '),
  };
}

function findTacoSize(stock: StockResponse | undefined, size: string): TacoSizeItem | null {
  if (!stock || !size) return null;
  return stock.tacos.find((t) => t.code === size) ?? null;
}

function isItemInStock(stock: StockResponse | undefined, id: string): boolean {
  if (!stock) return true;
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

export function useOrderForm({ stock, myOrder }: UseOrderFormProps) {
  const [form, setForm] = useState<FormState>(() => buildFormState(myOrder));

  // Re-sync only when the *identity* of the edited order changes (initial
  // fetch completing or navigating to a different order). Window-focus
  // refetches return the same id, so we skip them and keep the user's edits.
  const editedId = myOrder?.id ?? null;
  useEffect(() => {
    setForm(buildFormState(myOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedId]);

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }));

  const selectedTacoSize = findTacoSize(stock, form.size);

  const fallbackStock: StockResponse = {
    tacos: [],
    meats: [],
    sauces: [],
    garnishes: [],
    extras: [],
    drinks: [],
    desserts: [],
    crousties: [],
    promos: [],
  };

  const effectiveStock = stock ?? fallbackStock;
  const totalPrice = calculateOrderTotalPrice(
    selectedTacoSize,
    form.meats,
    form.extras,
    form.drinks,
    form.desserts,
    effectiveStock
  );
  const priceBreakdown = generatePriceBreakdown(
    selectedTacoSize,
    form.extras,
    form.drinks,
    form.desserts,
    effectiveStock
  );
  const croustyLines = form.crousties.map((line) => resolveCroustyLine(line, effectiveStock));
  const croustiesTotal = croustyLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const totalWithCrousties = totalPrice + croustiesTotal;

  const cartLines = buildCartLines(form.drinks, form.desserts, form.extras, effectiveStock);
  const appliedPromos = findApplicablePromos(form.size, cartLines, effectiveStock.promos);
  const freeLineIds = collectFreeLineIds(appliedPromos);
  const promoSavings = sumPromoSavings(appliedPromos);
  const totalPriceAfterPromos = Math.max(totalWithCrousties - promoSavings, 0);

  const addCrousty = (line: CroustyOrderInput): void => {
    setForm((prev) => ({ ...prev, crousties: [...prev.crousties, line] }));
  };
  const removeCrousty = (index: number): void => {
    setForm((prev) => ({ ...prev, crousties: prev.crousties.filter((_, i) => i !== index) }));
  };

  const toggleSelection = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
    max?: number
  ) => {
    if (!isItemInStock(stock, id)) return;
    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else if (max === undefined || current.length < max) {
      setter([...current, id]);
    }
  };

  const updateMeatQuantity = (id: string, delta: number) => {
    if (!form.size || !selectedTacoSize || !stock) return;

    const meatItem = stock.meats.find((m) => m.id === id);
    if (meatItem && !meatItem.in_stock) return;

    setForm((prev) => {
      const existing = prev.meats.find((m) => m.id === id);
      const currentQuantity = existing?.quantity ?? 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      const newTotal =
        prev.meats.reduce((sum, m) => sum + m.quantity, 0) + (newQuantity - currentQuantity);
      if (newTotal > selectedTacoSize.maxMeats) return prev;

      if (newQuantity === 0) {
        return { ...prev, meats: prev.meats.filter((m) => m.id !== id) };
      }
      if (existing) {
        return {
          ...prev,
          meats: prev.meats.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)),
        };
      }
      return { ...prev, meats: [...prev.meats, { id, quantity: newQuantity }] };
    });
  };

  // Clamp selections to the new size's limits when the user changes size.
  useEffect(() => {
    if (!selectedTacoSize) {
      if (!form.size) patch({ meats: [], sauces: [], garnitures: [] });
      return;
    }
    setForm((prev) => {
      const next = { ...prev };

      // Drop options the newly-selected size doesn't offer (option sets differ
      // per size — e.g. the Bowl offers only 4 meats). Without this, a stale
      // selection would submit an itemId the size rejects and fail the order.
      if (stock) {
        const meatById = new Map(stock.meats.map((m) => [m.id, m]));
        const sauceById = new Map(stock.sauces.map((s) => [s.id, s]));
        const garnishById = new Map(stock.garnishes.map((g) => [g.id, g]));
        next.meats = prev.meats.filter((m) => {
          const item = meatById.get(m.id);
          return !item || isOptionAvailableForSize(item, form.size);
        });
        next.sauces = prev.sauces.filter((id) => {
          const item = sauceById.get(id);
          return !item || isOptionAvailableForSize(item, form.size);
        });
        next.garnitures = prev.garnitures.filter((id) => {
          const item = garnishById.get(id);
          return !item || isOptionAvailableForSize(item, form.size);
        });
      }

      const totalMeats = next.meats.reduce((sum, m) => sum + m.quantity, 0);
      if (totalMeats > selectedTacoSize.maxMeats) {
        let remaining = selectedTacoSize.maxMeats;
        next.meats = next.meats
          .map((m) => {
            const take = Math.min(m.quantity, remaining);
            remaining -= take;
            return { ...m, quantity: take };
          })
          .filter((m) => m.quantity > 0);
      }
      if (next.sauces.length > selectedTacoSize.maxSauces) {
        next.sauces = next.sauces.slice(0, selectedTacoSize.maxSauces);
      }
      if (!selectedTacoSize.allowGarnitures && next.garnitures.length > 0) {
        next.garnitures = [];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.size]);

  const prefillTaco = (taco: Partial<TacoSelection>) => {
    patch({
      ...(taco.size !== undefined && { size: taco.size }),
      ...(taco.meats !== undefined && {
        meats: taco.meats.map((m) => ({ id: m.id, quantity: m.quantity ?? 1 })),
      }),
      ...(taco.sauces !== undefined && { sauces: taco.sauces }),
      ...(taco.garnitures !== undefined && { garnitures: taco.garnitures }),
      ...(taco.note !== undefined && { note: taco.note }),
      ...(taco.kind !== undefined && { kind: taco.kind }),
    });
  };

  const addMysteryTaco = (tacoSize: string) => {
    patch({
      size: tacoSize,
      meats: [],
      sauces: [],
      garnitures: [],
      note: '',
      kind: TacoKind.MYSTERY,
    });
  };

  const setSize = (newSize: string) => {
    patch({
      size: newSize,
      ...(form.kind === TacoKind.MYSTERY && { kind: TacoKind.REGULAR }),
    });
  };

  const toggleMystery = () => {
    if (form.kind === TacoKind.MYSTERY) {
      patch({ kind: TacoKind.REGULAR });
    } else {
      patch({ meats: [], sauces: [], garnitures: [], kind: TacoKind.MYSTERY });
    }
  };

  return {
    size: form.size,
    meats: form.meats,
    sauces: form.sauces,
    garnitures: form.garnitures,
    extras: form.extras,
    drinks: form.drinks,
    desserts: form.desserts,
    crousties: form.crousties,
    croustyLines,
    croustiesTotal,
    note: form.note,
    kind: form.kind,

    addCrousty,
    removeCrousty,
    setSize,
    setSauces: (sauces: string[]) => patch({ sauces }),
    setGarnitures: (garnitures: string[]) => patch({ garnitures }),
    setExtras: (extras: string[]) => patch({ extras }),
    setDrinks: (drinks: string[]) => patch({ drinks }),
    setDesserts: (desserts: string[]) => patch({ desserts }),
    setNote: (note: string) => patch({ note }),

    selectedTacoSize,
    totalPrice: totalWithCrousties,
    priceBreakdown,
    appliedPromos,
    freeLineIds,
    promoSavings,
    totalPriceAfterPromos,

    toggleSelection,
    updateMeatQuantity,
    prefillTaco,
    addMysteryTaco,
    toggleMystery,
  };
}
