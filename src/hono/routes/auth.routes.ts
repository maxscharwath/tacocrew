/**
 * Authentication routes for Hono
 * Uses clean architecture with use cases
 * @module hono/routes/auth
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { UserMapper } from '@/application/mappers/user.mapper';
import { CreateUserUseCase } from '@/application/use-cases/auth/create-user';
import { jsonContent, UserSchemas } from '@/hono/routes/user.schemas';
import { inject } from '@/utils/inject';

const app = new OpenAPIHono();

const createUserRoute = createRoute({
  method: 'post',
  path: '/create-user',
  tags: ['Auth'],
  security: [],
  request: {
    body: {
      content: jsonContent(UserSchemas.CreateUserRequestSchema),
      required: true,
    },
  },
  responses: {
    201: {
      description: 'User created or retrieved',
      content: jsonContent(UserSchemas.CreateUserResponseSchema),
    },
    400: {
      description: 'Invalid request',
      content: jsonContent(UserSchemas.ErrorResponseSchema),
    },
  },
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid('json');
  const createUserUseCase = inject(CreateUserUseCase);

  const result = await createUserUseCase.execute(body.username);

  return c.json(
    {
      user: UserMapper.toResponseDto(result.user),
      token: result.token,
    },
    201
  );
});

export const authRoutes = app;
