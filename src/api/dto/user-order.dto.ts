/**
 * User order DTOs (Data Transfer Objects)
 * @module api/dto/user-order
 */

import type { z } from 'zod';
import type { UserOrderItemsRequestSchema } from '@/api/schemas/user-order.schemas';
import type { UserOrderItems, UserOrderStatus } from '@/shared/types/types';

/**
 * User order response DTO
 */
export interface UserOrderResponseDto {
  id: string;
  userId: string;
  username?: string;
  status: UserOrderStatus;
  items: UserOrderItems;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create user order request DTO (only IDs)
 */
export type CreateUserOrderRequestDto = {
  items: z.infer<typeof UserOrderItemsRequestSchema>;
};
