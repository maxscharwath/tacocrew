import { useTranslation } from 'react-i18next';
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
}: UseOrderValidationProps) {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`orders.create.${key}`, options);
  const totalMeatQuantity = meats.reduce((sum, m) => sum + m.quantity, 0);

  const hasTaco = size && totalMeatQuantity > 0 && sauces.length > 0;

  const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;

  const validationMessages = (() => {
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
  })();

  const tacoValid =
    !size || // No taco selected is OK
    (totalMeatQuantity > 0 &&
      sauces.length > 0 &&
      (!selectedTacoSize || totalMeatQuantity <= selectedTacoSize.maxMeats) &&
      (!selectedTacoSize || sauces.length <= selectedTacoSize.maxSauces) &&
      // Garnitures are optional - only validate if they're not available (allowGarnitures is false)
      (!selectedTacoSize || selectedTacoSize.allowGarnitures || garnitures.length === 0));

  const canSubmit = (hasTaco || hasOtherItems) && tacoValid;

  return {
    totalMeatQuantity,
    hasTaco,
    hasOtherItems,
    validationMessages,
    tacoValid,
    canSubmit,
  };
}
