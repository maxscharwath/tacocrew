/**
 * Cart service with integrated session management
 * @module services/cart
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { TacosApiClient } from '../api/client';
import { SessionApiClient } from '../api/session-client';
import { CartRepository } from '../database/cart.repository';
import {
  AddTacoRequest,
  CartMetadata,
  CartSummary,
  CategorySummary,
  Dessert,
  Drink,
  Extra,
  Taco,
  UpdateTacoRequest,
} from '../types';
import { NotFoundError } from '../utils/errors';
import { inject } from '../utils/inject';
import { parseTacoCard, parseCategorySummaryFromTacos } from '../utils/html-parser';
import { TacoMappingRepository } from '../database/taco-mapping.repository';
import { ResourceService } from './resource.service';

/**
 * Cart Service - Manages carts with session data (csrfToken, cookies)
 * All operations require a cartId
 */
@injectable()
export class CartService {
  private readonly sessionApiClient = inject(SessionApiClient);
  private readonly apiClient = inject(TacosApiClient);
  private readonly cartRepository = inject(CartRepository);
  private readonly tacoMappingRepository = inject(TacoMappingRepository);
  private readonly resourceService = inject(ResourceService);

  private readonly CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private async getCartOrThrow(cartId: string): Promise<CartMetadata> {
    const cart = await this.cartRepository.getCart(cartId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }
    return cart;
  }

  private buildTacoFormData(request: AddTacoRequest | UpdateTacoRequest, index?: number): Record<string, string | number | string[]> {
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
        id: mappedId?.startsWith('temp-') || taco.id.startsWith('temp-') ? uuidv4() : (mappedId || taco.id),
      };
    });
  }

  private computeCategorySummary<T extends { price: number; quantity: number }>(items: T[]): CategorySummary {
    return items.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + item.quantity,
        totalPrice: acc.totalPrice + item.price * item.quantity,
      }),
      { totalQuantity: 0, totalPrice: 0 }
    );
  }

  private normalizeItem<T extends { id?: string; name?: string; price?: number; quantity?: number; slug?: string }>(
    [id, item]: [string, T],
    defaultId?: string
  ): { id: string; name: string; price: number; quantity: number } {
    return {
      id: item.id || item.slug || defaultId || id,
      name: item.name || id,
      price: item.price ?? 0,
      quantity: item.quantity ?? 1,
    };
  }

  async createCart(metadata?: { ip?: string; userAgent?: string }): Promise<{ cartId: string }> {
    const cartId = uuidv4();
    const { cookies } = await this.apiClient.refreshCsrfToken();
    
    await this.cartRepository.createCart(cartId, {
      cookies,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      metadata: metadata || {},
    });

    return { cartId };
  }

  async getCart(cartId: string): Promise<Taco[]> {
    await this.getCartOrThrow(cartId);
    const tacos = await this.getParsedTacosFromSummary(cartId);
    const mapping = await this.tacoMappingRepository.getAllMappings(cartId);
    return this.mapTacoIds(tacos, mapping);
  }

  async getCartWithSummary(cartId: string): Promise<{
    tacos: Taco[];
    extras: Extra[];
    drinks: Drink[];
    desserts: Dessert[];
    summary: CartSummary;
  }> {
    await this.getCartOrThrow(cartId);

    const [parsedTacos, extras, drinks, desserts, mapping] = await Promise.all([
      this.getParsedTacosFromSummary(cartId),
      this.getExtras(cartId),
      this.getDrinks(cartId),
      this.getDesserts(cartId),
      this.tacoMappingRepository.getAllMappings(cartId),
    ]);

    const tacos = this.mapTacoIds(parsedTacos, mapping);
    const summary = await this.getCartSummary(cartId);

    return { tacos, extras, drinks, desserts, summary };
  }

  async getCartSession(cartId: string): Promise<CartMetadata> {
    return await this.getCartOrThrow(cartId);
  }

  async updateCartSession(cartId: string, updates: Partial<CartMetadata>): Promise<void> {
    await this.getCartOrThrow(cartId);
    await this.cartRepository.updateCart(cartId, updates);
  }

  async addTaco(cartId: string, request: AddTacoRequest): Promise<Taco> {
    await this.getCartOrThrow(cartId);
    
    const htmlResponse = await this.sessionApiClient.postForm<string>(
      cartId,
      '/ajax/owt.php',
      this.buildTacoFormData(request)
    );

    const tacoId = uuidv4();
    const currentTacos = await this.getCart(cartId);
    await this.tacoMappingRepository.store(cartId, currentTacos.length, tacoId);

    return await this.parseTacoWithStock(htmlResponse, tacoId);
  }

  async getTacoDetails(cartId: string, tacoId: string): Promise<Taco> {
    await this.getCartOrThrow(cartId);
    const backendIndex = await this.getBackendIndex(cartId, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    const response = await this.sessionApiClient.postForm<string>(
      cartId,
      '/ajax/gtd.php',
      { index: backendIndex }
    );

    return await this.parseTacoWithStock(response, tacoId);
  }

  async updateTaco(cartId: string, request: UpdateTacoRequest): Promise<Taco> {
    await this.getCartOrThrow(cartId);
    const backendIndex = await this.getBackendIndex(cartId, request.id);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${request.id}`);
    }

    const response = await this.sessionApiClient.postFormData<string>(
      cartId,
      '/ajax/et.php',
      this.buildTacoFormData(request, backendIndex)
    );

    return await this.parseTacoWithStock(response, request.id);
  }

  async updateTacoQuantity(cartId: string, tacoId: string, action: 'increase' | 'decrease'): Promise<{ quantity: number }> {
    await this.getCartOrThrow(cartId);
    const backendIndex = await this.getBackendIndex(cartId, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    const response = await this.sessionApiClient.postForm<{ quantity: number }>(
      cartId,
      '/ajax/owt.php',
      { action: action === 'increase' ? 'increaseQuantity' : 'decreaseQuantity', index: backendIndex }
    );

    return { quantity: response.quantity };
  }

  async deleteTaco(cartId: string, tacoId: string): Promise<void> {
    await this.getCartOrThrow(cartId);
    const backendIndex = await this.getBackendIndex(cartId, tacoId);
    if (backendIndex === null) {
      throw new NotFoundError(`Taco not found: ${tacoId}`);
    }

    await this.sessionApiClient.post(cartId, '/ajax/dt.php', { index: backendIndex });
    await this.tacoMappingRepository.remove(cartId, tacoId);
  }

  async getExtras(cartId: string): Promise<Extra[]> {
    await this.getCartOrThrow(cartId);
    const response = await this.sessionApiClient.post<Record<string, Partial<Extra> & { free_sauce?: unknown; slug?: string }>>(
      cartId,
      '/ajax/gse.php'
    );
    
    return Object.entries(response).map(([id, extra]) => {
      const normalized: Extra = {
        id: extra.id || id,
        name: extra.name || id,
        price: extra.price ?? 0,
        quantity: extra.quantity ?? 1,
      };
      
      const freeSauces = extra.free_sauces || (extra.free_sauce ? [extra.free_sauce] : []);
      if (freeSauces.length > 0) {
        normalized.free_sauces = freeSauces.map((s: any) => ({
          id: s.id || '',
          name: s.name || '',
          price: s.price ?? 0,
        }));
      }
      
      return normalized;
    });
  }

  async addExtra(cartId: string, extra: Extra): Promise<Extra> {
    await this.getCartOrThrow(cartId);
    await this.sessionApiClient.post(cartId, '/ajax/ues.php', extra);
    return extra;
  }

  async getDrinks(cartId: string): Promise<Drink[]> {
    await this.getCartOrThrow(cartId);
    const response = await this.sessionApiClient.post<Record<string, Partial<Drink> & { slug?: string }>>(
      cartId,
      '/ajax/gsb.php'
    );
    return Object.entries(response).map(([id, drink]) => this.normalizeItem([id, drink]) as Drink);
  }

  async addDrink(cartId: string, drink: Drink): Promise<Drink> {
    await this.getCartOrThrow(cartId);
    await this.sessionApiClient.post(cartId, '/ajax/ubs.php', drink);
    return drink;
  }

  async getDesserts(cartId: string): Promise<Dessert[]> {
    await this.getCartOrThrow(cartId);
    const response = await this.sessionApiClient.post<Record<string, Partial<Dessert> & { slug?: string }>>(
      cartId,
      '/ajax/gsd.php'
    );
    return Object.entries(response).map(([id, dessert]) => this.normalizeItem([id, dessert]) as Dessert);
  }

  async addDessert(cartId: string, dessert: Dessert): Promise<Dessert> {
    await this.getCartOrThrow(cartId);
    await this.sessionApiClient.post(cartId, '/ajax/uds.php', dessert);
    return dessert;
  }

  private async getParsedTacosFromSummary(cartId: string): Promise<Taco[]> {
    const [stockData, htmlResponse] = await Promise.all([
      this.resourceService.getStock(),
      this.sessionApiClient.post<string>(cartId, '/ajax/owt.php', { loadProducts: true }),
    ]);
    return parseCategorySummaryFromTacos(htmlResponse, stockData);
  }

  async getCartSummary(cartId: string): Promise<CartSummary> {
    await this.getCartOrThrow(cartId);
    
    const [tacos, extras, drinks, desserts] = await Promise.all([
      this.getParsedTacosFromSummary(cartId),
      this.getExtras(cartId),
      this.getDrinks(cartId),
      this.getDesserts(cartId),
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
        quantity: tacosSummary.totalQuantity + extrasSummary.totalQuantity + boissonsSummary.totalQuantity + dessertsSummary.totalQuantity,
        price: tacosSummary.totalPrice + extrasSummary.totalPrice + boissonsSummary.totalPrice + dessertsSummary.totalPrice,
      },
    };
  }

  private async getBackendIndex(cartId: string, tacoId: string): Promise<number | null> {
    return await this.tacoMappingRepository.getBackendIndex(cartId, tacoId);
  }

  async cleanupExpiredCarts(): Promise<number> {
    return await this.cartRepository.cleanupExpiredCarts(this.CART_MAX_AGE_MS);
  }
}
