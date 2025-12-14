import { Alert, Card, CardContent, CardHeader, CardTitle, Modal } from '@tacocrew/ui-kit';
import { Lock, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getOrderCookies } from '@/lib/api/orders';

type CookieInjectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupOrderId: string;
};

interface CookieData {
  cookies: Record<string, string>;
  csrfToken: string;
  orderId?: string;
  transactionId?: string;
  sessionId?: string;
}

export function CookieInjectionModal({
  isOpen,
  onClose,
  groupOrderId,
}: Readonly<CookieInjectionModalProps>) {
  const { t } = useTranslation();
  const [cookieData, setCookieData] = useState<CookieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && groupOrderId) {
      setLoading(true);
      setError(null);
      getOrderCookies(groupOrderId)
        .then((data: CookieData) => {
          setCookieData(data);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : t('orders.common.cookies.error'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, groupOrderId, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.common.cookies.title')}
      description={t('orders.common.cookies.description')}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {loading && (
          <div className="py-8 text-center text-slate-400">
            {t('orders.common.cookies.loading')}
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {cookieData && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-brand-400" />
                  <CardTitle className="text-sm text-white">
                    {t('orders.common.cookies.cookies')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {Object.entries(cookieData.cookies).map(([name, value]) => (
                    <div key={name} className="flex items-start gap-2 font-mono">
                      <span className="min-w-[120px] text-slate-400">{name}:</span>
                      <span className="break-all text-slate-300">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-brand-400" />
                  <CardTitle className="text-sm text-white">
                    {t('orders.common.cookies.csrfToken')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <code className="break-all font-mono text-slate-300 text-xs">
                  {cookieData.csrfToken}
                </code>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
}
