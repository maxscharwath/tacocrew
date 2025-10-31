/**
 * Example: Using the session-based API
 * 
 * Demonstrates how to use sessions for managing multiple concurrent orders
 */

import { sessionService, cartService, orderService } from '../src/services';
import { sessionApiClient } from '../src/api/session-client';
import { TacoSize, OrderType } from '../src/types';
import { apiClient } from '../src/api/client';

/**
 * Example 1: Basic session workflow
 */
async function basicSessionWorkflow(): Promise<void> {
  console.log('🌮 Example 1: Basic Session Workflow\n');

  // Initialize the global API client (for stock, etc.)
  await apiClient.initialize();

  // 1. Create a new session
  console.log('1. Creating session...');
  const session = await sessionService.createSession({
    metadata: {
      customerName: 'John Doe',
      orderType: 'delivery',
    },
  });
  console.log(`   ✓ Session created: ${session.sessionId}\n`);

  // 2. Add items to cart
  console.log('2. Adding items to cart...');
  
  await cartService.addTaco(session.sessionId, {
    size: TacoSize.XL,
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
    note: 'Extra sauce please',
  });
  console.log('   ✓ Taco added');

  await cartService.addExtra(session.sessionId, {
    id: 'extra_frites',
    name: 'Frites',
    price: 3.50,
    quantity: 1,
    free_sauces: [],
  });
  console.log('   ✓ Frites added');

  await cartService.addDrink(session.sessionId, {
    id: 'boisson_coca',
    name: 'Coca Cola',
    price: 2.50,
    quantity: 1,
  });
  console.log('   ✓ Drink added\n');

  // 3. View cart
  console.log('3. Viewing cart...');
  const cart = await cartService.getCart(session.sessionId);
  console.log(`   Total items: ${cart.summary.total.quantity}`);
  console.log(`   Total price: CHF ${cart.summary.total.price.toFixed(2)}\n`);

  // 4. Place order
  console.log('4. Placing order...');
  const order = await orderService.createOrder(session.sessionId, {
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
  console.log(`   ✓ Order placed: ${order.orderId}`);
  console.log(`   Status: ${order.OrderData.status}`);
  console.log(`   Price: CHF ${order.OrderData.price.toFixed(2)}\n`);

  // 5. Clean up session
  console.log('5. Cleaning up...');
  await sessionService.deleteSession(session.sessionId);
  console.log('   ✓ Session deleted\n');

  console.log('✅ Basic workflow completed!\n');
}

/**
 * Example 2: Multiple concurrent sessions
 */
async function multipleConcurrentSessions(): Promise<void> {
  console.log('🌮 Example 2: Multiple Concurrent Sessions\n');

  await apiClient.initialize();

  // Create two sessions for different users
  console.log('Creating two sessions for different users...');
  
  const session1 = await sessionService.createSession({
    metadata: { customerName: 'Alice', orderType: 'delivery' },
  });
  console.log(`✓ Session 1 created: ${session1.sessionId}`);

  const session2 = await sessionService.createSession({
    metadata: { customerName: 'Bob', orderType: 'takeaway' },
  });
  console.log(`✓ Session 2 created: ${session2.sessionId}\n`);

  // User 1: Adds a large order
  console.log('Alice adds items to her cart...');
  await cartService.addTaco(session1.sessionId, {
    size: TacoSize.XXL,
    meats: [
      { id: 'viande_hachee', quantity: 2 },
      { id: 'escalope_de_poulet', quantity: 2 },
    ],
    sauces: ['harissa', 'algérienne', 'blanche'],
    garnitures: ['salade', 'tomates', 'oignons'],
  });
  console.log('✓ Alice: Taco XXL added\n');

  // User 2: Adds a small order
  console.log('Bob adds items to his cart...');
  await cartService.addTaco(session2.sessionId, {
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  console.log('✓ Bob: Taco L added\n');

  // Check both carts
  console.log('Checking both carts...');
  const cart1 = await cartService.getCart(session1.sessionId);
  const cart2 = await cartService.getCart(session2.sessionId);

  console.log(`Alice's cart: ${cart1.summary.total.quantity} items, CHF ${cart1.summary.total.price}`);
  console.log(`Bob's cart: ${cart2.summary.total.quantity} items, CHF ${cart2.summary.total.price}\n`);

  // Clean up
  await sessionService.deleteSession(session1.sessionId);
  await sessionService.deleteSession(session2.sessionId);
  console.log('✅ Sessions cleaned up\n');
}

/**
 * Example 3: Edit and remove tacos
 */
async function editAndRemoveTacos(): Promise<void> {
  console.log('🌮 Example 3: Edit and Remove Tacos\n');

  await apiClient.initialize();

  const session = await sessionService.createSession();
  console.log(`Session created: ${session.sessionId}\n`);

  // Add multiple tacos
  console.log('Adding 3 tacos...');
  for (let i = 0; i < 3; i++) {
    await cartService.addTaco(session.sessionId, {
      size: TacoSize.L,
      meats: [{ id: 'viande_hachee', quantity: 1 }],
      sauces: ['harissa'],
      garnitures: ['salade'],
    });
  }
  console.log('✓ 3 tacos added\n');

  // Edit the first taco (upgrade size)
  console.log('Editing taco #0 (upgrade to XL)...');
  await cartService.updateTaco(session.sessionId, {
    id: 0,
    size: TacoSize.XL,
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  console.log('✓ Taco #0 upgraded to XL\n');

  // Increase quantity of taco #1
  console.log('Increasing quantity of taco #1...');
  await cartService.updateTacoQuantity(session.sessionId, 1, 'increase');
  console.log('✓ Quantity increased\n');

  // Remove taco #2
  console.log('Removing taco #2...');
  await cartService.deleteTaco(session.sessionId, 2);
  console.log('✓ Taco #2 removed\n');

  // View final cart
  const cart = await cartService.getCart(session.sessionId);
  console.log(`Final cart: ${cart.summary.tacos.totalQuantity} tacos\n`);

  // Clean up
  await sessionService.deleteSession(session.sessionId);
  console.log('✅ Session cleaned up\n');
}

/**
 * Example 4: Session management
 */
async function sessionManagement(): Promise<void> {
  console.log('🌮 Example 4: Session Management\n');

  await apiClient.initialize();

  // Create multiple sessions
  console.log('Creating 5 sessions...');
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const session = await sessionService.createSession({
      metadata: { userIndex: i },
    });
    sessions.push(session);
  }
  console.log(`✓ Created ${sessions.length} sessions\n`);

  // List all sessions
  console.log('Listing all sessions...');
  const allSessions = await sessionService.getAllSessions();
  console.log(`Total sessions: ${allSessions.length}`);
  allSessions.forEach((s) => {
    console.log(`  - ${s.sessionId} (created: ${s.createdAt})`);
  });
  console.log();

  // Get statistics
  console.log('Session statistics:');
  const stats = await sessionService.getStats();
  console.log(`  Total: ${stats.totalSessions}`);
  console.log(`  Active: ${stats.activeSessions}`);
  console.log(`  Oldest: ${stats.oldestSession}`);
  console.log(`  Newest: ${stats.newestSession}\n`);

  // Update metadata for a session
  console.log('Updating session metadata...');
  await sessionService.updateSessionMetadata(sessions[0]!.sessionId, {
    customerName: 'Updated User',
    orderCompleted: true,
  });
  console.log('✓ Metadata updated\n');

  // Get specific session
  const updatedSession = await sessionService.getSession(sessions[0]!.sessionId);
  console.log('Updated session metadata:', updatedSession?.metadata);
  console.log();

  // Clean up all sessions
  console.log('Cleaning up all sessions...');
  for (const session of sessions) {
    await sessionService.deleteSession(session.sessionId);
  }
  console.log('✓ All sessions deleted\n');

  console.log('✅ Session management example completed!\n');
}

/**
 * Example 5: Using sessionApiClient directly
 */
async function directApiClientUsage(): Promise<void> {
  console.log('🌮 Example 5: Direct Session API Client Usage\n');

  await apiClient.initialize();

  // Create session
  const session = await sessionService.createSession();
  console.log(`Session: ${session.sessionId}\n`);

  // Use session API client directly for custom requests
  console.log('Making direct API calls...');

  // Add taco using low-level API client
  await sessionApiClient.postForm(session.sessionId, '/ajax/owt.php', {
    selectProduct: 'tacos_XL',
    'viande[]': 'viande_hachee',
    'meat_quantity[viande_hachee]': '2',
    'sauce[]': 'harissa',
    'garniture[]': 'salade',
  });
  console.log('✓ Taco added via direct API call\n');

  // Get cart summary
  const summary = await sessionApiClient.post(
    session.sessionId,
    '/ajax/sd.php'
  );
  console.log('Cart summary:', summary);
  console.log();

  // Clean up
  await sessionService.deleteSession(session.sessionId);
  console.log('✅ Direct API usage example completed!\n');
}

/**
 * Run all examples
 */
async function runAllExamples(): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Session-Based API Examples');
    console.log('═══════════════════════════════════════════════════════════\n');

    await basicSessionWorkflow();
    await multipleConcurrentSessions();
    await editAndRemoveTacos();
    await sessionManagement();
    await directApiClientUsage();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ All examples completed successfully!');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  } finally {
    // Cleanup
    apiClient.destroy();
    process.exit(0);
  }
}

// Run examples
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  basicSessionWorkflow,
  multipleConcurrentSessions,
  editAndRemoveTacos,
  sessionManagement,
  directApiClientUsage,
};
