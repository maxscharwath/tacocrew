import { CheckCircle2, Copy } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Button, Card, CardContent, CardHeader } from '@/components/ui';
import type { TacoOrder } from '@/lib/api/types';
import { formatTacoSizeName, TACO_SIZE_CONFIG } from '@/lib/taco-config';
import { cn } from '@/lib/utils';

type TacoCardProps = {
  readonly taco: TacoOrder;
  readonly badge?: ReactNode;
  readonly footer?: ReactNode;
  readonly showTacoID?: boolean;
  readonly className?: string;
};

export function TacoCard({ taco, badge, footer, showTacoID = false, className }: TacoCardProps) {
  const { t } = useTranslation();
  const [copiedTacoID, setCopiedTacoID] = useState(false);
  const tacoConfig = TACO_SIZE_CONFIG[taco.size];
  const sizeName = formatTacoSizeName(taco.size);

  const handleCopyTacoID = async () => {
    if (!taco.tacoID) return;
    try {
      await navigator.clipboard.writeText(taco.tacoID);
      setCopiedTacoID(true);
      setTimeout(() => setCopiedTacoID(false), 2000);
    } catch (err) {
      console.error('Failed to copy tacoID:', err);
    }
  };

  const defaultFooter =
    showTacoID && taco.tacoID ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopyTacoID}
        className="h-auto w-full justify-between gap-2 px-2 py-1.5"
        title={copiedTacoID ? 'Copied!' : 'Copy tacoID'}
      >
        <div className="min-w-0 flex-1 truncate text-left">
          <div className="font-semibold text-slate-400 text-xs uppercase tracking-wide">tacoID</div>
          <div className="mt-0.5 truncate font-mono text-slate-300 text-xs">{taco.tacoID}</div>
        </div>
        {copiedTacoID ? (
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
        ) : (
          <Copy size={14} className="shrink-0 text-slate-400" />
        )}
      </Button>
    ) : null;

  return (
    <Card
      className={cn(
        'group hover:-translate-y-0.5 relative flex flex-col border-brand-400/60 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-all duration-300 hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40',
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar color="brandHero" size="md" variant="elevated">
            <span className="text-xl">{tacoConfig.emoji}</span>
          </Avatar>
          <div className="min-w-0 flex-1">
            {badge && <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{badge}</div>}
            <p className="font-bold text-sm text-white leading-tight">{sizeName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-2">
          {taco.quantity > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand" className="text-[11px]">
                {t('orders.detail.list.tagCounts.tacos', { count: taco.quantity })}
              </Badge>
            </div>
          )}
          {taco.meats.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {taco.meats.map((meat, idx) => (
                <Badge
                  key={`taco-meat-${meat.name}-${meat.quantity ?? 1}-${idx}`}
                  tone="warning"
                  className="text-[11px]"
                >
                  {meat.name}
                  {meat.quantity > 1 && ` ×${meat.quantity}`}
                </Badge>
              ))}
            </div>
          )}
          {taco.sauces.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {taco.sauces.map((sauce, idx) => (
                <Badge
                  key={`taco-sauce-${sauce.name}-${idx}`}
                  tone="neutral"
                  className="text-[11px]"
                >
                  {sauce.name}
                </Badge>
              ))}
            </div>
          )}
          {taco.garnitures.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {taco.garnitures.map((garniture, idx) => (
                <Badge
                  key={`taco-garniture-${garniture.name}-${idx}`}
                  tone="success"
                  className="text-[11px]"
                >
                  {garniture.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {(footer || defaultFooter) && (
          <div className="mt-auto flex shrink-0 items-center justify-between border-white/10 border-t pt-3">
            {footer || defaultFooter}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
