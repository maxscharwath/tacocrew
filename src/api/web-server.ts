/**
 * Web API Server (Express)
 * RESTful API endpoints for tacos ordering system
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getTacosApiService } from '@/services/tacos-api.service';
import { logger } from '@/utils/logger';
import { getConfig } from '@/utils/config';
import {
  TacoConfig,
  Customer,
  DeliveryInfo,
  OrderStatusResponse,
  CreateGroupOrderRequest,
  AddItemToGroupOrderRequest,
  RemoveItemFromGroupOrderRequest,
  SubmitGroupOrderRequest,
} from '@/types';
import { ApiClientError } from '@/types/errors';
import { getGroupOrderService } from '@/services/group-order.service';

/**
 * Web API Server
 */
export class WebApiServer {
  private app: Express;
  private readonly config = getConfig();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const router = express.Router();
    const service = getTacosApiService();
    const groupOrderService = getGroupOrderService();

    /**
     * Health check
     */
    router.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    /**
     * GET /api/v1/resources/stock
     * Get stock availability
     */
    router.get('/resources/stock', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const stock = await service.getStockAvailability();
        res.json({ success: true, data: stock });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/cart
     * Get current cart
     */
    router.get('/cart', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const cart = await service.getCart();
        const summary = await service.getCartSummary();
        res.json({
          success: true,
          data: {
            ...cart,
            summary,
          },
        });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/cart/tacos
     * Add taco to cart
     */
    router.post('/cart/tacos', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tacoConfig = req.body as TacoConfig;
        const taco = await service.addTacoToCart(tacoConfig);
        res.status(201).json({ success: true, data: taco });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/cart/tacos/:id
     * Get taco details
     */
    router.get('/cart/tacos/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseInt(req.params.id, 10);
        const taco = await service.getTacoDetails(id);
        res.json({ success: true, data: taco });
      } catch (error) {
        next(error);
      }
    });

    /**
     * PUT /api/v1/cart/tacos/:id
     * Update taco
     */
    router.put('/cart/tacos/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseInt(req.params.id, 10);
        const tacoConfig = req.body as TacoConfig;
        const taco = await service.updateTaco(id, tacoConfig);
        res.json({ success: true, data: taco });
      } catch (error) {
        next(error);
      }
    });

    /**
     * PATCH /api/v1/cart/tacos/:id/quantity
     * Update taco quantity
     */
    router.patch(
      '/cart/tacos/:id/quantity',
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const id = parseInt(req.params.id, 10);
          const { action } = req.body;
          if (action !== 'increase' && action !== 'decrease') {
            return res.status(400).json({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Invalid action' },
            });
          }
          const quantity = await service.updateTacoQuantity(id, action);
          res.json({ success: true, data: { quantity } });
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * DELETE /api/v1/cart/tacos/:id
     * Delete taco from cart
     */
    router.delete('/cart/tacos/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseInt(req.params.id, 10);
        await service.deleteTaco(id);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/orders
     * Submit order
     */
    router.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { customer, delivery } = req.body as {
          customer: Customer;
          delivery: DeliveryInfo;
        };

        if (!customer || !delivery) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Missing customer or delivery info' },
          });
        }

        const order = await service.submitOrder(customer, delivery);
        res.status(201).json({ success: true, data: order });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/orders/:id/status
     * Get order status
     */
    router.get('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const statuses = await service.getOrderStatus([id]);
        if (statuses.length === 0) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Order not found' },
          });
        }
        res.json({ success: true, data: statuses[0] });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/orders/:id/restore
     * Restore order to cart
     */
    router.post('/orders/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { order } = req.body;
        if (!order || order.orderId !== id) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid order data' },
          });
        }
        const result = await service.restoreOrder(order);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/delivery/demand/:time
     * Check delivery demand
     */
    router.get('/delivery/demand/:time', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { time } = req.params;
        const demand = await service.checkDeliveryDemand(time);
        res.json({ success: true, data: demand });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/group-orders
     * Create a new group order
     */
    router.post('/group-orders', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const request = req.body as CreateGroupOrderRequest;
        if (!request.createdBy || !request.expiresInMinutes) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
          });
        }
        const order = groupOrderService.createGroupOrder(request);
        // Serialize dates for JSON response
        const serialized = this.serializeGroupOrder(order);
        res.status(201).json({ success: true, data: serialized });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/group-orders
     * Get all active group orders
     */
    router.get('/group-orders', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = groupOrderService.getAllActiveGroupOrders();
        const serialized = orders.map((order) => this.serializeGroupOrder(order));
        res.json({ success: true, data: serialized });
      } catch (error) {
        next(error);
      }
    });

    /**
     * GET /api/v1/group-orders/:id
     * Get a specific group order
     */
    router.get('/group-orders/:id', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const order = groupOrderService.getGroupOrder(id);
        const serialized = this.serializeGroupOrder(order);
        res.json({ success: true, data: serialized });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/group-orders/:id/items
     * Add an item to a group order
     */
    router.post('/group-orders/:id/items', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const request = req.body as Omit<AddItemToGroupOrderRequest, 'orderId'>;
        const item = groupOrderService.addItem({
          ...request,
          orderId: id,
        });
        res.status(201).json({ success: true, data: this.serializeGroupOrderItem(item) });
      } catch (error) {
        next(error);
      }
    });

    /**
     * DELETE /api/v1/group-orders/:id/items/:itemId
     * Remove an item from a group order
     */
    router.delete('/group-orders/:id/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, itemId } = req.params;
        const { userId } = req.body as { userId: string };
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
          });
        }
        groupOrderService.removeItem({
          orderId: id,
          itemId,
          userId,
        });
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/group-orders/:id/close
     * Close a group order (stop accepting new items)
     */
    router.post('/group-orders/:id/close', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { userId } = req.body as { userId: string };
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
          });
        }
        const order = groupOrderService.closeGroupOrder(id, userId);
        const serialized = this.serializeGroupOrder(order);
        res.json({ success: true, data: serialized });
      } catch (error) {
        next(error);
      }
    });

    /**
     * POST /api/v1/group-orders/:id/submit
     * Submit a group order
     */
    router.post('/group-orders/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { customer, delivery } = req.body as {
          customer: Customer;
          delivery: DeliveryInfo;
        };
        if (!customer || !delivery) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Missing customer or delivery info' },
          });
        }
        const order = await groupOrderService.submitGroupOrder({
          orderId: id,
          customer,
          delivery,
        });
        res.status(201).json({ success: true, data: order });
      } catch (error) {
        next(error);
      }
    });

    // Mount API routes
    this.app.use('/api/v1', router);
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
        },
      });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('API error', err);

      if (err instanceof ApiClientError) {
        return res.status(err.statusCode || 500).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
        },
      });
    });
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        logger.info(`?? Web API server running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Serialize group order for JSON response (convert Date objects to ISO strings)
   */
  private serializeGroupOrder(order: any): any {
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      items: order.items.map((item: any) => this.serializeGroupOrderItem(item)),
    };
  }

  /**
   * Serialize group order item for JSON response
   */
  private serializeGroupOrderItem(item: any): any {
    return {
      ...item,
      addedAt: item.addedAt.toISOString(),
    };
  }

  /**
   * Get Express app (for testing)
   */
  getApp(): Express {
    return this.app;
  }
}
