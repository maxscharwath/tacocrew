import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Textarea,
} from '@tacocrew/ui-kit';
import { Beef, Dices, Droplets, FileText, Leaf, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TacoKind } from '@/lib/api/types';
import { MeatSelector } from '@/components/orders/MeatSelector';
import { SelectionGroup } from '@/components/orders/SelectionGroup';
import type { StockResponse } from '@/lib/api/types';
import type { TacoCustomization } from '@/types/orders';

type TacoBuilderProps = Readonly<{
  taco: TacoCustomization;
  stock: StockResponse;
  isSubmitting: boolean;
  kind?: TacoKind;
  onUpdateMeatQuantity: (meatId: string, quantity: number) => void;
  onToggleSauce: (id: string) => void;
  onToggleGarniture: (id: string) => void;
  onNoteChange: (note: string) => void;
  onToggleMystery: () => void;
}>;

export function TacoBuilder({
  taco,
  stock,
  isSubmitting,
  kind,
  onUpdateMeatQuantity,
  onToggleSauce,
  onToggleGarniture,
  onNoteChange,
  onToggleMystery,
}: TacoBuilderProps) {
  const { t } = useTranslation();
  const isMystery = kind === TacoKind.MYSTERY;

  return (
    <>
      {/* Mystery Taco Toggle */}
      <div
        className={`group w-full rounded-2xl border p-4 transition-all duration-200 sm:rounded-3xl sm:p-5 ${
          isMystery
            ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-indigo-900/40 shadow-lg shadow-purple-500/10'
            : 'border-white/10 bg-slate-900/30 hover:border-purple-500/30 hover:bg-slate-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all sm:h-12 sm:w-12 sm:rounded-2xl ${
              isMystery
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/25'
                : 'bg-slate-800 group-hover:bg-purple-900/50'
            }`}
          >
            <Dices
              className={`h-5 w-5 sm:h-6 sm:w-6 ${isMystery ? 'text-white' : 'text-purple-400'}`}
            />
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${isMystery ? 'text-purple-100' : 'text-white'}`}>
              {t('orders.create.mystery.toggleTitle')}
            </p>
            <p className={`text-sm ${isMystery ? 'text-purple-300/80' : 'text-slate-400'}`}>
              {isMystery
                ? t('orders.create.mystery.toggleActiveHint')
                : t('orders.create.mystery.toggleHint')}
            </p>
          </div>
          <Switch
            checked={isMystery}
            onCheckedChange={() => onToggleMystery()}
            disabled={isSubmitting}
            color="violet"
            size="md"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:space-y-6 sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-2 border-white/10 border-b pb-3 sm:gap-3 sm:pb-4">
          <Avatar color={isMystery ? 'violet' : 'orange'} size="sm" className="sm:size-md">
            <AvatarFallback>{isMystery ? <Dices /> : <Sliders />}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-base text-white sm:text-lg">
              {isMystery
                ? t('orders.create.mystery.customizeTitle')
                : t('orders.create.customizeSection.title')}
            </h2>
            <p className="text-slate-400 text-xs">
              {isMystery
                ? t('orders.create.mystery.customizeSubtitle')
                : t('orders.create.customizeSection.subtitle')}
            </p>
          </div>
        </div>

        {isMystery ? (
          <div className="space-y-3 rounded-xl border border-purple-500/30 bg-purple-900/20 p-4">
            <div className="flex items-center gap-3">
              <Dices className="h-8 w-8 text-purple-400" />
              <div>
                <p className="font-medium text-purple-200">
                  {t('orders.create.mystery.fullSurprise')}
                </p>
                <p className="text-purple-300/70 text-sm">
                  {t('orders.create.mystery.fullSurpriseHint')}
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-purple-800/30 px-3 py-2">
                <Beef className="h-4 w-4 text-purple-300" />
                <span className="text-purple-200">{t('orders.create.mystery.surpriseMeats')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-purple-800/30 px-3 py-2">
                <Droplets className="h-4 w-4 text-purple-300" />
                <span className="text-purple-200">{t('orders.create.mystery.surpriseSauces')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-purple-800/30 px-3 py-2">
                <Leaf className="h-4 w-4 text-purple-300" />
                <span className="text-purple-200">
                  {t('orders.create.mystery.surpriseGarnitures')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <MeatSelector
              meats={taco.meats}
              stock={stock}
              selectedTacoSize={taco.selectedTacoSize}
              size={taco.size}
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
          </>
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
