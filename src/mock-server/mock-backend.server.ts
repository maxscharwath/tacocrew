/**
 * Mock backend server for testing
 * Simulates the real backend API endpoints
 * @module mock-server
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Mock backend server
 * Provides mock responses for backend API endpoints
 */
export class MockBackendServer {
  private app: Hono;
  private server: ReturnType<typeof serve> | null = null;
  private port: number;

  constructor(port = 3001) {
    this.port = port;
    this.app = new Hono();

    this.setupRoutes();
  }

  /**
   * Setup mock routes
   */
  private setupRoutes(): void {
    // Homepage (for session initialization)
    this.app.get('/', (c) => {
      return c.html('<html><body>Mock Backend Homepage</body></html>');
    });

    // CSRF token endpoint (from HTML page) - used by our client
    this.app.get('/index.php', (c) => {
      const content = c.req.query('content');
      if (content === 'livraison') {
        // Return HTML with CSRF token
        const csrfToken = 'mock-csrf-token-' + Date.now();
        return c.html(`
          <html>
            <head><title>Mock Backend</title></head>
            <body>
              <input type="hidden" name="csrf_token" value="${csrfToken}" />
            </body>
          </html>
        `);
      }
      return c.html('<html><body>Mock Backend</body></html>');
    });

    // CSRF token refresh endpoint (used by bundle.js)
    this.app.get('/ajax/refresh_token.php', (c) => {
      const csrfToken = 'mock-csrf-token-' + Date.now();
      return c.json({ csrf_token: csrfToken });
    });

    // Stock management endpoint
    this.app.get('/office/stock_management.php', (c) => {
      const type = c.req.query('type');
      if (type === 'all') {
        return c.json({
          viandes: {
            viande_hachee: { name: 'Viande Hachée', price: 5.0, in_stock: true },
            escalope_de_poulet: { name: 'Escalope de Poulet', price: 6.0, in_stock: true },
          },
          sauces: {
            harissa: { name: 'Harissa', price: 0, in_stock: true },
            algérienne: { name: 'Algérienne', price: 0, in_stock: true },
          },
          garnitures: {
            salade: { name: 'Salade', price: 0, in_stock: true },
            tomates: { name: 'Tomates', price: 0, in_stock: true },
          },
          extras: {
            extra_frites: { name: 'Frites', price: 3.5, in_stock: true },
          },
          boissons: {
            boisson_coca: { name: 'Coca Cola', price: 2.5, in_stock: true },
          },
          desserts: {
            dessert_brownie: { name: 'Brownie', price: 4.0, in_stock: true },
          },
        });
      }
      return c.json({});
    });

    // Add taco to cart - expects URL-encoded form data
    this.app.post('/ajax/owt.php', async (c) => {
      await c.req.parseBody(); // Parse to verify format (URL-encoded)
      // Expected: selectProduct, viande[], sauce[], garniture[], tacosNote, meat_quantity[{slug}]
      // Response: HTML string (taco card) or JSON for quantity updates
      // For mock, return simple HTML indicating success
      return c.html('<div class="taco-card">Taco added successfully</div>');
    });

    // Add extra to cart - expects JSON body
    this.app.post('/ajax/ues.php', async (c) => {
      await c.req.json().catch(() => ({})); // Parse to verify format (JSON)
      // Expected: {id, name, price, quantity, free_sauce?, free_sauces?}
      // Response: JSON
      return c.json({ status: 'success' });
    });

    // Add drink to cart - expects JSON body
    this.app.post('/ajax/ubs.php', async (c) => {
      await c.req.json().catch(() => ({})); // Parse to verify format (JSON)
      // Expected: {id, name, price, quantity}
      // Response: JSON
      return c.json({ status: 'success' });
    });

    // Add dessert to cart - expects JSON body
    this.app.post('/ajax/uds.php', async (c) => {
      await c.req.json().catch(() => ({})); // Parse to verify format (JSON)
      // Expected: {id, name, price, quantity}
      // Response: JSON
      return c.json({ status: 'success' });
    });

    // Submit order
    this.app.post('/ajax/RocknRoll.php', async (c) => {
      const formData = await c.req.parseBody();
      const transactionId = (formData['transaction_id'] as string) || `order_${Date.now()}`;
      const type = (formData['type'] as string) || 'livraison';
      const requestedFor = (formData['requestedFor'] as string) || '15:00';

      return c.json({
        orderId: transactionId,
        OrderData: {
          status: 'pending',
          type,
          date: new Date().toISOString(),
          price: 40.5,
          requestedFor,
        },
      });
    });

    // Default route
    this.app.all('*', (c) => {
      logger.warn('Mock backend: Unhandled route', { path: c.req.path });
      return c.json({ error: 'Not found' }, 404);
    });
  }

  /**
   * Start the mock server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = serve(
        {
          fetch: this.app.fetch,
          port: this.port,
        },
        (info) => {
          logger.info(`Mock backend server started on port ${info.port}`);
          resolve();
        }
      );
    });
  }

  /**
   * Stop the mock server
   */
  stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server?.close(() => {
          logger.info('Mock backend server stopped');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }

  /**
   * Get the server URL
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}
