/**
 * Example: Pure RESTful API with UUIDs in paths
 *
 * Both carts and tacos use UUIDs - fully RESTful!
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:4000/api/v1';

/**
 * Simple RESTful API client
 */
class TacosAPI {
  public cartId: string;
  private baseUrl: string;

  constructor(cartId?: string) {
    this.cartId = cartId || uuidv4();
    this.baseUrl = API_BASE;
  }

  private async request(method: string, path: string, data?: unknown) {
    const url = `${this.baseUrl}${path}`;
    const response = await axios({ method, url, data });
    return response.data;
  }

  // Cart operations
  async getCart() {
    return this.request('GET', `/carts/${this.cartId}`);
  }

  async addTaco(taco: {
    size: string;
    meats: Array<{ id: string; quantity: number }>;
    sauces: string[];
    garnitures: string[];
    note?: string;
  }) {
    const response = await this.request('POST', `/carts/${this.cartId}/tacos`, taco);
    return response.data; // Returns taco with UUID
  }

  async getTaco(tacoId: string) {
    return this.request('GET', `/carts/${this.cartId}/tacos/${tacoId}`);
  }

  async updateTaco(tacoId: string, taco: Parameters<typeof this.addTaco>[0]) {
    return this.request('PUT', `/carts/${this.cartId}/tacos/${tacoId}`, taco);
  }

  async updateTacoQuantity(tacoId: string, action: 'increase' | 'decrease') {
    return this.request('PATCH', `/carts/${this.cartId}/tacos/${tacoId}/quantity`, { action });
  }

  async deleteTaco(tacoId: string) {
    return this.request('DELETE', `/carts/${this.cartId}/tacos/${tacoId}`);
  }

  async addExtra(extra: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    free_sauces?: Array<{ id: string; name: string; price: number }>;
  }) {
    return this.request('POST', `/carts/${this.cartId}/extras`, extra);
  }

  async addDrink(drink: { id: string; name: string; price: number; quantity: number }) {
    return this.request('POST', `/carts/${this.cartId}/drinks`, drink);
  }

  async placeOrder(order: {
    customer: { name: string; phone: string };
    delivery: { type: string; address?: string; requestedFor: string };
  }) {
    return this.request('POST', `/carts/${this.cartId}/orders`, order);
  }
}

/**
 * Example 1: Basic usage with UUID tacos
 */
async function basicUsage() {
  const api = new TacosAPI();
  const _taco = await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  const _cart = await api.getCart();
}

/**
 * Example 2: Edit and remove tacos by UUID
 */
async function editAndRemove() {
  const api = new TacosAPI();
  const taco1 = await api.addTaco({
    size: 'tacos_L',
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });

  const taco2 = await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'escalope_de_poulet', quantity: 2 }],
    sauces: ['algérienne'],
    garnitures: ['tomates'],
  });
  await api.updateTaco(taco1.id, {
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  await api.deleteTaco(taco2.id);

  // Check final cart
  const _cart = await api.getCart();
}

/**
 * Example 3: Complete order flow with UUID tracking
 */
async function completeOrderFlow() {
  const api = new TacosAPI();
  const tacoIds: string[] = [];
  const taco1 = await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  tacoIds.push(taco1.id);

  const taco2 = await api.addTaco({
    size: 'tacos_L',
    meats: [{ id: 'escalope_de_poulet', quantity: 1 }],
    sauces: ['algérienne'],
    garnitures: ['tomates'],
  });
  tacoIds.push(taco2.id);

  await api.addExtra({
    id: 'extra_frites',
    name: 'Frites',
    price: 3.5,
    quantity: 1,
    free_sauces: [],
  });
  await api.updateTaco(tacoIds[0]!, {
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  const _cart = await api.getCart();
  const _order = await api.placeOrder({
    customer: {
      name: 'John Doe',
      phone: '+41791234567',
    },
    delivery: {
      type: 'livraison',
      address: '123 Rue Example, 1000 Lausanne',
      requestedFor: '15:00',
    },
  });
}

/**
 * Example 4: RESTful patterns with UUIDs
 */
async function restfulPatterns() {
  const api = new TacosAPI();
  const taco = await api.addTaco({
    size: 'tacos_L',
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  const _fetchedTaco = await api.getTaco(taco.id);
  await api.updateTaco(taco.id, {
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  await api.updateTacoQuantity(taco.id, 'increase');
  await api.deleteTaco(taco.id);
}

/**
 * Example 5: Managing multiple tacos by UUID
 */
async function managingMultipleTacos() {
  const api = new TacosAPI();
  const tacos: Array<{ id: string; size: string }> = [];
  for (let i = 0; i < 3; i++) {
    const taco = await api.addTaco({
      size: 'tacos_L',
      meats: [{ id: 'viande_hachee', quantity: 1 }],
      sauces: ['harissa'],
      garnitures: ['salade'],
    });
    tacos.push({ id: taco.id, size: 'tacos_L' });
  }
  await api.updateTaco(tacos[1]!.id, {
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  await api.deleteTaco(tacos[0]!.id);
  await api.deleteTaco(tacos[2]!.id);

  // Only middle taco remains
  const _cart = await api.getCart();
}

/**
 * Run all examples
 */
async function main() {
  try {
    await basicUsage();
    await editAndRemove();
    await completeOrderFlow();
    await restfulPatterns();
    await managingMultipleTacos();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TacosAPI, basicUsage, editAndRemove, completeOrderFlow };
