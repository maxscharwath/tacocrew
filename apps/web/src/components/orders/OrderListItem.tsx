import { ArrowUpRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { StatusBadge } from '@/components/ui';
import type { UserGroupOrder } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { StackedAvatars } from './StackedAvatars';
import { UserBadge } from './UserBadge';

type OrderListItemProps = {
  readonly order: UserGroupOrder;
  readonly formatDateTimeRange: (start: string, end: string) => string;
  readonly unnamedOrderText: string;
};

/**
 * Reusable order list item component
 * Used in both dashboard and orders list pages
 */
export function OrderListItem({
  order,
  formatDateTimeRange,
  unnamedOrderText,
}: OrderListItemProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={routes.root.orderDetail({ orderId: order.id })}
      className="group block transition-all duration-200"
    >
      <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_60px_rgba(8,47,73,0.25)] transition-all duration-200 hover:border-brand-400/40 hover:bg-slate-900/80 hover:shadow-[0_20px_60px_rgba(99,102,241,0.2)] sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {/* Order Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="truncate font-bold text-base text-white group-hover:text-brand-100">
                {order.name ?? unnamedOrderText}
              </h3>
              <StatusBadge
                status={order.status}
                label={t(`common.status.${order.status}`)}
                className="shrink-0 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-sm sm:gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="shrink-0" />
                <span className="whitespace-nowrap">
                  {formatDateTimeRange(order.startDate, order.endDate)}
                </span>
              </div>
              {order.leader && (
                <>
                  <span className="text-white/20">•</span>
                  <UserBadge
                    userId={order.leader.id}
                    name={order.leader.name ?? t('orders.list.queue.unknownLeader')}
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participants & Action */}
        <div className="flex items-center justify-end gap-4">
          {/* Participants */}
          {order.participants?.length > 0 && (
            <div className="shrink-0 sm:border-white/10 sm:border-l sm:pl-6">
              <StackedAvatars
                participants={order.participants.map((p) => ({ userId: p.id, name: p.name }))}
                size="md"
              />
            </div>
          )}

          {/* Action */}
          <div className="shrink-0">
            <div className="flex items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/10 p-2.5 transition-all duration-200 group-hover:border-brand-400/50 group-hover:bg-brand-500/20 sm:p-3">
              <ArrowUpRight size={18} className="text-brand-200 sm:w-5" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
