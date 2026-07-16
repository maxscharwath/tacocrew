/**
 * Tests for OrderStatusNotificationService — one localized push per unique
 * participant when a commande.app status transition is observed.
 */

import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { GroupOrderId } from '@/schemas/group-order.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { OrderStatusNotificationService } from '@/services/order/order-status-notification.service';

const GROUP_ORDER_ID = GroupOrderId.parse('10000000-1000-4000-8000-100000000200');

describe('OrderStatusNotificationService', () => {
  const userOrderRepositoryMock = {
    findByGroup: mock(async () => [
      { userId: 'user-a' },
      { userId: 'user-b' },
      // Duplicate participant — must be notified only once.
      { userId: 'user-a' },
    ]),
  };
  const notificationServiceMock = {
    sendToUser: mock(async () => null),
  };

  beforeEach(() => {
    container.clearInstances();
    userOrderRepositoryMock.findByGroup.mockClear();
    notificationServiceMock.sendToUser.mockClear();
    container.registerInstance(
      UserOrderRepository,
      userOrderRepositoryMock as unknown as UserOrderRepository
    );
    container.registerInstance(
      NotificationService,
      notificationServiceMock as unknown as NotificationService
    );
  });

  it('notifies each unique participant with a per-order tag and progress URL', async () => {
    const service = container.resolve(OrderStatusNotificationService);

    await service.notifyStatusChange({
      groupOrderId: GROUP_ORDER_ID,
      commandeOrderId: 'cmd-1',
      status: 'preparing',
    });

    expect(notificationServiceMock.sendToUser).toHaveBeenCalledTimes(2);
    const [userId, payload] = notificationServiceMock.sendToUser.mock.calls[0] as [
      string,
      { tag: string; url: string; type: string; data: Record<string, unknown> },
    ];
    expect(userId).toBe('user-a');
    expect(payload.tag).toBe('order-status-cmd-1');
    expect(payload.url).toBe(`/orders/${GROUP_ORDER_ID}/progress`);
    expect(payload.type).toBe('order-status');
    expect(payload.data.status).toBe('preparing');
  });

  it('does nothing when the group has no participants', async () => {
    userOrderRepositoryMock.findByGroup.mockResolvedValueOnce([]);
    const service = container.resolve(OrderStatusNotificationService);

    await service.notifyStatusChange({
      groupOrderId: GROUP_ORDER_ID,
      commandeOrderId: 'cmd-1',
      status: 'delivered',
    });

    expect(notificationServiceMock.sendToUser).not.toHaveBeenCalled();
  });
});
