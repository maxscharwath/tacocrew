/**
 * Example: Using the API with hidden sessions
 *
 * Sessions are managed automatically via X-Session-Id header
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:4000/api/v1';

/**
 * Simple API client with automatic session management
 */
class TacosAPIClient {
  private sessionId: string | null = null;
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add session ID
    this.api.interceptors.request.use((config) => {
      if (this.sessionId) {
        config.headers['X-Session-Id'] = this.sessionId;
      }
      return config;
    });

    // Response interceptor - extract session ID
    this.api.interceptors.response.use((response) => {
      const sessionId = response.headers['x-session-id'];
      if (sessionId && sessionId !== this.sessionId) {
        this.sessionId = sessionId;
      }
      return response;
    });
  }

  async getCart() {
    const response = await this.api.get('/cart');
    return response.data;
  }

  async addTaco(taco: {
    size: string;
    meats: Array<{ id: string; quantity: number }>;
    sauces: string[];
    garnitures: string[];
    note?: string;
  }) {
    const response = await this.api.post('/cart/tacos', taco);
    return response.data;
  }

  async updateTaco(id: number, taco: Parameters<typeof this.addTaco>[0]) {
    const response = await this.api.put(`/cart/tacos/${id}`, taco);
    return response.data;
  }

  async deleteTaco(id: number) {
    const response = await this.api.delete(`/cart/tacos/${id}`);
    return response.data;
  }

  async addExtra(extra: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    free_sauces?: Array<{ id: string; name: string; price: number }>;
  }) {
    const response = await this.api.post('/cart/extras', extra);
    return response.data;
  }

  async placeOrder(order: {
    customer: { name: string; phone: string };
    delivery: { type: string; address?: string; requestedFor: string };
  }) {
    const response = await this.api.post('/orders', order);
    return response.data;
  }

  getSessionId() {
    return this.sessionId;
  }
}

/**
 * Example 1: Basic usage - session auto-created
 */
async function basicUsage() {
  const api = new TacosAPIClient();
  await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  const _cart = await api.getCart();
}

/**
 * Example 2: Edit and remove tacos
 */
async function editAndRemoveTacos() {
  const api = new TacosAPIClient();
  await api.addTaco({
    size: 'tacos_L',
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'escalope_de_poulet', quantity: 2 }],
    sauces: ['algérienne'],
    garnitures: ['tomates'],
  });
  await api.updateTaco(0, {
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  await api.deleteTaco(1);

  // Check final cart
  const _cart = await api.getCart();
}

/**
 * Example 3: Multiple concurrent orders (different clients)
 */
async function multipleConcurrentOrders() {
  // Client A
  const apiA = new TacosAPIClient();
  await apiA.addTaco({
    size: 'tacos_XXL',
    meats: [{ id: 'viande_hachee', quantity: 3 }],
    sauces: ['harissa', 'algérienne', 'blanche'],
    garnitures: ['salade', 'tomates', 'oignons'],
  });

  // Client B (completely independent)
  const apiB = new TacosAPIClient();
  await apiB.addTaco({
    size: 'tacos_L',
    meats: [{ id: 'escalope_de_poulet', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });

  // Verify isolation
  const _cartA = await apiA.getCart();
  const _cartB = await apiB.getCart();
}

/**
 * Example 4: Complete order flow
 */
async function completeOrderFlow() {
  const api = new TacosAPIClient();
  await api.addTaco({
    size: 'tacos_XL',
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  await api.addExtra({
    id: 'extra_frites',
    name: 'Frites',
    price: 3.5,
    quantity: 1,
    free_sauces: [],
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
 * Example 5: Custom session ID
 */
async function customSessionId() {
  const _api = new TacosAPIClient();

  // Generate your own UUID
  const mySessionId = uuidv4();

  // Add it to first request
  await axios.post(
    `${API_BASE}/cart/tacos`,
    {
      size: 'tacos_L',
      meats: [{ id: 'viande_hachee', quantity: 1 }],
      sauces: ['harissa'],
      garnitures: ['salade'],
    },
    {
      headers: {
        'X-Session-Id': mySessionId,
      },
    }
  );

  // Verify it's using the custom ID
  const cart = await axios.get(`${API_BASE}/cart`, {
    headers: {
      'X-Session-Id': mySessionId,
    },
  });

  const _returnedSessionId = cart.headers['x-session-id'];
}

/**
 * Run all examples
 */
async function main() {
  try {
    await basicUsage();
    await editAndRemoveTacos();
    await multipleConcurrentOrders();
    await completeOrderFlow();
    await customSessionId();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TacosAPIClient, basicUsage, editAndRemoveTacos, completeOrderFlow };
