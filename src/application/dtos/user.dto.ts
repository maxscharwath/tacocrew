/**
 * User DTOs (Data Transfer Objects)
 * @module application/dtos/user
 */

/**
 * User response DTO
 */
export interface UserResponseDto {
  id: string;
  username: string;
  slackId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create user request DTO
 */
export interface CreateUserRequestDto {
  username: string;
}

/**
 * Create user response DTO
 */
export interface CreateUserResponseDto {
  user: UserResponseDto;
  token: string;
}
