/**
 * Session management types
 * @module types/session
 */

/**
 * Session data containing authentication and state
 */
export interface SessionData {
  /** Unique session identifier */
  sessionId: string;
  
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
    orderType?: string;
    [key: string]: unknown;
  };
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  /** Optional custom session ID */
  sessionId?: string;
  
  /** Optional metadata */
  metadata?: SessionData['metadata'];
}

/**
 * Session storage interface
 */
export interface SessionStore {
  /** Get session by ID */
  get(sessionId: string): Promise<SessionData | null>;
  
  /** Store/update session */
  set(sessionId: string, data: SessionData): Promise<void>;
  
  /** Delete session */
  delete(sessionId: string): Promise<void>;
  
  /** Check if session exists */
  has(sessionId: string): Promise<boolean>;
  
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
