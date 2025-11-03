/**
 * Group order DTOs
 * @module application/dtos/group-order
 */

import { UserOrderResponseDto } from '@/application/dtos/user-order.dto';
import { GroupOrderStatus } from '@/types';

/**
 * Create group order request DTO
 */
export interface CreateGroupOrderRequestDto {
  name?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Group order response DTO
 */
export interface GroupOrderResponseDto {
  id: string;
  name?: string;
  leaderId: string;
  startDate: Date;
  endDate: Date;
  status: GroupOrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Group order with user orders DTO
 */
export interface GroupOrderWithUserOrdersDto extends GroupOrderResponseDto {
  userOrders: UserOrderResponseDto[];
}
