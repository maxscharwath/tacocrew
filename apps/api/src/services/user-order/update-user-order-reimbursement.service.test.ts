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
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
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

  const mockStatsTrackingService = {
    trackPaidForOther: mock(),
  };

  const mockBadgeEvaluationService = {
    evaluateAfterEvent: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.findById.mockReset();
    mockUserOrderRepository.update.mockReset();
    mockNotificationService.sendToUser.mockReset();
    mockStatsTrackingService.trackPaidForOther.mockReset();
    mockBadgeEvaluationService.evaluateAfterEvent.mockReset();

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
    container.registerInstance(
      StatsTrackingService,
      mockStatsTrackingService as unknown as StatsTrackingService
    );
    container.registerInstance(
      BadgeEvaluationService,
      mockBadgeEvaluationService as unknown as BadgeEvaluationService
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

  it('should track badge when leader confirms payment and someone else paid', async () => {
    const payerId = randomUUID();
    const userOrderWithPayment = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: payerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
      paidByUserRef: {
        id: payerId,
        name: 'Payer',
      },
    });

    const updatedOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: true,
      reimbursedAt: new Date(),
      reimbursedById: leaderId,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: payerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        name: 'testuser',
      },
      paidByUserRef: {
        id: payerId,
        name: 'Payer',
      },
    });

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.findById.mockResolvedValue(userOrderWithPayment);
    mockUserOrderRepository.update.mockResolvedValue(updatedOrder);
    mockNotificationService.sendToUser.mockResolvedValue(undefined);
    mockStatsTrackingService.trackPaidForOther.mockResolvedValue(undefined);
    mockBadgeEvaluationService.evaluateAfterEvent.mockResolvedValue([]);

    const useCase = container.resolve(UpdateUserOrderReimbursementStatusUseCase);
    const result = await useCase.execute(groupOrderId, userOrderId, leaderId, true);

    expect(result).toEqual(updatedOrder);
    expect(mockStatsTrackingService.trackPaidForOther).toHaveBeenCalledWith(payerId);
    expect(mockBadgeEvaluationService.evaluateAfterEvent).toHaveBeenCalledWith(
      payerId,
      expect.objectContaining({
        type: 'paidForOther',
        userId: payerId,
      })
    );
  });

  it('should not track badge when order owner paid for themselves', async () => {
    const userOrderWithSelfPayment = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: false,
      paidByUser: true,
      paidByUserAt: new Date(),
      paidByUserId: userId, // Order owner paid for themselves
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

    const updatedOrder = createUserOrderFromDb({
      id: userOrderId,
      groupOrderId,
      userId,
      items: { tacos: [], extras: [], drinks: [], desserts: [] },
      reimbursed: true,
      reimbursedAt: new Date(),
      reimbursedById: leaderId,
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
    mockUserOrderRepository.findById.mockResolvedValue(userOrderWithSelfPayment);
    mockUserOrderRepository.update.mockResolvedValue(updatedOrder);
    mockNotificationService.sendToUser.mockResolvedValue(undefined);

    const useCase = container.resolve(UpdateUserOrderReimbursementStatusUseCase);
    const result = await useCase.execute(groupOrderId, userOrderId, leaderId, true);

    expect(result).toEqual(updatedOrder);
    expect(mockStatsTrackingService.trackPaidForOther).not.toHaveBeenCalled();
    expect(mockBadgeEvaluationService.evaluateAfterEvent).not.toHaveBeenCalled();
  });
});
