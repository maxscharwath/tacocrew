/**
 * Session management service
 * @module services/session
 */

import type { SessionContext } from '@tacobot/gigatacos-client';
import { injectable } from 'tsyringe';
import { BackendIntegrationClient } from '@/infrastructure/api/backend-integration.client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SessionId } from '@/schemas/session.schema';
import { CreateSessionOptions, SessionData, SessionStats } from '@/shared/types/session';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

/**
 * Session Service
 * Manages multiple independent order sessions
 */
@injectable()
export class SessionService {
  private readonly backendClient = inject(BackendIntegrationClient);
  private readonly prisma = inject(PrismaService);

  private readonly SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Start cleanup timer - this is initialization logic, not dependency injection
    this.startCleanupTimer();
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions = {}): Promise<SessionData> {
    const rawSessionId = options.sessionId || randomUUID();
    const sessionId = SessionId.parse(rawSessionId);

    logger.info('Creating new session', { sessionId });

    // Create new session context (new session with fresh cookies)
    const newSessionContext = await this.backendClient.createNewSession();
    const { csrfToken, cookies } = newSessionContext;

    // Store session in database
    await this.prisma.client.cart.create({
      data: {
        id: sessionId,
        csrfToken,
        cookies: JSON.stringify(cookies),
      },
    });

    const session: SessionData = {
      sessionId,
      csrfToken,
      cookies,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    logger.info('Session created', { sessionId });
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    logger.debug('Getting session', { sessionId });
    const parsedSessionId = SessionId.parse(sessionId);

    const cart = await this.prisma.client.cart.findUnique({
      where: { id: parsedSessionId },
    });

    if (!cart) {
      return null;
    }

    // Update last activity
    await this.prisma.client.cart.update({
      where: { id: parsedSessionId },
      data: { lastActivityAt: new Date() },
    });

    return {
      sessionId: SessionId.parse(cart.id),
      csrfToken: cart.csrfToken,
      cookies: JSON.parse(cart.cookies),
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
    };
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
    const parsedSessionId = SessionId.parse(sessionId);

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      sessionId: session.sessionId, // Prevent ID change
      createdAt: session.createdAt, // Prevent creation date change
      lastActivityAt: new Date(),
    };

    await this.prisma.client.cart.update({
      where: { id: parsedSessionId },
      data: {
        csrfToken: updatedSession.csrfToken,
        cookies: JSON.stringify(updatedSession.cookies),
        lastActivityAt: updatedSession.lastActivityAt,
      },
    });

    logger.debug('Session updated', { sessionId });
  }

  /**
   * Update session CSRF token
   */
  async refreshSessionToken(sessionId: string): Promise<string> {
    logger.debug('Refreshing session token', { sessionId });

    // Get current session to refresh its token
    const session = await this.getSessionOrThrow(sessionId);
    const sessionContext: SessionContext = {
      sessionId,
      csrfToken: session.csrfToken,
      cookies: session.cookies,
    };
    const refreshed = await this.backendClient.refreshCsrfToken(sessionContext);
    const newToken = refreshed.csrfToken;
    const newCookies = refreshed.cookies;
    await this.updateSession(sessionId, {
      csrfToken: newToken,
      cookies: newCookies,
    });

    logger.info('Session token refreshed', { sessionId });
    return newToken;
  }

  /**
   * Update session cookies
   */
  async updateSessionCookies(sessionId: string, cookies: Record<string, string>): Promise<void> {
    const session = await this.getSessionOrThrow(sessionId);

    await this.updateSession(sessionId, {
      cookies: { ...session.cookies, ...cookies },
    });

    logger.debug('Session cookies updated', { sessionId });
  }

  /**
   * Update session CSRF token
   */
  async updateSessionCsrfToken(sessionId: string, csrfToken: string): Promise<void> {
    await this.updateSession(sessionId, {
      csrfToken,
    });

    logger.debug('Session CSRF token updated', { sessionId });
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    logger.info('Deleting session', { sessionId });
    const parsedSessionId = SessionId.parse(sessionId);
    await this.prisma.client.cart.delete({
      where: { id: parsedSessionId },
    });
  }

  /**
   * Check if session exists
   */
  async hasSession(sessionId: string): Promise<boolean> {
    const parsedSessionId = SessionId.parse(sessionId);
    const cart = await this.prisma.client.cart.findUnique({
      where: { id: parsedSessionId },
      select: { id: true },
    });
    return cart !== null;
  }

  /**
   * Get all active sessions
   */
  async getAllSessions(): Promise<SessionData[]> {
    const carts = await this.prisma.client.cart.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return carts.map((cart) => ({
      sessionId: SessionId.parse(cart.id),
      csrfToken: cart.csrfToken,
      cookies: JSON.parse(cart.cookies),
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
    }));
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    const [total, activeCount, oldest, newest] = await Promise.all([
      this.prisma.client.cart.count(),
      this.prisma.client.cart.count({
        where: {
          lastActivityAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Active in last hour
          },
        },
      }),
      this.prisma.client.cart.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.client.cart.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalSessions: total,
      activeSessions: activeCount,
      oldestSession: oldest?.createdAt || null,
      newestSession: newest?.createdAt || null,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    logger.debug('Running session cleanup');
    const cutoffDate = new Date(Date.now() - this.SESSION_MAX_AGE_MS);

    const result = await this.prisma.client.cart.deleteMany({
      where: {
        lastActivityAt: {
          lt: cutoffDate,
        },
      },
    });

    const cleaned = result.count;

    if (cleaned > 0) {
      logger.info('Cleaned up expired sessions', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    logger.info('Session cleanup timer started (runs every hour)');
  }
}
