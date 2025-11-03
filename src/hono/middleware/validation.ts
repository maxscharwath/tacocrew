/**
 * Validation schemas for Hono routes
 * @module hono/middleware/validation
 */

import { z } from '@hono/zod-openapi';
import { OrderType, TacoSize } from '@/types';

/**
 * Free sauce schema (reusable)
 */
const freeSauceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
});

/**
 * Validation schemas
 */
export const schemas = {
  addTaco: z.object({
    size: z.enum(TacoSize),
    meats: z
      .array(
        z.object({
          id: z.string(),
          quantity: z.number().int().min(1),
        })
      )
      .min(1),
    sauces: z.array(z.string()).max(3),
    garnitures: z.array(z.string()),
    note: z.string().optional(),
  }),

  updateTacoQuantity: z.object({
    action: z.enum(['increase', 'decrease']),
  }),

  addExtra: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    free_sauce: freeSauceSchema.optional(),
    free_sauces: z.array(freeSauceSchema).optional(),
  }),

  addDrink: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
  }),

  addDessert: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
  }),

  createOrder: z.object({
    customer: z.object({
      name: z.string().min(2),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    }),
    delivery: z
      .object({
        type: z.enum([OrderType.DELIVERY, OrderType.TAKEAWAY]),
        address: z.string().optional(),
        requestedFor: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .refine(
        (data) => {
          if (data.type === OrderType.DELIVERY) {
            return data.address !== undefined && data.address !== '';
          }
          return true;
        },
        {
          message: 'Address is required for delivery orders',
          path: ['address'],
        }
      ),
  }),
};
