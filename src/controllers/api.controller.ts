/**
 * REST API controllers - Session-aware
 * @module controllers/api
 */

import { Request, Response, NextFunction } from 'express';
import { cartService, orderService, resourceService, sessionService } from '../services';
import { logger } from '../utils/logger';
import { AddTacoRequest, UpdateTacoRequest, Extra, Drink, Dessert, CreateOrderRequest } from '../types';

/**
 * API Controller - Session-aware
 */
export class ApiController {
  /**
   * POST /api/v1/sessions - Create new session
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { metadata } = req.body as { metadata?: Record<string, unknown> };
      const session = await sessionService.createSession({ metadata });
      
      res.status(201).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          metadata: session.metadata,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions/:sessionId - Get session info
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await sessionService.getSession(sessionId || '');
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt,
          metadata: session.metadata,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/sessions/:sessionId - Delete session
   */
  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      await sessionService.deleteSession(sessionId || '');
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions - List all sessions
   */
  async listSessions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionService.getAllSessions();
      res.json({
        success: true,
        data: sessions.map((s) => ({
          sessionId: s.sessionId,
          createdAt: s.createdAt,
          lastActivityAt: s.lastActivityAt,
          metadata: s.metadata,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions/stats - Get session statistics
   */
  async getSessionStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await sessionService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions/:sessionId/cart - Get cart contents
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const cart = await cartService.getCart(sessionId || '');
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/cart/tacos - Add taco to cart
   */
  async addTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const request = req.body as AddTacoRequest;
      const taco = await cartService.addTaco(sessionId || '', request);
      res.status(201).json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions/:sessionId/cart/tacos/:id - Get taco details
   */
  async getTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, id } = req.params;
      const tacoId = parseInt(id || '0', 10);
      const taco = await cartService.getTacoDetails(sessionId || '', tacoId);
      res.json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/sessions/:sessionId/cart/tacos/:id - Update taco
   */
  async updateTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, id } = req.params;
      const tacoId = parseInt(id || '0', 10);
      const request = { ...req.body, id: tacoId } as UpdateTacoRequest;
      const taco = await cartService.updateTaco(sessionId || '', request);
      res.json({ success: true, data: taco });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/sessions/:sessionId/cart/tacos/:id/quantity - Update taco quantity
   */
  async updateTacoQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, id } = req.params;
      const tacoId = parseInt(id || '0', 10);
      const { action } = req.body as { action: 'increase' | 'decrease' };
      const result = await cartService.updateTacoQuantity(sessionId || '', tacoId, action);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/sessions/:sessionId/cart/tacos/:id - Delete taco from cart
   */
  async deleteTaco(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, id } = req.params;
      const tacoId = parseInt(id || '0', 10);
      await cartService.deleteTaco(sessionId || '', tacoId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/cart/extras - Add extra to cart
   */
  async addExtra(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const extra = req.body as Extra;
      const result = await cartService.addExtra(sessionId || '', extra);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/cart/drinks - Add drink to cart
   */
  async addDrink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const drink = req.body as Drink;
      const result = await cartService.addDrink(sessionId || '', drink);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/cart/desserts - Add dessert to cart
   */
  async addDessert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const dessert = req.body as Dessert;
      const result = await cartService.addDessert(sessionId || '', dessert);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/orders - Create order
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const request = req.body as CreateOrderRequest;
      const order = await orderService.createOrder(sessionId || '', request);
      res.status(201).json({ success: true, data: order });
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
   * GET /api/v1/health - Health check
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    const stats = await sessionService.getStats();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        sessions: stats,
      },
    });
  }
}

export const apiController = new ApiController();
export default apiController;
