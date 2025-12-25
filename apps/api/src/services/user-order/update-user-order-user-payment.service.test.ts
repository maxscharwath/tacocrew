/**
 * Tests for UpdateUserOrderUserPaymentStatusUseCase
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { createGroupOrder } from '@/schemas/group-order.schema';
import { createUserOrderFromDb } from '@/schemas/user-order.schema';
import { NotificationService } from '@/services/notification/notification.service';
import { UpdateUserOrderUserPaymentStatusUseCase } from '@/services/user-order/update-user-order-user-payment.service';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('UpdateUserOrderUserPaymentStatusUseCase', () => {
  const groupOrderId = randomUUID();
  const userOrderId = randomUUID();
  const userId = randomUUID();
  const leaderId = randomUUID();
  const otherUserId = randomUUID();

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

  const mockUserRepository = {
    findById: mock(),
  };

  const mockNotificationService = {
    sendToUser: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.findById.mockReset();
    mockUserOrderRepository.update.mockReset();
    mockUserRepository.findById.mockReset();
    mockNotificationService.sendToUser.mockReset();

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
    container.registerInstance(UserRepository, mockUserRepository as unknown as UserRepository);
    container.registerInstance(
      NotificationService,
      mockNotificationService as unknown as NotificationService
    );
  });

  it('should update payment status when user is owner', async () => {
    const updatedOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockUserOrderRepository.update.mockResolvedValue(updatedOrder);
    mockUserRepository.findById.mockResolvedValue({
      id: userId,
      name: 'Test User',
    });
    mockNotificationService.sendToUser.mockResolvedValue(undefined);

    const useCase = container.resolve(UpdateUserOrderUserPaymentStatusUseCase);
    const result = await useCase.execute(groupOrderId, userOrderId, userId, true);

    expect(result).toEqual(updatedOrder);
    expect(mockUserOrderRepository.update).toHaveBeenCalledWith(userOrderId, {
      paidByUser: true,
      paidByUserAt: expect.any(Date),
      paidByUserId: userId,
    });
    expect(mockNotificationService.sendToUser).toHaveBeenCalled();
  });

  it('should throw NotFoundError when group order not found', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(UpdateUserOrderUserPaymentStatusUseCase);

    await expect(useCase.execute(groupOrderId, userOrderId, userId, true)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should allow paying for someone else when they have not paid', async () => {
    const updatedOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: otherUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
      paidByUserRef: {
        id: otherUserId,
        name: 'Other User',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockUserOrderRepository.update.mockResolvedValue(updatedOrder);
    mockUserRepository.findById.mockResolvedValue({
      id: otherUserId,
      name: 'Other User',
    });
    mockNotificationService.sendToUser.mockResolvedValue(undefined);

    const useCase = container.resolve(UpdateUserOrderUserPaymentStatusUseCase);
    const result = await useCase.execute(groupOrderId, userOrderId, otherUserId, true);

    expect(result).toEqual(updatedOrder);
    expect(mockUserOrderRepository.update).toHaveBeenCalledWith(userOrderId, {
      paidByUser: true,
      paidByUserAt: expect.any(Date),
      paidByUserId: otherUserId,
    });
    expect(mockNotificationService.sendToUser).toHaveBeenCalled();
  });

  it('should throw ValidationError when trying to pay for someone who already paid', async () => {
    const alreadyPaidOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
      paidByUserRef: {
        id: userId,
        name: 'testuser',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(alreadyPaidOrder);

    const useCase = container.resolve(UpdateUserOrderUserPaymentStatusUseCase);

    await expect(useCase.execute(groupOrderId, userOrderId, otherUserId, true)).rejects.toThrow(
      ValidationError
    );
    expect(mockUserOrderRepository.update).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when unpaying someone else order that you did not pay for', async () => {
    const paidOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
      paidByUserRef: {
        id: userId,
        name: 'testuser',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(paidOrder);

    const useCase = container.resolve(UpdateUserOrderUserPaymentStatusUseCase);

    await expect(useCase.execute(groupOrderId, userOrderId, otherUserId, false)).rejects.toThrow(
      ValidationError
    );
    expect(mockUserOrderRepository.update).not.toHaveBeenCalled();
  });
});
