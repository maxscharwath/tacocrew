/**
 * In-memory session store implementation
 * @module utils/session-store
 */

import { SessionData, SessionStore } from '../types/session';
import { logger } from './logger';

/**
 * In-memory session store
 * For production, replace with Redis or database
 */
export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, SessionData> = new Map();

  /**
   * Get session by ID
   */
  get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);

    if (session) {
      // Update last activity
      session.lastActivityAt = new Date();
      this.sessions.set(sessionId, session);
    }

    return Promise.resolve(session || null);
  }

  /**
   * Store/update session
   */
  set(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, {
      ...data,
      lastActivityAt: new Date(),
    });

    logger.debug('Session stored', { sessionId, hasToken: !!data.csrfToken });
    return Promise.resolve();
  }

  /**
   * Delete session
   */
  delete(sessionId: string): Promise<void> {
    const deleted = this.sessions.delete(sessionId);

    if (deleted) {
      logger.info('Session deleted', { sessionId });
    }
    return Promise.resolve();
  }

  /**
   * Check if session exists
   */
  has(sessionId: string): Promise<boolean> {
    return Promise.resolve(this.sessions.has(sessionId));
  }

  /**
   * Get all active sessions
   */
  getAll(): Promise<SessionData[]> {
    return Promise.resolve(Array.from(this.sessions.values()));
  }

  /**
   * Clean up expired sessions
   */
  cleanup(maxAgeMs: number): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivityAt.getTime();

      if (age > maxAgeMs) {
        this.sessions.delete(sessionId);
        cleaned++;
        logger.info('Session expired and removed', { sessionId, ageMs: age });
      }
    }

    if (cleaned > 0) {
      logger.info('Session cleanup completed', { cleaned, remaining: this.sessions.size });
    }

    return Promise.resolve(cleaned);
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  } {
    const sessions = Array.from(this.sessions.values());

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        oldestSession: null,
        newestSession: null,
      };
    }

    const sorted = sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      totalSessions: sessions.length,
      oldestSession: sorted[0]?.createdAt || null,
      newestSession: sorted[sorted.length - 1]?.createdAt || null,
    };
  }

  /**
   * Clear all sessions (for testing)
   */
  clear(): void {
    this.sessions.clear();
    logger.warn('All sessions cleared');
  }
}

// Export singleton instance
export const sessionStore = new InMemorySessionStore();
export default sessionStore;
