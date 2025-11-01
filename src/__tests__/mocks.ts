/**
 * Mock factories for testing
 */

import { vi } from 'vitest';
import type { CartMetadata, Taco, StockAvailability } from '../types';

/**
 * Mock CartRepository
 */
export const createMockCartRepository = () => ({
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
export const createMockTacoMappingRepository = () => ({
  store: vi.fn(),
  getBackendIndex: vi.fn(),
  remove: vi.fn(),
  removeAll: vi.fn(),
  getAllMappings: vi.fn(),
});

/**
 * Mock TacosApiClient
 */
export const createMockTacosApiClient = () => ({
  refreshCsrfToken: vi.fn().mockResolvedValue({ csrfToken: 'test-csrf-token', cookies: {} }),
  get: vi.fn(),
  post: vi.fn(),
});

/**
 * Mock SessionApiClient
 */
export const createMockSessionApiClient = () => ({
  get: vi.fn(),
  post: vi.fn(),
  postForm: vi.fn(),
  postFormData: vi.fn(),
});

/**
 * Mock HttpService
 */
export const createMockHttpService = () => ({
  createInstance: vi.fn(),
});

/**
 * Mock PrismaService
 */
export const createMockPrismaService = () => ({
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
  id: 'test-taco-id',
  size: 'tacos_XL' as const,
  meats: [{ id: 'viande_hachee', name: 'Viande Hachée', quantity: 2 }],
  sauces: [{ id: 'harissa', name: 'Harissa' }],
  garnitures: [{ id: 'salade', name: 'Salade' }],
  note: undefined,
  quantity: 1,
  price: 12.5,
  ...overrides,
});

export const createMockStockAvailability = (): StockAvailability => ({
  viandes: {
    viande_hachee: { available: true, stock: 100 },
    poulet: { available: true, stock: 50 },
  },
  sauces: {
    harissa: { available: true, stock: 200 },
    algérienne: { available: true, stock: 150 },
  },
  garnitures: {
    salade: { available: true, stock: 300 },
    tomates: { available: true, stock: 250 },
  },
});

