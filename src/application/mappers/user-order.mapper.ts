/**
 * User order mapper
 * @module application/mappers/user-order
 */

import { UserOrderResponseDto } from '@/application/dtos/user-order.dto';
import type { UserOrder } from '@/domain/schemas/user-order.schema';

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
      ...(userOrder.username && { username: userOrder.username }),
      status: userOrder.status,
      items: userOrder.items,
      createdAt: userOrder.createdAt,
      updatedAt: userOrder.updatedAt,
    };
  }
}
