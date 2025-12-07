/**
 * Tests for GetUserOrderUseCase
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { createUserOrderFromDb } from '@/schemas/user-order.schema';
import { GetUserOrderUseCase } from '@/services/user-order/get-user-order.service';
import { NotFoundError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('GetUserOrderUseCase', () => {
  const orderId = randomUUID();
  const groupOrderId = randomUUID();
  const userId = randomUUID();

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

  const mockUserOrderRepository = {
    findById: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockUserOrderRepository.findById.mockReset();

    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
  });

  it('should return user order when found', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(mockUserOrder);

    const useCase = container.resolve(GetUserOrderUseCase);
    const result = await useCase.execute(orderId);

    expect(result).toEqual(mockUserOrder);
    expect(mockUserOrderRepository.findById).toHaveBeenCalledWith(orderId);
  });

  it('should throw NotFoundError when order not found', async () => {
    mockUserOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(GetUserOrderUseCase);

    await expect(useCase.execute(orderId)).rejects.toThrow(NotFoundError);
    expect(mockUserOrderRepository.findById).toHaveBeenCalledWith(orderId);
  });
});
