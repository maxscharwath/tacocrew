/**
 * Group order DTOs (Data Transfer Objects)
 * @module api/dto/group-order
 */

/**
 * Create group order request DTO
 */
export interface CreateGroupOrderRequestDto {
  name?: string;
  startDate: Date;
  endDate: Date;
}
