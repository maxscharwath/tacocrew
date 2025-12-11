/**
 * Session domain schema (Zod)
 * @module schemas/session
 *
 * Note: In this system, a SessionId is the same as a CartId.
 * Each cart has a unique ID that serves as its session identifier.
 */

import { CartId } from '@/schemas/cart.schema';
/**
 * Session ID type - an alias for CartId since sessions are carts
 * @see CartId
 */
export type SessionId = CartId;

/**
 * Parse a string to SessionId (which is the same as CartId)
 */
export const SessionId = CartId;
