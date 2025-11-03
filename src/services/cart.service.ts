/**
 * Cart service with integrated session management
 * @module services/cart
 */

import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { TacosApiClient } from '@/api/client';
import { SessionApiClient } from '@/api/session-client';
import { CartRepository } from '@/database/cart.repository';
import { TacoMappingRepository } from '@/database/taco-mapping.repository';
import type { CartId } from '@/domain/schemas/cart.schema';
import { DessertIdSchema } from '@/domain/schemas/dessert.schema';
import { DrinkIdSchema } from '@/domain/schemas/drink.schema';
import { ExtraIdSchema } from '@/domain/schemas/extra.schema';
import { ResourceService } from '@/services/resource.service';
import {
  AddTacoRequest,
  CartMetadata,
  CartSummary,
  CategorySummary,
  Dessert,
  Drink,
  Extra,
  StockCategory,
  Taco,
  UpdateTacoRequest,
} from '@/types';
import { NotFoundError } from '@/utils/errors';
import { parseCategorySummaryFromTacos, parseTacoCard } from '@/utils/html-parser';
import { inject } from '@/utils/inject';
import { deterministicUUID } from '@/utils/uuid-utils';

/**
 * Cart Service - Manages carts with session data (csrfToken, cookies)
 * All operations require a cart id
 */
@injectable()
export class CartService {
  private readonly sessionApiClient = inject(SessionApiClient);
  private readonly apiClient = inject(TacosApiClient);
  private readonly cartRepository = inject(CartRepository);
  private readonly tacoMappingRepository = inject(TacoMappingRepository);
  private readonly resourceService = inject(ResourceService);

  private readonly CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private async getCartOrThrow(id: CartId): Promise<CartMetadata> {
    const cart = await this.cartRepository.getCart(id);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }
    return cart;
  }

  private buildTacoFormData(
    request: AddTacoRequest | UpdateTacoRequest,
    index?: number
  ): Record<string, string | number | string[]> {
    const formData: Record<string, string | number | string[]> = {
      ...(index !== undefined && { index }),
      ...('id' in request ? { editSelectProduct: request.size } : { selectProduct: request.size }),
      tacosNote: request.note || '',
    };

    const viandeArray = request.meats.map((m) => {
      formData[`meat_quantity[${m.id}]`] = m.quantity;
      return m.id;
    });
    if (viandeArray.length > 0) formData['viande[]'] = viandeArray;
    if (request.sauces.length > 0) formData['sauce[]'] = request.sauces;
    if (request.garnitures.length > 0) formData['garniture[]'] = request.garnitures;

    return formData;
  }

  private async parseTacoWithStock(html: string, tacoId: string): Promise<Taco> {
    const stockData = await this.resourceService.getStock();
    const parsedTaco = parseTacoCard(html, tacoId, stockData);
    if (!parsedTaco) {
      throw new Error('Failed to parse taco from HTML response');
    }
    return parsedTaco;
  }

  private mapTacoIds(tacos: Taco[], mapping: Map<number, string>): Taco[] {
    return tacos.map((taco, index) => {
      const mappedId = mapping.get(index);
      return {
        ...taco,
        id:
          mappedId?.startsWith('temp-') || taco.id.startsWith('temp-')
            ? uuidv4()
            : mappedId || taco.id,
      };
    });
  }

  private computeCategorySummary<T extends { price: number; quantity: number }>(
    items: T[]
  ): CategorySummary {
    return items.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + item.quantity,
        totalPrice: acc.totalPrice + item.price * item.quantity,
      }),
      { totalQuantity: 0, totalPrice: 0 }
    );
  }

  async createCart(metadata?: { ip?: string; userAgent?: string }): Promise<{ id: CartId }> {
    const { cookies } = await this.apiClient.refreshCsrfToken();

    const { id } = await this.cartRepository.createCart({
      cookies,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      metadata: metadata || {},
    });

    return { id };
  }

  async getCart(id: CartId): Promise<Taco[]> {
    await this.getCartOrThrow(id);
    const tacos = await this.getParsedTacosFromSummary(id);
    const mapping = await this.tacoMappingRepository.getAllMappings(id);
    return this.mapTacoIds(tacos, mapping);
  }

  async getCartWithSummary(id: CartId): Promise<{
    tacos: Taco[];
    extras: Extra[];
    drinks: Drink[];
    desserts: Dessert[];
    summary: CartSummary;
  }> {
    await this.getCartOrThrow(id);

    const [parsedTacos, extras, drinks, desserts, mapping] = await Promise.all([
      this.getParsedTacosFromSummary(id),
      this.getExtras(id),
      this.getDrinks(id),
      this.getDesserts(id),
      this.tacoMappingRepository.getAllMappings(id),
    ]);

    const tacos = this.mapTacoIds(parsedTacos, mapping);
    const summary = await this.getCartSummary(id);

    return { tacos, extras, drinks, desserts, summary };
  }

  async getCartSession(id: CartId): Promise<CartMetadata> {
    return await this.getCartOrThrow(id);
  }

  async updateCartSession(id: CartId, updates: Partial<CartMetadata>): Promise<void> {
    await this.getCartOrThrow(id);
    await this.cartRepository.updateCart(id, updates);
  }

  async addTaco(id: CartId, request: AddTacoRequest): Promise<Taco> {
    await this.getCartOrThrow(id);

    const htmlResponse = await this.sessionApiClient.postForm<string>(
      id,
      '/ajax/owt.php',
      this.buildTacoFormData(request)
    );

    const tacoId = uuidv4();
    const currentTacos = await this.getCart(id);
    await this.tacoMappingRepository.store(id, currentTacos.length, tacoId);

    return await this.parseTacoWithStock(htmlResponse, tacoId);
  }

  async getTacoDetails(id: CartId, tacoId: string): Promise<Taco> {
    await this.getCartOrThrow(id);
    const backendIndex = await this.getBackendIndex(id, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    const response = await this.sessionApiClient.postForm<string>(id, '/ajax/gtd.php', {
      index: backendIndex,
    });

    return await this.parseTacoWithStock(response, tacoId);
  }

  async updateTaco(id: CartId, request: UpdateTacoRequest): Promise<Taco> {
    await this.getCartOrThrow(id);
    const backendIndex = await this.getBackendIndex(id, request.id);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${request.id}`);
    }

    const response = await this.sessionApiClient.postFormData<string>(
      id,
      '/ajax/et.php',
      this.buildTacoFormData(request, backendIndex)
    );

    return await this.parseTacoWithStock(response, request.id);
  }

  async updateTacoQuantity(
    id: CartId,
    tacoId: string,
    action: 'increase' | 'decrease'
  ): Promise<{ quantity: number }> {
    await this.getCartOrThrow(id);
    const backendIndex = await this.getBackendIndex(id, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    const response = await this.sessionApiClient.postForm<{ quantity: number }>(
      id,
      '/ajax/owt.php',
      {
        action: action === 'increase' ? 'increaseQuantity' : 'decreaseQuantity',
        index: backendIndex,
      }
    );

    return { quantity: response.quantity };
  }

  async deleteTaco(id: CartId, tacoId: string): Promise<void> {
    await this.getCartOrThrow(id);
    const backendIndex = await this.getBackendIndex(id, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    await this.sessionApiClient.post(id, '/ajax/dt.php', { index: backendIndex });
    await this.tacoMappingRepository.remove(id, tacoId);
  }

  async getExtras(id: CartId): Promise<Extra[]> {
    await this.getCartOrThrow(id);
    const response = await this.sessionApiClient.post<
      Record<string, Partial<Extra> & { free_sauce?: unknown; slug?: string }>
    >(id, '/ajax/gse.php');

    return Object.entries(response).map(([id, extra]) => {
      const code = extra.id || id; // Use id from response as code
      const normalized: Extra = {
        id: ExtraIdSchema.parse(deterministicUUID(code, StockCategory.Extras)), // Generate deterministic UUID
        code, // Set code to original identifier
        name: extra.name || id,
        price: extra.price ?? 0,
        quantity: extra.quantity ?? 1,
      };

      const freeSauces = extra.free_sauces || (extra.free_sauce ? [extra.free_sauce] : []);
      if (freeSauces.length > 0) {
        normalized.free_sauces = freeSauces.map(
          (s: { id?: string; name?: string; price?: number }) => ({
            id: s.id || '',
            name: s.name || '',
            price: s.price ?? 0,
          })
        );
      }

      return normalized;
    });
  }

  async addExtra(id: CartId, extra: Extra): Promise<Extra> {
    await this.getCartOrThrow(id);
    const payload: Extra = {
      id: extra.id,
      code: extra.code,
      name: extra.name,
      price: extra.price,
      quantity: extra.quantity,
      ...(extra.free_sauce && { free_sauce: extra.free_sauce }),
      ...(extra.free_sauces && { free_sauces: extra.free_sauces }),
    };

    await this.sessionApiClient.post(id, '/ajax/ues.php', payload);
    return extra;
  }

  async getDrinks(id: CartId): Promise<Drink[]> {
    await this.getCartOrThrow(id);
    const response = await this.sessionApiClient.post<
      Record<string, Partial<Drink> & { slug?: string }>
    >(id, '/ajax/gsb.php');
    return Object.entries(response).map(([id, drink]) => {
      const code = drink.id || drink.slug || id; // Use id or slug as code
      return {
        id: DrinkIdSchema.parse(deterministicUUID(code, StockCategory.Drinks)), // Generate deterministic UUID
        code, // Set code to original identifier
        name: drink.name || id,
        price: drink.price ?? 0,
        quantity: drink.quantity ?? 1,
      } as Drink;
    });
  }

  async addDrink(id: CartId, drink: Drink): Promise<Drink> {
    await this.getCartOrThrow(id);
    const payload: Drink = {
      id: drink.id,
      code: drink.code,
      name: drink.name,
      price: drink.price,
      quantity: drink.quantity,
    };

    await this.sessionApiClient.post(id, '/ajax/ubs.php', payload);
    return drink;
  }

  async getDesserts(id: CartId): Promise<Dessert[]> {
    await this.getCartOrThrow(id);
    const response = await this.sessionApiClient.post<
      Record<string, Partial<Dessert> & { slug?: string }>
    >(id, '/ajax/gsd.php');
    return Object.entries(response).map(([id, dessert]) => {
      const code = dessert.id || dessert.slug || id; // Use id or slug as code
      return {
        id: DessertIdSchema.parse(deterministicUUID(code, StockCategory.Desserts)), // Generate deterministic UUID
        code, // Set code to original identifier
        name: dessert.name || id,
        price: dessert.price ?? 0,
        quantity: dessert.quantity ?? 1,
      } as Dessert;
    });
  }

  async addDessert(id: CartId, dessert: Dessert): Promise<Dessert> {
    await this.getCartOrThrow(id);
    const payload: Dessert = {
      id: dessert.id,
      code: dessert.code,
      name: dessert.name,
      price: dessert.price,
      quantity: dessert.quantity,
    };

    await this.sessionApiClient.post(id, '/ajax/uds.php', payload);
    return dessert;
  }

  private async getParsedTacosFromSummary(id: CartId): Promise<Taco[]> {
    const [stockData, htmlResponse] = await Promise.all([
      this.resourceService.getStock(),
      this.sessionApiClient.post<string>(id, '/ajax/owt.php', { loadProducts: true }),
    ]);
    return parseCategorySummaryFromTacos(htmlResponse, stockData);
  }

  async getCartSummary(id: CartId): Promise<CartSummary> {
    await this.getCartOrThrow(id);

    const [tacos, extras, drinks, desserts] = await Promise.all([
      this.getParsedTacosFromSummary(id),
      this.getExtras(id),
      this.getDrinks(id),
      this.getDesserts(id),
    ]);

    const tacosSummary = this.computeCategorySummary(tacos);
    const extrasSummary = this.computeCategorySummary(extras);
    const boissonsSummary = this.computeCategorySummary(drinks);
    const dessertsSummary = this.computeCategorySummary(desserts);

    return {
      tacos: tacosSummary,
      extras: extrasSummary,
      boissons: boissonsSummary,
      desserts: dessertsSummary,
      total: {
        quantity:
          tacosSummary.totalQuantity +
          extrasSummary.totalQuantity +
          boissonsSummary.totalQuantity +
          dessertsSummary.totalQuantity,
        price:
          tacosSummary.totalPrice +
          extrasSummary.totalPrice +
          boissonsSummary.totalPrice +
          dessertsSummary.totalPrice,
      },
    };
  }

  private async getBackendIndex(id: CartId, tacoId: string): Promise<number | null> {
    return await this.tacoMappingRepository.getBackendIndex(id, tacoId);
  }

  async cleanupExpiredCarts(): Promise<number> {
    return await this.cartRepository.cleanupExpiredCarts(this.CART_MAX_AGE_MS);
  }
}
