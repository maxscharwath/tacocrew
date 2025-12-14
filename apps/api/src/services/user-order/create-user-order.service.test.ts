/**
 * Tests for CreateUserOrderUseCase
 */

// Load test environment variables first
import '@/test-setup';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { TacoSize } from '@tacocrew/gigatacos-client';
import { addHours, subMinutes } from 'date-fns';
import { container } from 'tsyringe';
import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { createGroupOrder } from '@/schemas/group-order.schema';
import { createUserOrderFromDb } from '@/schemas/user-order.schema';
import { ResourceService } from '@/services/resource/resource.service';
import { UserService } from '@/services/user/user.service';
import { CreateUserOrderUseCase } from '@/services/user-order/create-user-order.service';
import { GroupOrderStatus, StockCategory, UserOrderItems } from '@/shared/types/types';
import { deterministicUUID, randomUUID } from '@/shared/utils/uuid.utils';

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
    findById: mock(),
  };

  const mockUserOrderRepository = {
    upsert: mock(),
    create: mock(),
  };

  const mockResourceService = {
    getStock: mock(),
  };

  const mockUserService = {
    getUserById: mock(),
  };

  beforeEach(() => {
    container.clearInstances();

    mockGroupOrderRepository.findById.mockReset();
    mockUserOrderRepository.upsert.mockReset();
    mockUserOrderRepository.create.mockReset();
    mockResourceService.getStock.mockReset();
    mockUserService.getUserById.mockReset();

    mockGroupOrderRepository.findById.mockResolvedValue(mockGroupOrder);
    mockUserService.getUserById.mockResolvedValue({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    });
    mockResourceService.getStock.mockResolvedValue({
      [StockCategory.Meats]: [
        {
          id: deterministicUUID('viande_hachee', StockCategory.Meats),
          code: 'viande_hachee',
          name: 'Viande Hachée',
          price: 5,
          in_stock: true,
        },
      ],
      [StockCategory.Sauces]: [
        {
          id: deterministicUUID('harissa', StockCategory.Sauces),
          code: 'harissa',
          name: 'Harissa',
          price: 0,
          in_stock: true,
        },
      ],
      [StockCategory.Garnishes]: [
        {
          id: deterministicUUID('salade', StockCategory.Garnishes),
          code: 'salade',
          name: 'Salade',
          price: 0,
          in_stock: true,
        },
      ],
      [StockCategory.Extras]: [
        {
          id: deterministicUUID('extra_frites', StockCategory.Extras),
          code: 'extra_frites',
          name: 'Frites',
          price: 3,
          in_stock: true,
        },
      ],
      [StockCategory.Desserts]: [],
      [StockCategory.Drinks]: [],
      tacos: [],
    });

    const createMockUserOrder = ({
      groupOrderId: goId,
      userId: uId,
      items,
    }: {
      groupOrderId: string;
      userId: string;
      items: CreateUserOrderRequestDto['items'] | UserOrderItems;
    }) => {
      const timestamp = new Date();
      return createUserOrderFromDb({
        id: randomUUID(),
        groupOrderId: goId,
        userId: uId,
        items: typeof items === 'string' ? JSON.parse(items) : items,
        reimbursed: false,
        paidByUser: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        user: {
          name: 'alice',
        },
      });
    };

    mockUserOrderRepository.upsert.mockImplementation(createMockUserOrder);
    mockUserOrderRepository.create.mockImplementation(createMockUserOrder);

    container.registerInstance(
      GroupOrderRepository,
      mockGroupOrderRepository as unknown as GroupOrderRepository
    );
    container.registerInstance(
      UserOrderRepository,
      mockUserOrderRepository as unknown as UserOrderRepository
    );
    container.registerInstance(ResourceService, mockResourceService as unknown as ResourceService);
    container.registerInstance(UserService, mockUserService as unknown as UserService);
  });

  it('preserves catalog ids and assigns deterministic uuids for user order items', async () => {
    const useCase = container.resolve(CreateUserOrderUseCase);

    // Get IDs from stock (simulating what would come from API)
    const stock = await mockResourceService.getStock();
    const meatId = stock[StockCategory.Meats][0]!.id;
    const sauceId = stock[StockCategory.Sauces][0]!.id;
    const garnitureId = stock[StockCategory.Garnishes][0]!.id;
    const extraId = stock[StockCategory.Extras][0]!.id;

    const request: CreateUserOrderRequestDto = {
      items: {
        tacos: [
          {
            size: TacoSize.XL,
            meats: [{ id: meatId, quantity: 1 }],
            sauces: [{ id: sauceId }],
            garnitures: [{ id: garnitureId }],
            note: 'Spicy please',
            quantity: 1,
          },
        ],
        extras: [
          {
            id: extraId,
            quantity: 1,
          },
        ],
        drinks: [],
        desserts: [],
      },
    };

    const result = await useCase.execute(groupOrderId, userId, request);

    expect(mockUserOrderRepository.create).toHaveBeenCalledTimes(1);
    const payload = mockUserOrderRepository.create.mock.calls[0][0];

    // Extra ID should be a deterministic UUID generated from code
    expect(payload.items.extras[0].code).toBe('extra_frites');
    expect(payload.items.extras[0].id).toBeDefined();
    expect(payload.items.tacos[0].meats[0].id).toBeDefined();
    expect(payload.items.tacos[0].sauces[0].id).toBeDefined();
    expect(payload.items.tacos[0].garnitures[0].id).toBeDefined();

    expect(result.items.tacos[0].meats[0].id).toBe(payload.items.tacos[0].meats[0].id);
    expect(result.items.tacos[0].sauces[0].id).toBe(payload.items.tacos[0].sauces[0].id);
    expect(result.items.tacos[0].garnitures[0].id).toBe(payload.items.tacos[0].garnitures[0].id);

    // Verify codes are preserved
    expect(result.items.tacos[0].meats[0].code).toBe('viande_hachee');
    expect(result.items.tacos[0].sauces[0].code).toBe('harissa');
    expect(result.items.tacos[0].garnitures[0].code).toBe('salade');
    expect(result.items.extras[0].code).toBe('extra_frites');
  });
});
