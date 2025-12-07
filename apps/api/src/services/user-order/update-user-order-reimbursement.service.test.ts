/**
 * Tests for UpdateUserOrderReimbursementStatusUseCase
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { createGroupOrder } from '@/schemas/group-order.schema';
import { createUserOrderFromDb } from '@/schemas/user-order.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { UpdateUserOrderReimbursementStatusUseCase } from '@/services/user-order/update-user-order-reimbursement.service';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('UpdateUserOrderReimbursementStatusUseCase', () => {
  const groupOrderId = randomUUID();
  const userOrderId = randomUUID();
  const leaderId = randomUUID();
  const userId = randomUUID();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId,
    status: 'OPEN',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
  });

  const mockUserOrder = createUserOrderFromDb({
    id: userOrderId,
    groupOrderId,
    userId,
    items: { tacos: [], extras: [], drinks: [], desserts: [] },
    reimbursed: false,
    paidByUser: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      name: 'testuser',
    },
  });

  const mockGroupOrderRepository = {
    findById: mock(),
  };

  const mockUserOrderRepository = {
    findById: mock(),
    update: mock(),
  };

  const mockNotificationService = {
    sendToUser: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.findById.mockReset();
    mockUserOrderRepository.update.mockReset();
    mockNotificationService.sendToUser.mockReset();

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
    container.registerInstance(
      NotificationService,
      mockNotificationService as unknown as NotificationService
    );
  });

  it('should update reimbursement status when user is leader', async () => {
    const updatedOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: true,
      reimbursedAt: new Date(),
      reimbursedById: leaderId,
      paidByUser: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockUserOrderRepository.update.mockResolvedValue(updatedOrder);
    mockNotificationService.sendToUser.mockResolvedValue(undefined);

    const useCase = container.resolve(UpdateUserOrderReimbursementStatusUseCase);
    const result = await useCase.execute(groupOrderId, userOrderId, leaderId, true);

    expect(result).toEqual(updatedOrder);
    expect(mockUserOrderRepository.update).toHaveBeenCalledWith(userOrderId, {
      reimbursed: true,
      reimbursedAt: expect.any(Date),
      reimbursedByUserId: leaderId,
    });
  });

  it('should throw NotFoundError when group order not found', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(UpdateUserOrderReimbursementStatusUseCase);

    await expect(useCase.execute(groupOrderId, userOrderId, leaderId, true)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw ValidationError when user is not leader', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);

    const useCase = container.resolve(UpdateUserOrderReimbursementStatusUseCase);

    await expect(useCase.execute(groupOrderId, userOrderId, userId, true)).rejects.toThrow(
      ValidationError
    );
  });
});
