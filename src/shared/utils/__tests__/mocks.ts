/**
 * Mock factories for testing
 */

import { vi } from 'vitest';
import {
  GarnitureIdSchema,
  MeatIdSchema,
  SauceIdSchema,
  TacoIdSchema,
} from '@/schemas/taco.schema';
import type { CartMetadata, StockAvailability, Taco } from '@/shared/types/types';
import { StockCategory, TacoSize } from '@/shared/types/types';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

/**
 * Mock CartRepository
 */
export const createMockCartRepository = (): {
  getCart: ReturnType<typeof vi.fn>;
  createCart: ReturnType<typeof vi.fn>;
  updateCart: ReturnType<typeof vi.fn>;
  deleteCart: ReturnType<typeof vi.fn>;
  hasCart: ReturnType<typeof vi.fn>;
  getAllCarts: ReturnType<typeof vi.fn>;
  cleanupExpiredCarts: ReturnType<typeof vi.fn>;
} => ({
  getCart: vi.fn(),
  createCart: vi.fn(),
  updateCart: vi.fn(),
  deleteCart: vi.fn(),
  hasCart: vi.fn(),
  getAllCarts: vi.fn(),
  cleanupExpiredCarts: vi.fn(),
});

/**
 * Mock TacoMappingRepository
 */
export const createMockTacoMappingRepository = (): {
  store: ReturnType<typeof vi.fn>;
  getBackendIndex: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  removeAll: ReturnType<typeof vi.fn>;
  getAllMappings: ReturnType<typeof vi.fn>;
} => ({
  store: vi.fn(),
  getBackendIndex: vi.fn(),
  remove: vi.fn(),
  removeAll: vi.fn(),
  getAllMappings: vi.fn(),
});

/**
 * Mock TacosApiClient
 */
export const createMockTacosApiClient = (): {
  refreshCsrfToken: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
} => ({
  refreshCsrfToken: vi.fn().mockResolvedValue({ csrfToken: 'test-csrf-token', cookies: {} }),
  get: vi.fn(),
  post: vi.fn(),
});

/**
 * Mock SessionApiClient
 */
export const createMockSessionApiClient = (): {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  postForm: ReturnType<typeof vi.fn>;
  postFormData: ReturnType<typeof vi.fn>;
} => ({
  get: vi.fn(),
  post: vi.fn(),
  postForm: vi.fn(),
  postFormData: vi.fn(),
});

/**
 * Mock HttpService
 */
export const createMockHttpService = (): {
  createInstance: ReturnType<typeof vi.fn>;
} => ({
  createInstance: vi.fn(),
});

/**
 * Mock PrismaService
 */
export const createMockPrismaService = (): {
  client: {
    cart: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    tacoMapping: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
} => ({
  client: {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    tacoMapping: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
});

/**
 * Test data factories
 */
export const createMockCartMetadata = (overrides?: Partial<CartMetadata>): CartMetadata => ({
  cookies: {},
  createdAt: new Date(),
  lastActivityAt: new Date(),
  metadata: {},
  ...overrides,
});

export const createMockTaco = (overrides?: Partial<Taco>): Taco => ({
  id: TacoIdSchema.parse('test-taco-id'),
  size: TacoSize.XL,
  meats: [
    {
      id: MeatIdSchema.parse(deterministicUUID('viande_hachee', StockCategory.Meats)),
      code: 'viande_hachee',
      name: 'Viande Hachée',
      quantity: 2,
    },
  ],
  sauces: [
    {
      id: SauceIdSchema.parse(deterministicUUID('harissa', StockCategory.Sauces)),
      code: 'harissa',
      name: 'Harissa',
    },
  ],
  garnitures: [
    {
      id: GarnitureIdSchema.parse(deterministicUUID('salade', StockCategory.Garnishes)),
      code: 'salade',
      name: 'Salade',
    },
  ],
  note: undefined,
  quantity: 1,
  price: 12.5,
  ...overrides,
});

const formatName = (code: string): string => {
  return code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const createMockStockAvailability = (
  overrides?: Partial<StockAvailability>
): StockAvailability => ({
  [StockCategory.Meats]: [
    {
      id: deterministicUUID('viande_hachee', StockCategory.Meats),
      code: 'viande_hachee',
      name: formatName('viande_hachee'),
      price: 5.5,
      in_stock: true,
    },
    {
      id: deterministicUUID('poulet', StockCategory.Meats),
      code: 'poulet',
      name: formatName('poulet'),
      price: 6.0,
      in_stock: true,
    },
  ],
  [StockCategory.Sauces]: [
    {
      id: deterministicUUID('harissa', StockCategory.Sauces),
      code: 'harissa',
      name: formatName('harissa'),
      price: 0.5,
      in_stock: true,
    },
    {
      id: deterministicUUID('algerienne', StockCategory.Sauces),
      code: 'algerienne',
      name: formatName('algerienne'),
      price: 0.5,
      in_stock: true,
    },
  ],
  [StockCategory.Garnishes]: [
    {
      id: deterministicUUID('salade', StockCategory.Garnishes),
      code: 'salade',
      name: formatName('salade'),
      price: 0.3,
      in_stock: true,
    },
    {
      id: deterministicUUID('tomates', StockCategory.Garnishes),
      code: 'tomates',
      name: formatName('tomates'),
      price: 0.3,
      in_stock: true,
    },
  ],
  [StockCategory.Desserts]: [],
  [StockCategory.Drinks]: [],
  [StockCategory.Extras]: [],
  ...overrides,
});

/**
 * Mock AuthService
 */
export const createMockAuthService = (): {
  generateToken: ReturnType<typeof vi.fn>;
  verifyToken: ReturnType<typeof vi.fn>;
} => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
});

/**
 * Mock UserRepository
 */
export const createMockUserRepository = (): {
  findById: ReturnType<typeof vi.fn>;
  findByUsername: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
} => ({
  findById: vi.fn(),
  findByUsername: vi.fn(),
  create: vi.fn(),
});
