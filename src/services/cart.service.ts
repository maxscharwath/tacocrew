/**
 * Session-aware cart service for managing shopping cart operations
 * @module services/cart
 */

import { sessionApiClient } from '../api/session-client';
import { logger } from '../utils/logger';
import {
  Cart,
  AddTacoRequest,
  UpdateTacoRequest,
  Taco,
  Extra,
  Drink,
  Dessert,
  CategorySummary,
} from '../types';

/**
 * Cart Service - Session-aware
 * All operations require a sessionId
 */
export class CartService {
  /**
   * Get complete cart contents for a session
   */
  async getCart(sessionId: string): Promise<Cart> {
    logger.debug('Fetching cart contents', { sessionId });

    const [tacos, extras, drinks, desserts, summary] = await Promise.all([
      this.getTacos(sessionId),
      this.getExtras(sessionId),
      this.getDrinks(sessionId),
      this.getDesserts(sessionId),
      this.getCategorySummary(sessionId),
    ]);

    const cart: Cart = {
      sessionId,
      tacos,
      extras,
      drinks,
      desserts,
      summary: {
        ...summary,
        total: {
          quantity:
            summary.tacos.totalQuantity +
            summary.extras.totalQuantity +
            summary.boissons.totalQuantity +
            summary.desserts.totalQuantity,
          price:
            summary.tacos.totalPrice +
            summary.extras.totalPrice +
            summary.boissons.totalPrice +
            summary.desserts.totalPrice,
        },
      },
    };

    logger.info('Cart fetched successfully', {
      sessionId,
      totalItems: cart.summary.total.quantity,
      totalPrice: cart.summary.total.price,
    });

    return cart;
  }

  /**
   * Get all tacos in cart for a session
   */
  async getTacos(sessionId: string): Promise<Taco[]> {
    logger.debug('Fetching tacos from cart', { sessionId });
    const response = await sessionApiClient.post<string>(
      sessionId,
      '/ajax/owt.php',
      { loadProducts: true }
    );
    // Note: Backend returns HTML, would need parsing in real implementation
    // For now, return empty array - implement HTML parser if needed
    return [];
  }

  /**
   * Add taco to cart for a session
   */
  async addTaco(sessionId: string, request: AddTacoRequest): Promise<Taco> {
    logger.debug('Adding taco to cart', { sessionId, size: request.size });

    const formData: Record<string, unknown> = {
      selectProduct: request.size,
      tacosNote: request.note || '',
    };

    // Add meats
    request.meats.forEach((meat) => {
      if (!formData['viande[]']) {
        formData['viande[]'] = [];
      }
      (formData['viande[]'] as string[]).push(meat.id);
      formData[`meat_quantity[${meat.id}]`] = meat.quantity;
    });

    // Add sauces
    request.sauces.forEach((sauce) => {
      if (!formData['sauce[]']) {
        formData['sauce[]'] = [];
      }
      (formData['sauce[]'] as string[]).push(sauce);
    });

    // Add garnitures
    request.garnitures.forEach((garniture) => {
      if (!formData['garniture[]']) {
        formData['garniture[]'] = [];
      }
      (formData['garniture[]'] as string[]).push(garniture);
    });

    await sessionApiClient.postForm(sessionId, '/ajax/owt.php', formData);

    logger.info('Taco added to cart successfully', { sessionId });

    // Return placeholder - would parse HTML response in real implementation
    return {
      id: 0, // Would be determined from backend response
      size: request.size,
      meats: request.meats.map((m) => ({ ...m, name: m.id })),
      sauces: request.sauces.map((s) => ({ id: s, name: s })),
      garnitures: request.garnitures.map((g) => ({ id: g, name: g })),
      note: request.note,
      quantity: 1,
      price: 0,
    };
  }

  /**
   * Get taco details by index
   */
  async getTacoDetails(sessionId: string, index: number): Promise<Taco> {
    logger.debug('Fetching taco details', { sessionId, index });

    const response = await sessionApiClient.postForm<{ status: string; data: unknown }>(
      sessionId,
      '/ajax/gtd.php',
      { index }
    );

    if (response.status !== 'success') {
      throw new Error('Failed to get taco details');
    }

    logger.info('Taco details fetched', { sessionId, index });
    // Would parse and return proper Taco object
    return {} as Taco;
  }

  /**
   * Update taco in cart
   */
  async updateTaco(sessionId: string, request: UpdateTacoRequest): Promise<Taco> {
    logger.debug('Updating taco', { sessionId, id: request.id });

    const formData: Record<string, unknown> = {
      editSelectProduct: request.size,
      tacosNote: request.note || '',
    };

    // Add meats
    request.meats.forEach((meat) => {
      if (!formData['viande[]']) {
        formData['viande[]'] = [];
      }
      (formData['viande[]'] as string[]).push(meat.id);
      formData[`meat_quantity[${meat.id}]`] = meat.quantity;
    });

    // Add sauces
    request.sauces.forEach((sauce) => {
      if (!formData['sauce[]']) {
        formData['sauce[]'] = [];
      }
      (formData['sauce[]'] as string[]).push(sauce);
    });

    // Add garnitures
    request.garnitures.forEach((garniture) => {
      if (!formData['garniture[]']) {
        formData['garniture[]'] = [];
      }
      (formData['garniture[]'] as string[]).push(garniture);
    });

    await sessionApiClient.postFormData(sessionId, '/ajax/et.php', formData);

    logger.info('Taco updated successfully', { sessionId, id: request.id });

    return {} as Taco;
  }

  /**
   * Update taco quantity
   */
  async updateTacoQuantity(
    sessionId: string,
    index: number,
    action: 'increase' | 'decrease'
  ): Promise<{ quantity: number }> {
    logger.debug('Updating taco quantity', { sessionId, index, action });

    const formAction = action === 'increase' ? 'increaseQuantity' : 'decreaseQuantity';
    const response = await sessionApiClient.postForm<{ status: string; quantity: number }>(
      sessionId,
      '/ajax/owt.php',
      { action: formAction, index }
    );

    logger.info('Taco quantity updated', { sessionId, index, newQuantity: response.quantity });
    return { quantity: response.quantity };
  }

  /**
   * Delete taco from cart
   */
  async deleteTaco(sessionId: string, index: number): Promise<void> {
    logger.debug('Deleting taco', { sessionId, index });
    await sessionApiClient.post(sessionId, '/ajax/dt.php', { index });
    logger.info('Taco deleted from cart', { sessionId, index });
  }

  /**
   * Get all extras in cart
   */
  async getExtras(sessionId: string): Promise<Extra[]> {
    logger.debug('Fetching extras from cart', { sessionId });
    const response = await sessionApiClient.post<Record<string, Extra>>(
      sessionId,
      '/ajax/gse.php'
    );
    return Object.values(response);
  }

  /**
   * Add or update extra in cart
   */
  async addExtra(sessionId: string, extra: Extra): Promise<Extra> {
    logger.debug('Adding extra to cart', { sessionId, id: extra.id });
    await sessionApiClient.post(sessionId, '/ajax/ues.php', extra);
    logger.info('Extra added to cart', { sessionId, id: extra.id });
    return extra;
  }

  /**
   * Get all drinks in cart
   */
  async getDrinks(sessionId: string): Promise<Drink[]> {
    logger.debug('Fetching drinks from cart', { sessionId });
    const response = await sessionApiClient.post<Record<string, Drink>>(
      sessionId,
      '/ajax/gsb.php'
    );
    return Object.values(response);
  }

  /**
   * Add or update drink in cart
   */
  async addDrink(sessionId: string, drink: Drink): Promise<Drink> {
    logger.debug('Adding drink to cart', { sessionId, id: drink.id });
    await sessionApiClient.post(sessionId, '/ajax/ubs.php', drink);
    logger.info('Drink added to cart', { sessionId, id: drink.id });
    return drink;
  }

  /**
   * Get all desserts in cart
   */
  async getDesserts(sessionId: string): Promise<Dessert[]> {
    logger.debug('Fetching desserts from cart', { sessionId });
    const response = await sessionApiClient.post<Record<string, Dessert>>(
      sessionId,
      '/ajax/gsd.php'
    );
    return Object.values(response);
  }

  /**
   * Add or update dessert in cart
   */
  async addDessert(sessionId: string, dessert: Dessert): Promise<Dessert> {
    logger.debug('Adding dessert to cart', { sessionId, id: dessert.id });
    await sessionApiClient.post(sessionId, '/ajax/uds.php', dessert);
    logger.info('Dessert added to cart', { sessionId, id: dessert.id });
    return dessert;
  }

  /**
   * Get category summary (quantities and prices)
   */
  async getCategorySummary(sessionId: string): Promise<{
    tacos: CategorySummary;
    extras: CategorySummary;
    boissons: CategorySummary;
    desserts: CategorySummary;
  }> {
    logger.debug('Fetching category summary', { sessionId });
    const response = await sessionApiClient.post<{
      tacos: CategorySummary;
      extras: CategorySummary;
      boissons: CategorySummary;
      desserts: CategorySummary;
    }>(sessionId, '/ajax/sd.php');
    return {
      tacos: response.tacos,
      extras: response.extras,
      boissons: response.boissons,
      desserts: response.desserts,
    };
  }
}

export const cartService = new CartService();
export default cartService;
