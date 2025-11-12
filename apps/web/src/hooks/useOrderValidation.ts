import { useMemo } from 'react';
import type { MeatSelection, TacoSizeItem } from '@/types/orders';

/**
 * Hook for order validation logic
 */
type UseOrderValidationProps = {
  size: string;
  meats: MeatSelection[];
  sauces: string[];
  garnitures: string[];
  extras: string[];
  drinks: string[];
  desserts: string[];
  selectedTacoSize: TacoSizeItem | null;
  tt: (key: string, options?: Record<string, unknown>) => string;
};

export function useOrderValidation({
  size,
  meats,
  sauces,
  garnitures,
  extras,
  drinks,
  desserts,
  selectedTacoSize,
  tt,
}: UseOrderValidationProps) {
  const totalMeatQuantity = useMemo(() => {
    return meats.reduce((sum, m) => sum + m.quantity, 0);
  }, [meats]);

  const hasTaco = useMemo(() => {
    return size && totalMeatQuantity > 0 && sauces.length > 0;
  }, [size, totalMeatQuantity, sauces.length]);

  const hasOtherItems = useMemo(() => {
    return extras.length > 0 || drinks.length > 0 || desserts.length > 0;
  }, [extras.length, drinks.length, desserts.length]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    // Only validate taco requirements if a taco size is selected
    if (size && meats.length === 0) {
      messages.push(tt('validation.missingMeat'));
    }
    if (size && sauces.length === 0) {
      messages.push(tt('validation.missingSauce'));
    }
    // Garnitures are always optional - no validation needed
    // Only validate if user has selected something (either taco OR other items)
    if (!size && !hasOtherItems) {
      messages.push(tt('validation.missingSelection'));
    }
    return messages;
  }, [size, meats.length, sauces.length, hasOtherItems, tt]);

  const tacoValid = useMemo(() => {
    return (
      !size || // No taco selected is OK
      (totalMeatQuantity > 0 &&
        sauces.length > 0 &&
        (!selectedTacoSize || totalMeatQuantity <= selectedTacoSize.maxMeats) &&
        (!selectedTacoSize || sauces.length <= selectedTacoSize.maxSauces) &&
        // Garnitures are optional - only validate if they're not available (allowGarnitures is false)
        (!selectedTacoSize || selectedTacoSize.allowGarnitures || garnitures.length === 0))
    );
  }, [size, totalMeatQuantity, sauces.length, selectedTacoSize, garnitures.length]);

  const canSubmit = useMemo(() => {
    return (hasTaco || hasOtherItems) && tacoValid;
  }, [hasTaco, hasOtherItems, tacoValid]);

  return {
    totalMeatQuantity,
    hasTaco,
    hasOtherItems,
    validationMessages,
    tacoValid,
    canSubmit,
  };
}
