/**
 * REST API controllers
 * @module controllers/api
 */

import { Request, Response, NextFunction } from 'express';
import { cartService, orderService, resourceService } from '../services';
import { logger } from '../utils/logger';
import {
  AddTacoRequest,
  UpdateTacoRequest,
  Extra,
  Drink,
  Dessert,
  CreateOrderRequest,
} from '../types';

/**
 * API Controller
 */
export class ApiController {
  /**
   * GET /api/v1/cart - Get cart contents
   */
  async getCart(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart();
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/tacos - Add taco to cart
   */
  async addTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = req.body as AddTacoRequest;
      const taco = await cartService.addTaco(request);
      res.status(201).json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/cart/tacos/:id - Get taco details
   */
  async getTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0', 10);
      const taco = await cartService.getTacoDetails(id);
      res.json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/cart/tacos/:id - Update taco
   */
  async updateTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0', 10);
      const request = { ...req.body, id } as UpdateTacoRequest;
      const taco = await cartService.updateTaco(request);
      res.json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/cart/tacos/:id/quantity - Update taco quantity
   */
  async updateTacoQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0', 10);
      const { action } = req.body as { action: 'increase' | 'decrease' };
      const result = await cartService.updateTacoQuantity(id, action);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart/tacos/:id - Delete taco from cart
   */
  async deleteTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0', 10);
      await cartService.deleteTaco(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/extras - Add extra to cart
   */
  async addExtra(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const extra = req.body as Extra;
      const result = await cartService.addExtra(extra);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/drinks - Add drink to cart
   */
  async addDrink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drink = req.body as Drink;
      const result = await cartService.addDrink(drink);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/desserts - Add dessert to cart
   */
  async addDessert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dessert = req.body as Dessert;
      const result = await cartService.addDessert(dessert);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/resources/stock - Get stock availability
   */
  async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const stock = await resourceService.getStock(forceRefresh);
      res.json({ success: true, data: stock });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/orders - Create new order
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = req.body as CreateOrderRequest;
      const order = await orderService.createOrder(request);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/:id/status - Get order status
   */
  async getOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.id || '';
      const status = await orderService.getOrderStatus(orderId);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/delivery/time-slots - Get time slots
   */
  async getTimeSlots(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await orderService.getTimeSlots();
      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/delivery/demand/:time - Check delivery demand
   */
  async getDeliveryDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const time = req.params.time || '';
      const demand = await orderService.checkDeliveryDemand(time);
      res.json({ success: true, data: demand });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/health - Health check
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  }
}

export const apiController = new ApiController();
export default apiController;
