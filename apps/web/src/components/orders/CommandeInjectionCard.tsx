import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tacocrew/ui-kit';
import { Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderPreview } from '@/lib/api/types';
import {
  buildCommandeCartPayload,
  buildCommandeInjectionSnippet,
  type CommandeCartServiceType,
  DEFAULT_COMMANDE_RESTAURANT_ID,
  DEFAULT_COMMANDE_RESTAURANT_NAME,
  DEFAULT_COMMANDE_RESTAURANT_SLUG,
} from '@/lib/commande-cart-injection';

interface CommandeInjectionCardProps {
  readonly orderPreview: OrderPreview;
  readonly restaurantId?: string;
  readonly restaurantName?: string;
  readonly restaurantSlug?: string;
  readonly serviceType?: CommandeCartServiceType;
}

const COPIED_FEEDBACK_MS = 2000;

export function CommandeInjectionCard({
  orderPreview,
  restaurantId = DEFAULT_COMMANDE_RESTAURANT_ID,
  restaurantName = DEFAULT_COMMANDE_RESTAURANT_NAME,
  restaurantSlug = DEFAULT_COMMANDE_RESTAURANT_SLUG,
  serviceType = 'takeaway',
}: CommandeInjectionCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Memoise so the snippet (and its embedded cart ids) stabilises per render
  // cycle — otherwise "Copier" would copy a slightly different payload than
  // the one displayed.
  const snippet = useMemo(() => {
    const meta = {
      restaurantId: restaurantId ?? orderPreview.restaurantId,
      restaurantName,
      restaurantSlug,
    };
    const cart = buildCommandeCartPayload(orderPreview, meta, { serviceType });
    return buildCommandeInjectionSnippet(cart, meta, serviceType);
  }, [orderPreview, restaurantId, restaurantName, restaurantSlug, serviceType]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch (_error) {
      // Clipboard may be unavailable (permissions, insecure context); the
      // snippet is still selectable manually in the <pre>.
    }
  };

  const handleOpenCommande = () => {
    window.open(`https://commande.app/${restaurantSlug}`, '_blank', 'noopener');
  };

  return (
    <Card className="border-white/10 bg-slate-900/60">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand-400 via-brand-500 to-rose-500">
            <Terminal size={20} className="text-white" />
          </div>
          <div>
            <CardTitle className="text-white">{t('orders.injection.title')}</CardTitle>
            <CardDescription>{t('orders.injection.explainer')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre
          className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-slate-200 text-xs selection:bg-brand-500/30"
          aria-label={t('orders.injection.title')}
        >
          <code>{snippet}</code>
        </pre>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy} variant="default" className="gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t('orders.injection.copiedFeedback') : t('orders.injection.copyButton')}
          </Button>
          <Button onClick={handleOpenCommande} variant="outline" className="gap-2">
            <ExternalLink size={16} />
            {t('orders.injection.openButton')}
          </Button>
        </div>
        <p className="text-slate-400 text-xs">{t('orders.injection.footnote')}</p>
      </CardContent>
    </Card>
  );
}
