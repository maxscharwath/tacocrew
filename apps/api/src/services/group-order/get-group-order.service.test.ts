/**
 * Tests for GetGroupOrderUseCase
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { createGroupOrder } from '@/schemas/group-order.schema';
import { GetGroupOrderUseCase } from '@/services/group-order/get-group-order.service';
import { NotFoundError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('GetGroupOrderUseCase', () => {
  const groupOrderId = randomUUID();
  const leaderId = randomUUID();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId,
    status: 'OPEN',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
  });

  const mockGroupOrderRepository = {
    findById: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
  });

  it('should return group order when found', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);

    const useCase = container.resolve(GetGroupOrderUseCase);
    const result = await useCase.execute(groupOrderId);

    expect(result).toEqual(mockGroupOrder);
    expect(mockGroupOrderRepository.findById).toHaveBeenCalledWith(groupOrderId);
  });

  it('should throw NotFoundError when group order not found', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(GetGroupOrderUseCase);

    await expect(useCase.execute(groupOrderId)).rejects.toThrow(NotFoundError);
    expect(mockGroupOrderRepository.findById).toHaveBeenCalledWith(groupOrderId);
  });
});
