/**
 * User order mapper
 * @module api/mappers/user-order
 */

import type { UserOrderResponseDto } from '@/api/dto/user-order.dto';
import type { UserOrder } from '@/schemas/user-order.schema';

/**
 * User order mapper
 */
export class UserOrderMapper {
  /**
   * Map domain entity to response DTO
   */
  static toResponseDto(userOrder: UserOrder): UserOrderResponseDto {
    return {
      id: userOrder.id,
      userId: userOrder.userId,
      username: userOrder.username,
      status: userOrder.status,
      items: userOrder.items,
      createdAt: userOrder.createdAt,
      updatedAt: userOrder.updatedAt,
    };
  }
}
