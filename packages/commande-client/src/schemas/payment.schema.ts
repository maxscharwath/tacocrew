import { z } from 'zod';
import { paymentMethodSchema } from './order.schema';

export const paymentMethodsResponseSchema = z.object({
  methods: z.array(paymentMethodSchema),
});
