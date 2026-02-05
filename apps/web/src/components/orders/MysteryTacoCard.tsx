import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { Dices, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StockResponse } from '@/lib/api';

type MysteryTacoCardProps = Readonly<{
  stock: StockResponse;
  onAddMysteryTaco: (size: string) => void;
  disabled?: boolean;
}>;

/**
 * MysteryTacoCard - A call-to-action card for ordering a mystery taco
 * Mystery tacos have the chef choose the meats for you
 */
export function MysteryTacoCard({ stock, onAddMysteryTaco, disabled }: MysteryTacoCardProps) {
  const { t } = useTranslation();

  // Use the smallest size (L) as default for mystery tacos
  const defaultSize = stock.tacos.find((s) => s.code === 'tacos_L');
  const price = defaultSize?.price;

  return (
    <Card className="overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-slate-900/50 to-indigo-900/30">
      <CardHeader className="gap-2 sm:gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/25 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Dices className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            <div className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 sm:h-5 sm:w-5">
              <Sparkles className="h-2.5 w-2.5 text-yellow-900 sm:h-3 sm:w-3" />
            </div>
          </div>
          <div>
            <CardTitle className="text-white">{t('orders.create.mystery.title')}</CardTitle>
            <CardDescription className="mt-0.5">
              {t('orders.create.mystery.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm">{t('orders.create.mystery.explanation')}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-slate-400 text-sm">
            {price && (
              <span>
                {t('orders.create.mystery.startingAt')}{' '}
                <span className="font-semibold text-white">
                  {price.value.toFixed(2)} {price.currency}
                </span>
              </span>
            )}
          </div>
          <Button
            type="button"
            onClick={() => defaultSize && onAddMysteryTaco(defaultSize.code)}
            disabled={disabled || !defaultSize}
            className="gap-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
          >
            <Dices className="h-4 w-4" />
            {t('orders.create.mystery.button')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
