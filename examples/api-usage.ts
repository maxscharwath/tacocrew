/**
 * Example: Using the services programmatically
 * 
 * This file demonstrates how to use the services in your own code
 */

import { apiClient } from '../src/api/client';
import { cartService, orderService, resourceService } from '../src/services';
import { TacoSize, OrderType } from '../src/types';

/**
 * Example 1: Initialize and add items to cart
 */
async function exampleAddToCart(): Promise<void> {
  // Initialize API client (must be called first)
  await apiClient.initialize();

  // Add a taco
  const taco = await cartService.addTaco({
    size: TacoSize.XL,
    meats: [
      { id: 'viande_hachee', quantity: 2 },
      { id: 'escalope_de_poulet', quantity: 1 }
    ],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates', 'oignons'],
    note: 'Extra sauce please'
  });

  console.log('Taco added:', taco);

  // Add extras
  await cartService.addExtra({
    id: 'extra_frites',
    name: 'Frites',
    price: 3.50,
    quantity: 2,
    free_sauces: [
      { id: 'ketchup', name: 'Ketchup', price: 0 }
    ]
  });

  // Add a drink
  await cartService.addDrink({
    id: 'boisson_coca',
    name: 'Coca Cola',
    price: 2.50,
    quantity: 2
  });

  // Get full cart
  const cart = await cartService.getCart();
  console.log('Cart total:', cart.summary.total.price, 'CHF');
}

/**
 * Example 2: Check stock before ordering
 */
async function exampleCheckStock(): Promise<void> {
  await apiClient.initialize();

  // Get all stock info
  const stock = await resourceService.getStock();
  
  // Check if specific item is in stock
  const isAvailable = await resourceService.isInStock('viandes', 'viande_hachee');
  console.log('Viande hachée available:', isAvailable);

  // Get out of stock items for a category
  const outOfStockMeats = await resourceService.getOutOfStockProducts('viandes');
  if (outOfStockMeats.length > 0) {
    console.log('Out of stock meats:', outOfStockMeats);
  }
}

/**
 * Example 3: Place an order
 */
async function examplePlaceOrder(): Promise<void> {
  await apiClient.initialize();

  // First, add items to cart (see example 1)
  await cartService.addTaco({
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade']
  });

  // Create the order
  const order = await orderService.createOrder({
    customer: {
      name: 'John Doe',
      phone: '+41791234567'
    },
    delivery: {
      type: OrderType.DELIVERY,
      address: '123 Rue Example, 1000 Lausanne',
      requestedFor: '15:00'
    }
  });

  console.log('Order created:', order.orderId);
  console.log('Order status:', order.OrderData.status);
  console.log('Total price:', order.OrderData.price, 'CHF');

  // Track order status
  const status = await orderService.getOrderStatus(order.orderId);
  console.log('Current status:', status.status);
}

/**
 * Example 4: Check delivery time slots
 */
async function exampleTimeSlots(): Promise<void> {
  await apiClient.initialize();

  // Get all available time slots
  const slots = await orderService.getTimeSlots();
  
  // Filter for low-demand slots
  const availableSlots = slots.filter(slot => !slot.highDemand);
  console.log('Available slots:', availableSlots.map(s => s.time));

  // Check specific time
  const demand = await orderService.checkDeliveryDemand('15:00');
  if (demand.isHighDemand) {
    console.log('Warning: High demand at 15:00');
  }
}

/**
 * Example 5: Update cart items
 */
async function exampleUpdateCart(): Promise<void> {
  await apiClient.initialize();

  // Add a taco first
  await cartService.addTaco({
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade']
  });

  // Increase quantity
  await cartService.updateTacoQuantity(0, 'increase');

  // Get taco details for editing
  const details = await cartService.getTacoDetails(0);
  console.log('Taco details:', details);

  // Update the taco
  await cartService.updateTaco({
    id: 0,
    size: TacoSize.XL, // Upgraded size
    meats: [
      { id: 'viande_hachee', quantity: 2 }
    ],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates']
  });

  // Delete if needed
  // await cartService.deleteTaco(0);
}

/**
 * Example 6: Complete ordering flow
 */
async function exampleCompleteFlow(): Promise<void> {
  try {
    console.log('🌮 Starting complete order flow...\n');

    // 1. Initialize
    console.log('1. Initializing API client...');
    await apiClient.initialize();

    // 2. Check stock
    console.log('2. Checking stock availability...');
    const stock = await resourceService.getStock();
    console.log(`   ✓ Stock data loaded\n`);

    // 3. Add items to cart
    console.log('3. Adding items to cart...');
    
    await cartService.addTaco({
      size: TacoSize.XL,
      meats: [{ id: 'viande_hachee', quantity: 2 }],
      sauces: ['harissa'],
      garnitures: ['salade']
    });
    console.log('   ✓ Taco XL added');

    await cartService.addExtra({
      id: 'extra_frites',
      name: 'Frites',
      price: 3.50,
      quantity: 1,
      free_sauces: []
    });
    console.log('   ✓ Frites added');

    await cartService.addDrink({
      id: 'boisson_coca',
      name: 'Coca Cola',
      price: 2.50,
      quantity: 1
    });
    console.log('   ✓ Drink added\n');

    // 4. Review cart
    console.log('4. Reviewing cart...');
    const cart = await cartService.getCart();
    console.log(`   Items: ${cart.summary.total.quantity}`);
    console.log(`   Total: CHF ${cart.summary.total.price.toFixed(2)}\n`);

    // 5. Check delivery times
    console.log('5. Checking delivery times...');
    const slots = await orderService.getTimeSlots();
    const bestSlot = slots.find(s => !s.highDemand);
    console.log(`   Best time slot: ${bestSlot?.time || '15:00'}\n`);

    // 6. Place order
    console.log('6. Placing order...');
    const order = await orderService.createOrder({
      customer: {
        name: 'John Doe',
        phone: '+41791234567'
      },
      delivery: {
        type: OrderType.DELIVERY,
        address: '123 Rue Example, 1000 Lausanne',
        requestedFor: bestSlot?.time || '15:00'
      }
    });

    console.log(`   ✓ Order placed successfully!`);
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Status: ${order.OrderData.status}`);
    console.log(`   Total: CHF ${order.OrderData.price.toFixed(2)}`);
    console.log(`   Delivery time: ${order.OrderData.requestedFor}\n`);

    // 7. Track order
    console.log('7. Tracking order...');
    const status = await orderService.getOrderStatus(order.orderId);
    console.log(`   Current status: ${status.status}`);

    console.log('\n✅ Order flow completed successfully!');

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
