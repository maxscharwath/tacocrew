/**
 * Authentication routes for Hono
 * Simplified for future Slack integration
 * @module hono/routes/auth
 */

import 'reflect-metadata';
import { Hono } from 'hono';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service';
import { inject } from '../../utils/inject';
import { zodValidator } from '../middleware/zod-validator';

// Helper type for validated request body from Zod schema
type RequestFor<T extends z.ZodTypeAny> = z.infer<T>;

const app = new Hono();

// Validation schemas
const authSchemas = {
  createUser: z.object({
    username: z.string().min(2).max(50),
  }),
};

/**
 * Create or get user by username (temporary until Slack OAuth is implemented)
 * This endpoint will be replaced with Slack OAuth callback later
 */
app.post('/create-user', zodValidator(authSchemas.createUser), async (c) => {
  const body: RequestFor<typeof authSchemas.createUser> = c.get('validatedBody');
  const authService = inject(AuthService);

  const result = await authService.createOrGetUser(body.username);

  return c.json(result, 201);
});

export const authRoutes = app;
