/**
 * Authentication routes
 * @module api/routes/auth
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent } from '@/api/schemas/shared.schemas';
import { createRouteApp } from '@/api/utils/route.utils';
import { CreateUserUseCase } from '@/services/auth/create-user.service';
import { inject } from '@/shared/utils/inject.utils';

const app = createRouteApp();

const CreateUserRequestSchema = z.object({
  username: z.string().min(2).max(50),
});

const CreateUserResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    slackId: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  token: z.string(),
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/auth',
    tags: ['Auth'],
    request: {
      body: {
        content: jsonContent(CreateUserRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'User created or retrieved',
        content: jsonContent(CreateUserResponseSchema),
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');
    const createUserUseCase = inject(CreateUserUseCase);
    const result = await createUserUseCase.execute(body.username);

    return c.json(
      {
        user: {
          id: result.user.id,
          username: result.user.username,
          slackId: result.user.slackId ?? undefined,
          createdAt: result.user.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: result.user.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
        token: result.token,
      },
      201
    );
  }
);

export const authRoutes = app;
