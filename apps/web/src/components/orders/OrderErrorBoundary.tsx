/**
 * Error boundary for order creation and detail pages
 * Catches and handles errors gracefully
 */

import { Alert, Button } from '@tacocrew/ui-kit';
import { AlertTriangle, Home } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routes } from '@/lib/routes';
import type { OrderError } from '@/lib/types/order-error';
import { OrderErrorCode } from '@/lib/types/order-error';

interface OrderErrorBoundaryProps {
  children: ReactNode;
  orderError?: OrderError | null;
  onRetry?: () => void;
  fallbackRoute?: string;
}

/**
 * Error display component for order-related errors
 */
export function OrderErrorBoundary({
  children,
  orderError,
  onRetry,
  fallbackRoute = routes.root.orders(),
}: OrderErrorBoundaryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!orderError) {
    return children;
  }

  // Determine error severity and user-friendly message
  const getErrorDisplay = (error: OrderError) => {
    const baseMessage = error.message;

    switch (error.code) {
      case OrderErrorCode.ORDER_NOT_FOUND:
      case OrderErrorCode.GROUP_ORDER_NOT_FOUND:
      case OrderErrorCode.USER_ORDER_NOT_FOUND:
        return {
          title: t('orders.error.notFound.title'),
          message: t('orders.error.notFound.message'),
          severity: 'error' as const,
          canRetry: false,
        };

      case OrderErrorCode.STOCK_LOAD_FAILED:
      case OrderErrorCode.ORDERS_LOAD_FAILED:
      case OrderErrorCode.GROUP_LOAD_FAILED:
        return {
          title: t('orders.error.loadFailed.title'),
          message: t('orders.error.loadFailed.message'),
          severity: 'error' as const,
          canRetry: true,
        };

      case OrderErrorCode.NETWORK_ERROR:
      case OrderErrorCode.REQUEST_TIMEOUT:
        return {
          title: t('orders.error.network.title'),
          message: t('orders.error.network.message'),
          severity: 'error' as const,
          canRetry: true,
        };

      case OrderErrorCode.SERVER_ERROR:
        return {
          title: t('orders.error.server.title'),
          message: t('orders.error.server.message'),
          severity: 'error' as const,
          canRetry: true,
        };

      case OrderErrorCode.INVALID_ORDER_DATA:
      case OrderErrorCode.INVALID_SELECTION:
        return {
          title: t('orders.error.validation.title'),
          message: baseMessage || t('orders.error.validation.message'),
          severity: 'warning' as const,
          canRetry: false,
        };

      default:
        return {
          title: t('orders.error.unknown.title'),
          message: baseMessage || t('orders.error.unknown.message'),
          severity: 'error' as const,
          canRetry: true,
        };
    }
  };

  const errorDisplay = getErrorDisplay(orderError);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-8 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="font-bold text-2xl text-white">{errorDisplay.title}</h1>
          <p className="text-slate-400">{errorDisplay.message}</p>
        </div>

        <Alert tone={errorDisplay.severity}>{orderError.message}</Alert>

        <div className="flex flex-col gap-3 pt-2">
          {errorDisplay.canRetry && onRetry && (
            <Button onClick={onRetry} variant="default" color="brand" fullWidth className="gap-2">
              {t('common.actions.retry')}
            </Button>
          )}

          <Button
            onClick={() => navigate(fallbackRoute)}
            variant="outline"
            fullWidth
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            {t('common.actions.goHome')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && orderError.context && (
          <div className="rounded bg-slate-900 p-4 font-mono text-slate-400 text-xs">
            <div className="font-semibold text-slate-300">Debug Info:</div>
            <pre className="mt-2 overflow-auto">{JSON.stringify(orderError.context, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
