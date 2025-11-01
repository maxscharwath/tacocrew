/**
 * Example: Using the session-based API
 *
 * Demonstrates how to use sessions for managing multiple concurrent orders
 */

import { apiClient } from '../src/api/client';
import { sessionApiClient } from '../src/api/session-client';
import { cartService, orderService, sessionService } from '../src/services';
import { OrderType, TacoSize } from '../src/types';

/**
 * Example 1: Basic session workflow
 */
async function basicSessionWorkflow(): Promise<void> {
  // Initialize the global API client (for stock, etc.)
  await apiClient.initialize();
  const session = await sessionService.createSession({
    metadata: {
      customerName: 'John Doe',
      orderType: 'delivery',
    },
  });

  await cartService.addTaco(session.sessionId, {
    size: TacoSize.XL,
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
    note: 'Extra sauce please',
  });

  await cartService.addExtra(session.sessionId, {
    id: 'extra_frites',
    name: 'Frites',
    price: 3.5,
    quantity: 1,
    free_sauces: [],
  });

  await cartService.addDrink(session.sessionId, {
    id: 'boisson_coca',
    name: 'Coca Cola',
    price: 2.5,
    quantity: 1,
  });
  const _cart = await cartService.getCart(session.sessionId);
  const _order = await orderService.createOrder(session.sessionId, {
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
  await sessionService.deleteSession(session.sessionId);
}

/**
 * Example 2: Multiple concurrent sessions
 */
async function multipleConcurrentSessions(): Promise<void> {
  await apiClient.initialize();

  const session1 = await sessionService.createSession({
    metadata: { customerName: 'Alice', orderType: 'delivery' },
  });

  const session2 = await sessionService.createSession({
    metadata: { customerName: 'Bob', orderType: 'takeaway' },
  });
  await cartService.addTaco(session1.sessionId, {
    size: TacoSize.XXL,
    meats: [
      { id: 'viande_hachee', quantity: 2 },
      { id: 'escalope_de_poulet', quantity: 2 },
    ],
    sauces: ['harissa', 'algérienne', 'blanche'],
    garnitures: ['salade', 'tomates', 'oignons'],
  });
  await cartService.addTaco(session2.sessionId, {
    size: TacoSize.L,
    meats: [{ id: 'viande_hachee', quantity: 1 }],
    sauces: ['harissa'],
    garnitures: ['salade'],
  });
  const _cart1 = await cartService.getCart(session1.sessionId);
  const _cart2 = await cartService.getCart(session2.sessionId);

  // Clean up
  await sessionService.deleteSession(session1.sessionId);
  await sessionService.deleteSession(session2.sessionId);
}

/**
 * Example 3: Edit and remove tacos
 */
async function editAndRemoveTacos(): Promise<void> {
  await apiClient.initialize();

  const session = await sessionService.createSession();
  for (let i = 0; i < 3; i++) {
    await cartService.addTaco(session.sessionId, {
      size: TacoSize.L,
      meats: [{ id: 'viande_hachee', quantity: 1 }],
      sauces: ['harissa'],
      garnitures: ['salade'],
    });
  }
  await cartService.updateTaco(session.sessionId, {
    id: 0,
    size: TacoSize.XL,
    meats: [{ id: 'viande_hachee', quantity: 2 }],
    sauces: ['harissa', 'algérienne'],
    garnitures: ['salade', 'tomates'],
  });
  await cartService.updateTacoQuantity(session.sessionId, 1, 'increase');
  await cartService.deleteTaco(session.sessionId, 2);

  // View final cart
  const _cart = await cartService.getCart(session.sessionId);

  // Clean up
  await sessionService.deleteSession(session.sessionId);
}

/**
 * Example 4: Session management
 */
async function sessionManagement(): Promise<void> {
  await apiClient.initialize();
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const session = await sessionService.createSession({
      metadata: { userIndex: i },
    });
    sessions.push(session);
  }
  const allSessions = await sessionService.getAllSessions();
  allSessions.forEach((s) => {});
  const _stats = await sessionService.getStats();
  await sessionService.updateSessionMetadata(sessions[0]!.sessionId, {
    customerName: 'Updated User',
    orderCompleted: true,
  });

  // Get specific session
  const _updatedSession = await sessionService.getSession(sessions[0]!.sessionId);
  for (const session of sessions) {
    await sessionService.deleteSession(session.sessionId);
  }
}

/**
 * Example 5: Using sessionApiClient directly
 */
async function directApiClientUsage(): Promise<void> {
  await apiClient.initialize();

  // Create session
  const session = await sessionService.createSession();

  // Add taco using low-level API client
  await sessionApiClient.postForm(session.sessionId, '/ajax/owt.php', {
    selectProduct: 'tacos_XL',
    'viande[]': 'viande_hachee',
    'meat_quantity[viande_hachee]': '2',
    'sauce[]': 'harissa',
    'garniture[]': 'salade',
  });

  // Get cart summary
  const _summary = await sessionApiClient.post(session.sessionId, '/ajax/sd.php');

  // Clean up
  await sessionService.deleteSession(session.sessionId);
}

/**
 * Run all examples
 */
async function runAllExamples(): Promise<void> {
  try {
    await basicSessionWorkflow();
    await multipleConcurrentSessions();
    await editAndRemoveTacos();
    await sessionManagement();
    await directApiClientUsage();
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
