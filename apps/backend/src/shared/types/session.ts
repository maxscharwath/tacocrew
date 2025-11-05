/**
 * Session management types
 * @module types/session
 */

import type { SessionId } from '@/schemas/session.schema';
import type { OrderType } from '@/shared/types/types';

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

  /** Session metadata */
  metadata?: {
    customerName?: string;
    orderType?: OrderType;
    [key: string]: unknown;
  };
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  /** Optional custom session ID */
  sessionId?: SessionId;

  /** Optional metadata */
  metadata?: SessionData['metadata'];
}

/**
 * Session storage interface
 */
export interface SessionStore {
  /** Get session by ID */
  get(sessionId: SessionId): Promise<SessionData | null>;

  /** Store/update session */
  set(sessionId: SessionId, data: SessionData): Promise<void>;

  /** Delete session */
  delete(sessionId: SessionId): Promise<void>;

  /** Check if session exists */
  has(sessionId: SessionId): Promise<boolean>;

  /** Get all active sessions */
  getAll(): Promise<SessionData[]>;

  /** Clean up expired sessions */
  cleanup(maxAgeMs: number): Promise<number>;
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
