/**
 * Session management service
 * @module services/session
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { sessionStore } from '../utils/session-store';
import { SessionData, CreateSessionOptions, SessionStats } from '../types/session';
import { apiClient } from '../api/client';

/**
 * Session Service
 * Manages multiple independent order sessions
 */
export class SessionService {
  private readonly SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions = {}): Promise<SessionData> {
    const sessionId = options.sessionId || uuidv4();
    
    logger.info('Creating new session', { sessionId });

    // Get CSRF token for this session
    const csrfToken = await apiClient.refreshCsrfToken();

    const session: SessionData = {
      sessionId,
      csrfToken,
      cookies: {},
      createdAt: new Date(),
      lastActivityAt: new Date(),
      metadata: options.metadata,
    };

    await sessionStore.set(sessionId, session);

    logger.info('Session created', { sessionId });
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    logger.debug('Getting session', { sessionId });
    return await sessionStore.get(sessionId);
  }

  /**
   * Get session or throw error
   */
  async getSessionOrThrow(sessionId: string): Promise<SessionData> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      logger.warn('Session not found', { sessionId });
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session;
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);
    
    const updatedSession: SessionData = {
      ...session,
      ...updates,
      sessionId: session.sessionId, // Prevent ID change
      createdAt: session.createdAt, // Prevent creation date change
      lastActivityAt: new Date(),
    };

    await sessionStore.set(sessionId, updatedSession);
    logger.debug('Session updated', { sessionId });
  }

  /**
   * Update session CSRF token
   */
  async refreshSessionToken(sessionId: string): Promise<string> {
    logger.debug('Refreshing session token', { sessionId });
    
    const newToken = await apiClient.refreshCsrfToken();
    await this.updateSession(sessionId, { csrfToken: newToken });
    
    logger.info('Session token refreshed', { sessionId });
    return newToken;
  }

  /**
   * Update session cookies
   */
  async updateSessionCookies(
    sessionId: string,
    cookies: Record<string, string>
  ): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);
    
    await this.updateSession(sessionId, {
      cookies: { ...session.cookies, ...cookies },
    });
    
    logger.debug('Session cookies updated', { sessionId });
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(
    sessionId: string,
    metadata: SessionData['metadata']
  ): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);
    
    await this.updateSession(sessionId, {
      metadata: { ...session.metadata, ...metadata },
    });
    
    logger.debug('Session metadata updated', { sessionId });
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    logger.info('Deleting session', { sessionId });
    await sessionStore.delete(sessionId);
  }

  /**
   * Check if session exists
   */
  async hasSession(sessionId: string): Promise<boolean> {
    return await sessionStore.has(sessionId);
  }

  /**
   * Get all active sessions
   */
  async getAllSessions(): Promise<SessionData[]> {
    return await sessionStore.getAll();
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    const sessions = await sessionStore.getAll();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        oldestSession: null,
        newestSession: null,
      };
    }

    const now = Date.now();
    const activeSessions = sessions.filter(
      (s) => now - s.lastActivityAt.getTime() < 60 * 60 * 1000 // Active in last hour
    );

    const sorted = sessions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      oldestSession: sorted[0]?.createdAt || null,
      newestSession: sorted[sorted.length - 1]?.createdAt || null,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    logger.debug('Running session cleanup');
    const cleaned = await sessionStore.cleanup(this.SESSION_MAX_AGE_MS);
    
    if (cleaned > 0) {
      logger.info('Cleaned up expired sessions', { count: cleaned });
    }
    
    return cleaned;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    logger.info('Session cleanup timer started (runs every hour)');
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Session cleanup timer stopped');
    }
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.stopCleanupTimer();
  }
}

export const sessionService = new SessionService();
export default sessionService;
