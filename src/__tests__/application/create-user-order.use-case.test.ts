/**
 * Tests for CreateUserOrderUseCase
 */

import { addHours, subMinutes } from 'date-fns';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockStockAvailability } from '@/__tests__/mocks';
import type { CreateUserOrderRequestDto } from '@/application/dtos/user-order.dto';
import { CreateUserOrderUseCase } from '@/application/use-cases/user-orders/create-user-order';
import { createGroupOrder } from '@/domain/schemas/group-order.schema';
import { createUserOrderFromDb } from '@/domain/schemas/user-order.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { ResourceService } from '@/services/resource.service';
import { GroupOrderStatus, StockCategory, TacoSize, UserOrderStatus } from '@/types';
import { deterministicUUID, randomUUID } from '@/utils/uuid-utils';

describe('CreateUserOrderUseCase', () => {
  const groupOrderId = randomUUID();
  const userId = randomUUID();
  const leaderId = randomUUID();
  const now = new Date();

  const mockGroupOrder = createGroupOrder({
    id: groupOrderId,
    leaderId,
    startDate: subMinutes(now, 1),
    endDate: addHours(now, 1),
    status: GroupOrderStatus.OPEN,
  });

  const mockGroupOrderRepository = {
    findById: vi.fn(),
  };

  const mockUserOrderRepository = {
    upsert: vi.fn(),
  };

  const mockResourceService = {
    getStock: vi.fn(),
  };

  beforeEach(() => {
    container.clearInstances();

    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.upsert.mockReset();
    mockResourceService.getStock.mockReset();

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockResourceService.getStock.mockResolvedValue(
      createMockStockAvailability({
        [StockCategory.Extras]: [
          {
            id: deterministicUUID('extra_frites', StockCategory.Extras),
            code: 'extra_frites',
            name: 'Frites',
            in_stock: true,
          },
        ],
      })
    );

    mockUserOrderRepository.upsert.mockImplementation(
      ({
        groupOrderId: goId,
        userId: uId,
        items,
        status,
      }: {
        groupOrderId: string;
        userId: string;
        items: CreateUserOrderRequestDto['items'];
        status?: UserOrderStatus;
      }) => {
        const timestamp = new Date();
        const resolvedStatus = status ?? UserOrderStatus.DRAFT;
        return createUserOrderFromDb({
          id: randomUUID(),
          groupOrderId: goId,
          userId: uId,
          status: resolvedStatus,
          items: JSON.stringify(items),
          createdAt: timestamp,
          updatedAt: timestamp,
          user: {
            username: 'alice',
          },
        });
      }
    );

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

  it('preserves catalog ids and assigns deterministic uuids for user order items', async () => {
    const useCase = container.resolve(CreateUserOrderUseCase);
    const request: CreateUserOrderRequestDto = {
      items: {
        tacos: [
          {
            id: 'temp-taco',
            size: TacoSize.XL,
            meats: [{ code: 'viande_hachee', name: 'Viande Hachée', quantity: 1 }],
            sauces: [{ code: 'harissa', name: 'Harissa' }],
            garnitures: [{ code: 'salade', name: 'Salade' }],
            note: 'Spicy please',
            quantity: 1,
            price: 12,
          },
        ],
        extras: [
          {
            code: 'extra_frites',
            name: 'Frites',
            price: 3,
            quantity: 1,
          },
        ],
        drinks: [],
        desserts: [],
      },
    };

    const result = await useCase.execute(groupOrderId, userId, request);

    expect(mockUserOrderRepository.upsert).toHaveBeenCalledTimes(1);
    const payload = mockUserOrderRepository.upsert.mock.calls[0][0];

    // Extra ID should be a deterministic UUID generated from code
    expect(payload.items.extras[0].code).toBe('extra_frites');
    expect(payload.items.extras[0].id).toBeDefined();
    expect(payload.items.tacos[0].meats[0].id).toBeDefined();
    expect(payload.items.tacos[0].sauces[0].id).toBeDefined();
    expect(payload.items.tacos[0].garnitures[0].id).toBeDefined();

    expect(result.items.tacos[0].meats[0].id).toBe(payload.items.tacos[0].meats[0].id);
    expect(result.items.tacos[0].sauces[0].id).toBe(payload.items.tacos[0].sauces[0].id);
    expect(result.items.tacos[0].garnitures[0].id).toBe(payload.items.tacos[0].garnitures[0].id);
  });
});
