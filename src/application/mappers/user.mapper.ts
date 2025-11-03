/**
 * User mapper - maps between domain entities and DTOs
 * @module application/mappers/user
 */

import { UserResponseDto } from '@/application/dtos/user.dto';
import type { User } from '@/domain/schemas/user.schema';

/**
 * User mapper
 */
export class UserMapper {
  /**
   * Map domain entity to response DTO
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      slackId: user.slackId ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
