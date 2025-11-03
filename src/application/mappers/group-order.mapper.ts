/**
 * Group order mapper
 * @module application/mappers/group-order
 */

import {
  GroupOrderResponseDto,
  GroupOrderWithUserOrdersDto,
} from '@/application/dtos/group-order.dto';
import { UserOrderMapper } from '@/application/mappers/user-order.mapper';
import type { GroupOrder } from '@/domain/schemas/group-order.schema';
import type { UserOrder } from '@/domain/schemas/user-order.schema';

/**
 * Group order mapper
 */
export class GroupOrderMapper {
  /**
   * Map domain entity to response DTO
   */
  static toResponseDto(groupOrder: GroupOrder): GroupOrderResponseDto {
    return {
      id: groupOrder.id,
      name: groupOrder.name,
      leaderId: groupOrder.leaderId,
      startDate: groupOrder.startDate,
      endDate: groupOrder.endDate,
      status: groupOrder.status,
      createdAt: groupOrder.createdAt,
      updatedAt: groupOrder.updatedAt,
    };
  }

  /**
   * Map domain entity with user orders to response DTO
   */
  static toResponseDtoWithUserOrders(
    groupOrder: GroupOrder,
    userOrders: UserOrder[]
  ): GroupOrderWithUserOrdersDto {
    return {
      ...this.toResponseDto(groupOrder),
      userOrders: userOrders.map((uo) => UserOrderMapper.toResponseDto(uo)),
    };
  }
}
