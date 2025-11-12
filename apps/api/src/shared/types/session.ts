/**
 * Session management types
 * @module types/session
 */

import type { SessionId } from '../../schemas/session.schema';

/**
 * Session data containing authentication and state
 */
export interface SessionData {
  /** Unique session identifier */
  sessionId: SessionId;

  /** CSRF token for this session */
  csrfToken: string;

  /** HTTP cookies for this session */
  cookies: Record<string, string>;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  lastActivityAt: Date;
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  /** Optional custom session ID */
  sessionId?: SessionId;
}

/**
 * Session statistics
 */
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  oldestSession: Date | null;
  newestSession: Date | null;
}
