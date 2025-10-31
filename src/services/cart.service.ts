/**
 * Cart service for managing shopping cart operations
 * @module services/cart
 */

import { apiClient } from '../api/client';
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
  CartSummary,
} from '../types';

/**
 * Cart Service
 */
export class CartService {
  /**
   * Get complete cart contents
   */
  async getCart(): Promise<Cart> {
    logger.debug('Fetching cart contents');

    const [tacos, extras, drinks, desserts, summary] = await Promise.all([
      this.getTacos(),
      this.getExtras(),
      this.getDrinks(),
      this.getDesserts(),
      this.getCategorySummary(),
    ]);

    const cart: Cart = {
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
      totalItems: cart.summary.total.quantity,
      totalPrice: cart.summary.total.price,
    });

    return cart;
  }

  /**
   * Get all tacos in cart
   */
  async getTacos(): Promise<Taco[]> {
    logger.debug('Fetching tacos from cart');
    const response = await apiClient.post<string>('/ajax/owt.php', { loadProducts: true });
    // Note: Backend returns HTML, would need parsing in real implementation
    // For now, return empty array - implement HTML parser if needed
    return [];
  }

  /**
   * Add taco to cart
   */
  async addTaco(request: AddTacoRequest): Promise<Taco> {
    logger.debug('Adding taco to cart', { size: request.size });

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

    await apiClient.postForm('/ajax/owt.php', formData);

    logger.info('Taco added to cart successfully');

    // Return placeholder - would parse HTML response in real implementation
    return {
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
  async getTacoDetails(index: number): Promise<Taco> {
    logger.debug('Fetching taco details', { index });

    const response = await apiClient.postForm<{ status: string; data: unknown }>('/ajax/gtd.php', {
      index,
    });

    if (response.status !== 'success') {
      throw new Error('Failed to get taco details');
    }

    logger.info('Taco details fetched', { index });
    // Would parse and return proper Taco object
    return {} as Taco;
  }

  /**
   * Update taco in cart
   */
  async updateTaco(request: UpdateTacoRequest): Promise<Taco> {
    logger.debug('Updating taco', { id: request.id });

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

    await apiClient.postFormData('/ajax/et.php', formData);

    logger.info('Taco updated successfully', { id: request.id });

    return {} as Taco;
  }

  /**
   * Update taco quantity
   */
  async updateTacoQuantity(
    index: number,
    action: 'increase' | 'decrease'
  ): Promise<{ quantity: number }> {
    logger.debug('Updating taco quantity', { index, action });

    const formAction = action === 'increase' ? 'increaseQuantity' : 'decreaseQuantity';
    const response = await apiClient.postForm<{ status: string; quantity: number }>(
      '/ajax/owt.php',
      {
        action: formAction,
        index,
      }
    );

    logger.info('Taco quantity updated', { index, newQuantity: response.quantity });
    return { quantity: response.quantity };
  }

  /**
   * Delete taco from cart
   */
  async deleteTaco(index: number): Promise<void> {
    logger.debug('Deleting taco', { index });
    await apiClient.post('/ajax/dt.php', { index });
    logger.info('Taco deleted from cart', { index });
  }

  /**
   * Get all extras in cart
   */
  async getExtras(): Promise<Extra[]> {
    logger.debug('Fetching extras from cart');
    const response = await apiClient.post<Record<string, Extra>>('/ajax/gse.php');
    return Object.values(response);
  }

  /**
   * Add or update extra in cart
   */
  async addExtra(extra: Extra): Promise<Extra> {
    logger.debug('Adding extra to cart', { id: extra.id });
    await apiClient.post('/ajax/ues.php', extra);
    logger.info('Extra added to cart', { id: extra.id });
    return extra;
  }

  /**
   * Get all drinks in cart
   */
  async getDrinks(): Promise<Drink[]> {
    logger.debug('Fetching drinks from cart');
    const response = await apiClient.post<Record<string, Drink>>('/ajax/gsb.php');
    return Object.values(response);
  }

  /**
   * Add or update drink in cart
   */
  async addDrink(drink: Drink): Promise<Drink> {
    logger.debug('Adding drink to cart', { id: drink.id });
    await apiClient.post('/ajax/ubs.php', drink);
    logger.info('Drink added to cart', { id: drink.id });
    return drink;
  }

  /**
   * Get all desserts in cart
   */
  async getDesserts(): Promise<Dessert[]> {
    logger.debug('Fetching desserts from cart');
    const response = await apiClient.post<Record<string, Dessert>>('/ajax/gsd.php');
    return Object.values(response);
  }

  /**
   * Add or update dessert in cart
   */
  async addDessert(dessert: Dessert): Promise<Dessert> {
    logger.debug('Adding dessert to cart', { id: dessert.id });
    await apiClient.post('/ajax/uds.php', dessert);
    logger.info('Dessert added to cart', { id: dessert.id });
    return dessert;
  }

  /**
   * Get category summary (quantities and prices)
   */
  async getCategorySummary(): Promise<{
    tacos: CategorySummary;
    extras: CategorySummary;
    boissons: CategorySummary;
    desserts: CategorySummary;
  }> {
    logger.debug('Fetching category summary');
    const response = await apiClient.post<CartSummary>('/ajax/sd.php');
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
