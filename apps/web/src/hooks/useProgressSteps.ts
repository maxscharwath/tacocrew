import { Dices, Droplets, Ham, Leaf, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TacoKind } from '@/lib/api/types';
import type { TacoSizeItem } from '@/types/orders';

type ProgressStep = {
  key: string;
  completed: boolean;
  label: string;
  icon: typeof Ruler;
  description: string;
};

type UseProgressStepsProps = {
  size: string | null;
  selectedTacoSize: TacoSizeItem | null;
  totalMeatQuantity: number;
  sauces: string[];
  garnitures: string[];
  kind?: TacoKind;
};

export function useProgressSteps({
  size,
  selectedTacoSize,
  totalMeatQuantity,
  sauces,
  garnitures,
  kind = TacoKind.REGULAR,
}: UseProgressStepsProps): ProgressStep[] {
  const { t } = useTranslation();
  const isMystery = kind === TacoKind.MYSTERY;

  if (!size) {
    return [];
  }

  // Mystery tacos only need size - show simplified progress
  if (isMystery) {
    return [
      {
        key: 'size',
        completed: true,
        label: t('orders.create.progress.size.label'),
        icon: Ruler,
        description: selectedTacoSize?.name ?? t('orders.create.progress.size.empty'),
      },
      {
        key: 'ready',
        completed: true,
        label: t('orders.create.mystery.progress.ready'),
        icon: Dices,
        description: t('orders.create.mystery.progress.readyDescription'),
      },
    ];
  }

  // Regular tacos show full progress
  return [
    {
      key: 'size',
      completed: true,
      label: t('orders.create.progress.size.label'),
      icon: Ruler,
      description: selectedTacoSize?.name ?? t('orders.create.progress.size.empty'),
    },
    {
      key: 'meats',
      completed: totalMeatQuantity > 0,
      label: t('common.labels.meats'),
      icon: Ham,
      description:
        totalMeatQuantity > 0
          ? selectedTacoSize?.maxMeats
            ? t('orders.create.progress.meats.selectedWithMax', {
                count: totalMeatQuantity,
                max: selectedTacoSize.maxMeats,
              })
            : t('orders.create.progress.meats.selected', { count: totalMeatQuantity })
          : t('orders.create.progress.meats.empty'),
    },
    {
      key: 'sauces',
      completed: sauces.length > 0,
      label: t('common.labels.sauces'),
      icon: Droplets,
      description:
        sauces.length > 0
          ? selectedTacoSize?.maxSauces
            ? t('orders.create.progress.sauces.selectedWithMax', {
                count: sauces.length,
                max: selectedTacoSize.maxSauces,
              })
            : t('orders.create.progress.sauces.selected', { count: sauces.length })
          : t('orders.create.progress.sauces.empty'),
    },
    ...(selectedTacoSize?.allowGarnitures
      ? [
          {
            key: 'garnishes',
            completed: garnitures.length > 0,
            label: t('common.labels.garnishes'),
            icon: Leaf,
            description:
              garnitures.length > 0
                ? t('orders.create.progress.garnishes.selected', { count: garnitures.length })
                : t('orders.create.progress.garnishes.empty'),
          },
        ]
      : []),
  ];
}
