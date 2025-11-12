/**
 * Taco routes
 * @module api/routes/taco
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { GetTacoByTacoIDUseCase } from '../../services/taco/get-taco-by-taco-id.service';
import { inject } from '../../shared/utils/inject.utils';
import { jsonContent } from '../schemas/shared.schemas';
import { TacoSchema } from '../schemas/user-order.schemas';
import { createRouteApp } from '../utils/route.utils';

const app = createRouteApp();

app.openapi(
  createRoute({
    method: 'get',
    path: '/tacos/{tacoID}',
    tags: ['Tacos'],
    request: {
      params: z.object({
        tacoID: z.string().min(1),
      }),
    },
    responses: {
      200: {
        description: 'Taco found by tacoID (base58-encoded tacoId)',
        content: jsonContent(TacoSchema),
      },
      404: {
        description: 'Taco not found',
      },
    },
  }),
  async (c) => {
    const { tacoID } = c.req.valid('param');
    const getTacoByTacoIDUseCase = inject(GetTacoByTacoIDUseCase);
    const taco = await getTacoByTacoIDUseCase.execute(tacoID);

    return c.json(taco, 200);
  }
);

export const tacoRoutes = app;
