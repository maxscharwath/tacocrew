// API Client Example
// This shows how to use the new API wrapper

class TacosAPI {
  constructor(baseURL = 'https://api.tacos.com/v1') {
    this.baseURL = baseURL;
    this.csrfToken = null;
  }

  async getResources() {
    const response = await fetch(`${this.baseURL}/api/resources`);
    return response.json();
  }

  async addTacoToCart(taco) {
    const response = await fetch(`${this.baseURL}/api/cart/tacos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.csrfToken}`,
      },
      body: JSON.stringify(taco),
    });
    return response.json();
  }

  async getCart() {
    const response = await fetch(`${this.baseURL}/api/cart`);
    return response.json();
  }

  async submitOrder(orderData) {
    const response = await fetch(`${this.baseURL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.csrfToken}`,
      },
      body: JSON.stringify(orderData),
    });
    return response.json();
  }

  async getOrder(orderId) {
    const response = await fetch(`${this.baseURL}/api/orders/${orderId}`);
    return response.json();
  }
}

// Usage example
const api = new TacosAPI();

// Get all available resources
const _resources = await api.getResources();

// Add a taco to cart
const taco = {
  size: 'tacos_XL',
  meats: [{ id: 'viande_hachee', quantity: 2 }],
  sauces: ['harissa', 'algérienne', 'blanche'],
  garnitures: ['salade', 'tomates', 'oignons'],
  note: 'Pas trop épicé',
};
const _addedTaco = await api.addTacoToCart(taco);

// Get cart contents
const _cart = await api.getCart();

// Submit order
const order = {
  customer: {
    name: 'John Doe',
    phone: '+41791234567',
  },
  delivery: {
    type: 'livraison',
    address: '123 Rue Example, 1000 Lausanne',
    requestedFor: '15:00',
  },
};
const _orderResult = await api.submitOrder(order);
