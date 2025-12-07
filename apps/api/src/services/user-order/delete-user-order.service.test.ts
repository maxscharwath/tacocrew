/**
 * Tests for DeleteUserOrderUseCase
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
import { DeleteUserOrderUseCase } from '@/services/user-order/delete-user-order.service';
import { GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('DeleteUserOrderUseCase', () => {
  const orderId = randomUUID();
  const groupOrderId = randomUUID();
  const userId = randomUUID();
  const leaderId = randomUUID();
  const otherUserId = randomUUID();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId,
    status: GroupOrderStatus.OPEN,
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
  });

  const mockUserOrder = createUserOrderFromDb({
    id: orderId,
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
    delete: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.findById.mockReset();
    mockUserOrderRepository.delete.mockReset();

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
  });

  it('should delete user order when user is the owner', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.delete.mockResolvedValue(undefined);

    const useCase = container.resolve(DeleteUserOrderUseCase);
    await useCase.execute(orderId, userId);

    expect(mockUserOrderRepository.delete).toHaveBeenCalledWith(orderId);
  });

  it('should delete user order when user is the leader', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserOrderRepository.delete.mockResolvedValue(undefined);

    const useCase = container.resolve(DeleteUserOrderUseCase);
    await useCase.execute(orderId, leaderId);

    expect(mockUserOrderRepository.delete).toHaveBeenCalledWith(orderId);
  });

  it('should throw NotFoundError when order not found', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(DeleteUserOrderUseCase);

    await expect(useCase.execute(orderId, userId)).rejects.toThrow(NotFoundError);
    expect(mockUserOrderRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when group order not found', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(DeleteUserOrderUseCase);

    await expect(useCase.execute(orderId, userId)).rejects.toThrow(NotFoundError);
    expect(mockUserOrderRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when user is not owner or leader', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);

    const useCase = container.resolve(DeleteUserOrderUseCase);

    await expect(useCase.execute(orderId, otherUserId)).rejects.toThrow(ValidationError);
    expect(mockUserOrderRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when group order is not OPEN', async () => {
    const closedGroupOrder = createGroupOrder({
      ...mockGroupOrder,
      status: GroupOrderStatus.SUBMITTED,
    });
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(closedGroupOrder);

    const useCase = container.resolve(DeleteUserOrderUseCase);

    await expect(useCase.execute(orderId, userId)).rejects.toThrow(ValidationError);
    expect(mockUserOrderRepository.delete).not.toHaveBeenCalled();
  });
});
