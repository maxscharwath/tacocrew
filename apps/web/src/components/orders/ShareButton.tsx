import { Copy01 } from '@untitledui/icons/Copy01';
import { Link01 } from '@untitledui/icons/Link01';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';

interface ShareButtonProps {
  groupOrderId: string;
  shareCode: string | null;
  orderName?: string | null;
}

export function ShareButton({ groupOrderId, shareCode, orderName }: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const shareUrl = `${window.location.origin}/orders/${groupOrderId}`;
  const joinUrl = shareCode ? `${window.location.origin}/join/${shareCode}` : shareUrl;

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(joinUrl, 'link');
  };

  const handleCopyCode = () => {
    if (shareCode) {
      copyToClipboard(shareCode, 'code');
    }
  };

  const handleShareToSlack = () => {
    // Format message for Slack
    const message = orderName ? `${orderName}\n${joinUrl}` : `Join our group order!\n${joinUrl}`;

    // Try Web Share API first (works on mobile and some desktop browsers)
    if (navigator.share) {
      navigator
        .share({
          title: orderName || 'Join our group order!',
          text: message,
          url: joinUrl,
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          // Fallback to copying to clipboard
          copyToClipboard(message, 'link');
        });
    } else {
      // Fallback: Copy formatted message to clipboard
      // User can paste it into Slack
      copyToClipboard(message, 'link');
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <h3 className="mb-4 font-semibold text-lg text-white">
        {t('orders.detail.hero.share.title')}
      </h3>

      <div className="space-y-4">
        {/* Share Code - if available */}
        {shareCode && (
          <div>
            <div className="flex items-stretch overflow-hidden rounded-2xl border border-white/10">
              <div className="flex flex-1 items-center justify-center bg-slate-800/60 px-4 py-3 text-center font-bold font-mono text-white text-xl">
                {shareCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="flex shrink-0 items-center justify-center gap-2 border-white/10 border-l bg-slate-800/80 px-4 py-3 font-semibold text-slate-100 text-sm transition-colors hover:border-brand-400/60 hover:bg-slate-800 hover:text-brand-50"
              >
                <Copy01 size={18} />
                {copied === 'code'
                  ? t('orders.detail.hero.share.codeCopied')
                  : t('orders.detail.hero.share.copyCode')}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2">
            <Link01 size={18} />
            {copied === 'link'
              ? t('orders.detail.hero.share.linkCopied')
              : t('orders.detail.hero.share.copyLink')}
          </Button>
          <Button onClick={handleShareToSlack} variant="outline" className="flex-1 gap-2">
            {t('orders.detail.hero.share.shareToSlack')}
          </Button>
        </div>

        {/* Instructions */}
        <p className="border-white/10 border-t pt-2 text-slate-400 text-sm">
          {t('orders.detail.hero.share.inviteInstructions')}
        </p>
      </div>
    </div>
  );
}
