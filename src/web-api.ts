/**
 * Web API Server - Session-aware
 * @module web-api
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { logger } from './utils/logger';
import { apiClient } from './api/client';
import { resourceService } from './services';
import { apiController } from './controllers/api.controller';
import { errorHandler } from './middleware/error-handler';
import { validate, schemas } from './middleware/validation';

/**
 * Create Express application
 */
function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.webApi.corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.webApi.rateLimit.windowMs,
    max: config.webApi.rateLimit.max,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Request logging
  app.use((req, _res, next) => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
    next();
  });

  // Health check
  app.get('/health', apiController.healthCheck.bind(apiController));

  // API routes
  const router = express.Router();

  // Session management routes
  router.post('/sessions', apiController.createSession.bind(apiController));
  router.get('/sessions', apiController.listSessions.bind(apiController));
  router.get('/sessions/stats', apiController.getSessionStats.bind(apiController));
  router.get('/sessions/:sessionId', apiController.getSession.bind(apiController));
  router.delete('/sessions/:sessionId', apiController.deleteSession.bind(apiController));

  // Session-specific cart routes
  router.get('/sessions/:sessionId/cart', apiController.getCart.bind(apiController));
  router.post(
    '/sessions/:sessionId/cart/tacos',
    validate(schemas.addTaco),
    apiController.addTaco.bind(apiController)
  );
  router.get('/sessions/:sessionId/cart/tacos/:id', apiController.getTaco.bind(apiController));
  router.put(
    '/sessions/:sessionId/cart/tacos/:id',
    validate(schemas.addTaco),
    apiController.updateTaco.bind(apiController)
  );
  router.patch(
    '/sessions/:sessionId/cart/tacos/:id/quantity',
    validate(schemas.updateTacoQuantity),
    apiController.updateTacoQuantity.bind(apiController)
  );
  router.delete('/sessions/:sessionId/cart/tacos/:id', apiController.deleteTaco.bind(apiController));
  router.post(
    '/sessions/:sessionId/cart/extras',
    validate(schemas.addExtra),
    apiController.addExtra.bind(apiController)
  );
  router.post(
    '/sessions/:sessionId/cart/drinks',
    validate(schemas.addDrink),
    apiController.addDrink.bind(apiController)
  );
  router.post(
    '/sessions/:sessionId/cart/desserts',
    validate(schemas.addDessert),
    apiController.addDessert.bind(apiController)
  );

  // Session-specific order routes
  router.post(
    '/sessions/:sessionId/orders',
    validate(schemas.createOrder),
    apiController.createOrder.bind(apiController)
  );

  // Global resource routes (not session-specific)
  router.get('/resources/stock', apiController.getStock.bind(apiController));

  app.use('/api/v1', router);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the web API server
 */
async function startWebApi(): Promise<void> {
  if (!config.webApi.enabled) {
    logger.warn('Web API is disabled in configuration');
    return;
  }

  logger.info('Initializing Web API');

  // Initialize API client (for global operations like stock)
  await apiClient.initialize();
  
  // Initialize resource service
  await resourceService.initialize();

  // Create and start Express app
  const app = createApp();

  app.listen(config.webApi.port, () => {
    logger.info('🚀 Web API server is running!', {
      port: config.webApi.port,
      env: config.env,
    });
    logger.info('📝 Session-based architecture enabled');
    logger.info(`   Create session: POST /api/v1/sessions`);
    logger.info(`   Use session: /api/v1/sessions/{sessionId}/cart`);
  });
}

// Start the server
if (require.main === module) {
  startWebApi().catch((error: Error) => {
    logger.error('Failed to start Web API', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

export { createApp, startWebApi };
export default startWebApi;
