import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  toast,
} from '@tacocrew/ui-kit';
import { Bell, Laptop, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '@/hooks';
import {
  type PushSubscriptionInfo,
  useDeletePushSubscription,
  usePushSubscriptions,
  useSendTestNotification,
} from '@/lib/api/push-notifications';

/**
 * Parse user agent string to get a friendly device name
 */
function parseUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect Browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  return `${browser} on ${os}`;
}

/**
 * List of push notification subscriptions
 */
function PushSubscriptionsList({
  isLoading,
  subscriptions,
  onDeleteClick,
}: Readonly<{
  isLoading: boolean;
  subscriptions: PushSubscriptionInfo[];
  onDeleteClick: (id: string) => void;
}>) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="py-4 text-center text-slate-400">{t('account.loading')}</div>;
  }

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={t('account.pushNotifications.devices.emptyState.title')}
        description={t('account.pushNotifications.devices.emptyState.description')}
      />
    );
  }

  return (
    <div className="space-y-2">
      {subscriptions.map((subscription) => {
        const deviceName = subscription.userAgent
          ? parseUserAgent(subscription.userAgent)
          : t('account.pushNotifications.devices.unknownDevice');
        return (
          <div
            key={subscription.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/50">
                <Laptop className="h-5 w-5 text-slate-300" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate font-medium text-white">{deviceName}</div>
                <div className="mt-1 text-slate-400 text-sm">
                  {t('account.pushNotifications.devices.registered')}{' '}
                  {new Date(subscription.createdAt).toLocaleDateString()}
                </div>
                {subscription.userAgent && (
                  <div className="mt-1 truncate text-slate-500 text-xs">
                    {subscription.userAgent}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:ml-2">
              <Button
                onClick={() => {
                  onDeleteClick(subscription.id);
                }}
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
              >
                {t('account.pushNotifications.devices.delete')}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PushNotificationManager() {
  const { t } = useTranslation();
  const [showDeleteSubscriptionDialog, setShowDeleteSubscriptionDialog] = useState<string | null>(
    null
  );

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isSubscribing: isPushSubscribing,
    permission: pushPermission,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    refresh: refreshPushStatus,
  } = usePushNotifications();

  const pushSubscriptionsQuery = usePushSubscriptions(isPushSubscribed);
  const pushSubscriptions = pushSubscriptionsQuery.data ?? [];
  const isLoadingSubscriptions = pushSubscriptionsQuery.isLoading;

  const deletePushSubscriptionMutation = useDeletePushSubscription();
  const sendTestNotificationMutation = useSendTestNotification();

  const handleConfirmDeleteSubscription = async () => {
    const subscriptionId = showDeleteSubscriptionDialog;
    if (!subscriptionId) return;

    setShowDeleteSubscriptionDialog(null);
    try {
      await deletePushSubscriptionMutation.mutateAsync(subscriptionId);
      toast.success(t('account.pushNotifications.devices.deleteSuccess'));
      await pushSubscriptionsQuery.refetch();
      await refreshPushStatus();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('account.pushNotifications.devices.deleteFailed')
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('account.pushNotifications.title')}</CardTitle>
              <CardDescription>{t('account.pushNotifications.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isPushSupported ? (
              <>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/50">
                        <Bell className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-medium text-white">
                          {t('account.pushNotifications.status')}
                        </div>
                        <div className="mt-1 text-slate-400 text-sm">
                          {isPushSubscribed
                            ? t('account.pushNotifications.subscribed')
                            : t('account.pushNotifications.notSubscribed')}
                          {pushPermission && (
                            <span className="ml-2">
                              • {t(`account.pushNotifications.permission.${pushPermission}`)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:ml-2">
                      {isPushSubscribed ? (
                        <Button
                          onClick={async () => {
                            try {
                              await pushUnsubscribe();
                              toast.success(t('account.pushNotifications.unsubscribeSuccess'));
                              await refreshPushStatus();
                              await pushSubscriptionsQuery.refetch();
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : t('account.pushNotifications.unsubscribeFailed')
                              );
                            }
                          }}
                          disabled={isPushSubscribing}
                          variant="destructive"
                          size="sm"
                          loading={isPushSubscribing}
                          className="w-full sm:w-auto"
                        >
                          {t('account.pushNotifications.disable')}
                        </Button>
                      ) : (
                        <Button
                          onClick={async () => {
                            try {
                              await pushSubscribe();
                              toast.success(t('account.pushNotifications.subscribeSuccess'));
                              await refreshPushStatus();
                              await pushSubscriptionsQuery.refetch();
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : t('account.pushNotifications.subscribeFailed')
                              );
                            }
                          }}
                          disabled={isPushSubscribing}
                          variant="default"
                          size="sm"
                          loading={isPushSubscribing}
                          className="w-full sm:w-auto"
                        >
                          {t('account.pushNotifications.enable')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isPushSubscribed && (
                    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/50">
                          <RefreshCw className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="font-medium text-white">
                            {t('account.pushNotifications.test.title')}
                          </div>
                          <div className="mt-1 text-slate-400 text-sm">
                            {t('account.pushNotifications.test.description')}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const result = await sendTestNotificationMutation.mutateAsync();
                            if (result.success) {
                              toast.success(t('account.pushNotifications.test.success'));
                            } else {
                              toast.error(t('account.pushNotifications.test.failed'));
                            }
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : t('account.pushNotifications.test.failed')
                            );
                          }
                        }}
                        disabled={sendTestNotificationMutation.isPending}
                        variant="outline"
                        size="sm"
                        loading={sendTestNotificationMutation.isPending}
                        className="w-full shrink-0 sm:ml-2 sm:w-auto"
                      >
                        {t('account.pushNotifications.test.button')}
                      </Button>
                    </div>
                  )}

                  {pushError && (
                    <Alert tone="error">
                      {pushError}
                      {pushPermission === 'denied' && (
                        <div className="mt-2 text-sm">
                          {t('account.pushNotifications.permissionDeniedHelp')}
                        </div>
                      )}
                    </Alert>
                  )}

                  {/* Registered Devices */}
                  {isPushSubscribed && (
                    <div className="mt-4 space-y-3 border-white/10 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">
                            {t('account.pushNotifications.devices.title')}
                          </h3>
                          <p className="mt-1 text-slate-400 text-sm">
                            {t('account.pushNotifications.devices.description')}
                          </p>
                        </div>
                      </div>

                      <PushSubscriptionsList
                        isLoading={isLoadingSubscriptions}
                        subscriptions={pushSubscriptions}
                        onDeleteClick={setShowDeleteSubscriptionDialog}
                      />
                    </div>
                  )}
                </div>

                <Alert
                  tone="info"
                  title={t('account.pushNotifications.about.title')}
                  className="mt-4"
                >
                  {t('account.pushNotifications.about.description')}
                </Alert>
              </>
            ) : (
              <Alert tone="warning">{t('account.pushNotifications.notSupported')}</Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Subscription Confirmation Dialog */}
      <AlertDialog
        open={showDeleteSubscriptionDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteSubscriptionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.pushNotifications.devices.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.pushNotifications.devices.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteSubscription}>
              {t('account.pushNotifications.devices.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
