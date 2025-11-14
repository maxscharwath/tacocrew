import { Link } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { routes } from '../../lib/routes';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';

interface ShareButtonProps {
  readonly groupOrderId: string;
}

export function ShareButton({ groupOrderId }: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const shareUrl = routes.root.orderDetail.url({ orderId: groupOrderId });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className="border-white/10 bg-slate-800/30">
      <CardHeader className="gap-2">
        <CardTitle className="text-white">{t('orders.detail.hero.share.title')}</CardTitle>
        <CardDescription>{t('orders.detail.hero.share.inviteInstructions')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleCopyLink} variant="outline" className="w-full gap-2">
          <Link size={18} />
          {copied
            ? t('orders.detail.hero.share.linkCopied')
            : t('orders.detail.hero.share.copyLink')}
        </Button>
      </CardContent>
    </Card>
  );
}
