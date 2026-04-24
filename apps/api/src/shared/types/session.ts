/**
 * Session management types
 * @module types/session
 */

import type { SessionId } from '@/schemas/session.schema';

/**
 * Per-cart session metadata persisted alongside the draft order.
 *
 * The legacy PHP backend required a CSRF token and cookie jar per cart;
 * commande.app does not, so the session row now only carries identity and
 * timestamps.
 */
export interface SessionData {
  readonly sessionId: SessionId;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly metadata?: Record<string, unknown> | null;
}

export interface CreateSessionOptions {
  readonly sessionId?: SessionId;
  readonly metadata?: Record<string, unknown> | null;
}

export interface SessionStats {
  readonly totalSessions: number;
  readonly activeSessions: number;
  readonly oldestSession: Date | null;
  readonly newestSession: Date | null;
}
