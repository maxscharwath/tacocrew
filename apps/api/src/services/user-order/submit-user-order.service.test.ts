/**
 * Tests for SubmitUserOrderUseCase
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
import { ResourceService } from '@/services/resource/resource.service';
import { SubmitUserOrderUseCase } from '@/services/user-order/submit-user-order.service';
import { GroupOrderStatus } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('SubmitUserOrderUseCase', () => {
  const orderId = randomUUID();
  const groupOrderId = randomUUID();
  const userId = randomUUID();
  const otherUserId = randomUUID();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId: randomUUID(),
    status: GroupOrderStatus.OPEN,
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
  });

  const mockUserOrder = createUserOrderFromDb({
    id: orderId,
    groupOrderId,
    userId,
    items: {
      tacos: [
        { size: 'XL', meats: [], sauces: [], garnitures: [], quantity: 1, tacoID: 'test-taco-id' },
      ],
      extras: [],
      drinks: [],
      desserts: [],
    },
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
  };

  const mockResourceService = {
    getStock: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.findById.mockReset();
    mockResourceService.getStock.mockReset();

    mockResourceService.getStock.mockResolvedValue({
      meats: [],
      sauces: [],
      garnishes: [],
      extras: [],
      drinks: [],
      desserts: [],
      tacos: [],
    });

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
    container.registerInstance(ResourceService, mockResourceService as unknown as ResourceService);
  });

  it('should submit user order successfully', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);

    const useCase = container.resolve(SubmitUserOrderUseCase);
    const result = await useCase.execute(orderId, userId);

    expect(result).toEqual(mockUserOrder);
  });

  it('should throw NotFoundError when order not found', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(SubmitUserOrderUseCase);

    await expect(useCase.execute(orderId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when user is not owner', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);

    const useCase = container.resolve(SubmitUserOrderUseCase);

    await expect(useCase.execute(orderId, otherUserId)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when group order is not OPEN', async () => {
    const closedGroupOrder = createGroupOrder({
      ...mockGroupOrder,
      status: GroupOrderStatus.SUBMITTED,
    });
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);
    mockGroupOrderRepository.findById.mockResolvedValue(closedGroupOrder);

    const useCase = container.resolve(SubmitUserOrderUseCase);

    await expect(useCase.execute(orderId, userId)).rejects.toThrow(ValidationError);
  });
});
