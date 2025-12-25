import { useTranslation } from 'react-i18next';
import { TacoKind } from '@/lib/api/types';
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
  kind?: TacoKind;
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
  kind = TacoKind.REGULAR,
}: UseOrderValidationProps) {
  const { t } = useTranslation();
  const totalMeatQuantity = meats.reduce((sum, m) => sum + m.quantity, 0);
  const isMystery = kind === TacoKind.MYSTERY;

  // Mystery tacos don't need meats, sauces or garnitures (chef decides everything)
  // Regular tacos: meats and sauces will be added automatically if not selected (handled on submit)
  const hasTaco = size && (isMystery || true); // Size selection is enough, meats/sauces added automatically

  const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;

  const validationMessages = (() => {
    const messages: string[] = [];
    // Only validate if user has selected something (either taco OR other items)
    if (!size && !hasOtherItems) {
      messages.push(t('orders.create.validation.missingSelection'));
    }
    return messages;
  })();

  const tacoValid =
    !size || // No taco selected is OK
    // Mystery taco: chef picks everything, just needs a size
    isMystery ||
    // Regular taco: validate limits if items are selected, but don't require them
    ((!selectedTacoSize || totalMeatQuantity <= selectedTacoSize.maxMeats) &&
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
    kind,
  };
}
