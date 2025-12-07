/**
 * Tests for DeleteGroupOrderUseCase
 */

// Load test environment variables first
import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { createGroupOrder } from '@/schemas/group-order.schema';
import { DeleteGroupOrderUseCase } from '@/services/group-order/delete-group-order.service';
import { ForbiddenError, NotFoundError } from '@/shared/utils/errors.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

describe('DeleteGroupOrderUseCase', () => {
  const groupOrderId = randomUUID();
  const leaderId = randomUUID();
  const otherUserId = randomUUID();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId,
    status: 'OPEN',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
  });

  const mockGroupOrderRepository = {
    findById: mock(),
    delete: mock(),
  };

  beforeEach(() => {
    container.clearInstances();
    mockGroupOrderRepository.findById.mockReset();
    mockGroupOrderRepository.delete.mockReset();

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
  });

  it('should delete group order when user is leader', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockGroupOrderRepository.delete.mockResolvedValue(undefined);

    const useCase = container.resolve(DeleteGroupOrderUseCase);
    await useCase.execute(groupOrderId, leaderId);

    expect(mockGroupOrderRepository.delete).toHaveBeenCalledWith(groupOrderId);
  });

  it('should throw NotFoundError when group order not found', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(null);

    const useCase = container.resolve(DeleteGroupOrderUseCase);

    await expect(useCase.execute(groupOrderId, leaderId)).rejects.toThrow(NotFoundError);
    expect(mockGroupOrderRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenError when user is not leader', async () => {
    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);

    const useCase = container.resolve(DeleteGroupOrderUseCase);

    await expect(useCase.execute(groupOrderId, otherUserId)).rejects.toThrow(ForbiddenError);
    expect(mockGroupOrderRepository.delete).not.toHaveBeenCalled();
  });
});
