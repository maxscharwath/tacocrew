/**
 * Example: Using the services programmatically
 *
 * This file demonstrates how to use the services in your own code
 */

import { apiClient } from '../src/api/client';
import { cartService, orderService, resourceService } from '../src/services';
import { OrderType, StockCategory, TacoSize } from '../src/types';

/**
 * Example 1: Initialize and add items to cart
 */
async function _exampleAddToCart(): Promise<void> {
  // Initialize API client (must be called first)
  await apiClient.initialize();

  // Add a taco
  const _taco = await cartService.addTaco({
    size: TacoSize.XL,
    meats: [
      { id: 'viande_hachee', quantity: 2 },
      { id: 'escalope_de_poulet', quantity: 1 },
    ],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates', 'oignons'],
    note: 'Extra sauce please',
  });

  // Add extras
  await cartService.addExtra({
    id: 'extra_frites',
    name: 'Frites',
    price: 3.5,
    quantity: 2,
    free_sauces: [{ id: 'ketchup', name: 'Ketchup', price: 0 }],
  });

  // Add a drink
  await cartService.addDrink({
    id: 'boisson_coca',
    name: 'Coca Cola',
    price: 2.5,
    quantity: 2,
  });

  // Get full cart
  const _cart = await cartService.getCart();
}

/**
 * Example 2: Check stock before ordering
 */
async function _exampleCheckStock(): Promise<void> {
  await apiClient.initialize();

  // Get all stock info
  const _stock = await resourceService.getStock();

  // Check if specific item is in stock
  const _isAvailable = await resourceService.isInStock(StockCategory.Meats, 'viande_hachee');

  // Get out of stock items for a category
  const outOfStockMeats = await resourceService.getOutOfStockProducts(StockCategory.Meats);
  if (outOfStockMeats.length > 0) {
  }
}

/**
 * Example 3: Place an order
 */
async function _examplePlaceOrder(): Promise<void> {
  await apiClient.initialize();

  // First, add items to cart (see example 1)
  await cartService.addTaco({
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });

  // Create the order
  const order = await orderService.createOrder({
    customer: {
      name: 'John Doe',
      phone: '+41791234567',
    },
    delivery: {
      type: OrderType.DELIVERY,
      address: '123 Rue Example, 1000 Lausanne',
      requestedFor: '15:00',
    },
  });

  // Track order status
  const _status = await orderService.getOrderStatus(order.orderId);
}

/**
 * Example 4: Check delivery time slots
 */
async function _exampleTimeSlots(): Promise<void> {
  await apiClient.initialize();

  // Get all available time slots
  const slots = await orderService.getTimeSlots();

  // Filter for low-demand slots
  const _availableSlots = slots.filter((slot) => !slot.highDemand);

  // Check specific time
  const demand = await orderService.checkDeliveryDemand('15:00');
  if (demand.isHighDemand) {
  }
}

/**
 * Example 5: Update cart items
 */
async function _exampleUpdateCart(): Promise<void> {
  await apiClient.initialize();

  // Add a taco first
  await cartService.addTaco({
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });

  // Increase quantity
  await cartService.updateTacoQuantity(0, 'increase');

  // Get taco details for editing
  const _details = await cartService.getTacoDetails(0);

  // Update the taco
  await cartService.updateTaco({
    id: 0,
    size: TacoSize.XL, // Upgraded size
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });

  // Delete if needed
  // await cartService.deleteTaco(0);
}

/**
 * Example 6: Complete ordering flow
 */
async function exampleCompleteFlow(): Promise<void> {
  try {
    await apiClient.initialize();
    const _stock = await resourceService.getStock();

    await cartService.addTaco({
      size: TacoSize.XL,
      meats: [{ id: 'viande_hachee', quantity: 2 }],
      sauces: ['harissa'],
      garnitures: ['salade'],
    });

    await cartService.addExtra({
      id: 'extra_frites',
      name: 'Frites',
      price: 3.5,
      quantity: 1,
      free_sauces: [],
    });

    await cartService.addDrink({
      id: 'boisson_coca',
      name: 'Coca Cola',
      price: 2.5,
      quantity: 1,
    });
    const _cart = await cartService.getCart();
    const slots = await orderService.getTimeSlots();
    const bestSlot = slots.find((s) => !s.highDemand);
    const order = await orderService.createOrder({
      customer: {
        name: 'John Doe',
        phone: '+41791234567',
      },
      delivery: {
        type: OrderType.DELIVERY,
        address: '123 Rue Example, 1000 Lausanne',
        requestedFor: bestSlot?.time || '15:00',
      },
    });
    const _status = await orderService.getOrderStatus(order.orderId);
  } catch (error) {
    console.error('❌ Error in order flow:', error);
  } finally {
    // Cleanup
    apiClient.destroy();
  }
}

// Run examples (uncomment the one you want to test)
// exampleAddToCart().catch(console.error);
// exampleCheckStock().catch(console.error);
// examplePlaceOrder().catch(console.error);
// exampleTimeSlots().catch(console.error);
// exampleUpdateCart().catch(console.error);
exampleCompleteFlow().catch(console.error);
