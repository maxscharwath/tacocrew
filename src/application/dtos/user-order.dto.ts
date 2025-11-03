/**
 * User order DTOs
 * @module application/dtos/user-order
 */

import { UserOrderItems, UserOrderStatus } from '@/types';

/**
 * Create/update user order request DTO
 */
export interface CreateUserOrderRequestDto {
  items: UserOrderItems;
}

/**
 * User order response DTO
 */
export interface UserOrderResponseDto {
  id: string;
  userId: string;
  username?: string;
  status: UserOrderStatus;
  items: UserOrderItems;
  createdAt?: Date;
  updatedAt?: Date;
}
