import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from '@tacocrew/ui-kit';
import { Droplets, FileText, Leaf, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeatSelector } from '@/components/orders/MeatSelector';
import { SelectionGroup } from '@/components/orders/SelectionGroup';
import type { StockResponse } from '@/lib/api/types';
import type { TacoCustomization } from '@/types/orders';

type TacoBuilderProps = {
  readonly taco: TacoCustomization;
  readonly stock: StockResponse;
  readonly currency: string;
  readonly isSubmitting: boolean;
  readonly onUpdateMeatQuantity: (meatId: string, quantity: number) => void;
  readonly onToggleSauce: (id: string) => void;
  readonly onToggleGarniture: (id: string) => void;
  readonly onNoteChange: (note: string) => void;
};

export function TacoBuilder({
  taco,
  stock,
  currency,
  isSubmitting,
  onUpdateMeatQuantity,
  onToggleSauce,
  onToggleGarniture,
  onNoteChange,
}: TacoBuilderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:space-y-6 sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-2 border-white/10 border-b pb-3 sm:gap-3 sm:pb-4">
          <Avatar color="orange" size="sm" className="sm:size-md">
            <AvatarFallback>
              <Sliders />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-base text-white sm:text-lg">
              {t('orders.create.customizeSection.title')}
            </h2>
            <p className="text-slate-400 text-xs">{t('orders.create.customizeSection.subtitle')}</p>
          </div>
        </div>

        <MeatSelector
          meats={taco.meats}
          stock={stock}
          selectedTacoSize={taco.selectedTacoSize}
          size={taco.size}
          currency={currency}
          isSubmitting={isSubmitting}
          updateMeatQuantity={onUpdateMeatQuantity}
        />

        <Card className="border-white/10 bg-slate-800/30">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-brand-400" />
                <CardTitle className="text-sm text-white normal-case tracking-normal">
                  {t('common.labels.sauces')}
                  <span className="ml-1 text-rose-400">*</span>
                </CardTitle>
              </div>
              {taco.selectedTacoSize?.maxSauces !== undefined && (
                <Badge tone="brand" className="text-xs">
                  {taco.sauces.length}/{taco.selectedTacoSize.maxSauces}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <SelectionGroup
              items={stock.sauces}
              selected={taco.sauces}
              onToggle={onToggleSauce}
              maxSelections={taco.selectedTacoSize?.maxSauces}
              disabled={!taco.size}
            />
            {taco.sauces.map((id) => (
              <input key={id} type="hidden" name="sauces" value={id} />
            ))}
          </CardContent>
        </Card>

        {taco.selectedTacoSize && taco.selectedTacoSize.allowGarnitures && (
          <Card className="border-white/10 bg-slate-800/30">
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2">
                <Leaf size={18} className="text-brand-400" />
                <CardTitle className="text-sm text-white normal-case tracking-normal">
                  {t('common.labels.garnishes')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <SelectionGroup
                items={stock.garnishes}
                selected={taco.garnitures}
                onToggle={onToggleGarniture}
                disabled={!taco.size}
              />
              {taco.garnitures.map((id) => (
                <input key={id} type="hidden" name="garnitures" value={id} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-white/10 bg-slate-800/30">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brand-400" />
            <CardTitle className="text-white">{t('orders.create.notes.title')}</CardTitle>
          </div>
          <CardDescription>{t('orders.create.notes.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="note"
            placeholder={t('common.placeholders.specialInstructions')}
            value={taco.note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="resize-none"
          />
          <input type="hidden" name="note" value={taco.note} />
        </CardContent>
      </Card>
    </>
  );
}
