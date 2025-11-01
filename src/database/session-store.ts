/**
 * Database-backed session store implementation
 * @module database/session-store
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { SessionData, SessionStore } from '../types/session';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import { PrismaService } from './prisma.service';

/**
 * Database-backed session store using Prisma
 */
@injectable()
export class DatabaseSessionStore implements SessionStore {
  private readonly prisma = inject(PrismaService);

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const session = await this.prisma.client.session.findUnique({
        where: { sessionId },
      });

      if (!session) {
        return null;
      }

      // Update last activity
      await this.prisma.client.session.update({
        where: { sessionId },
        data: { lastActivityAt: new Date() },
      });

      return this.mapToSessionData(session);
    } catch (error) {
      logger.error('Failed to get session', { sessionId, error });
      return null;
    }
  }

  /**
   * Store/update session
   */
  async set(sessionId: string, data: SessionData): Promise<void> {
    try {
      await this.prisma.client.session.upsert({
        where: { sessionId },
        create: {
          sessionId: data.sessionId,
          csrfToken: data.csrfToken,
          cookies: JSON.stringify(data.cookies),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          createdAt: data.createdAt,
          lastActivityAt: data.lastActivityAt,
        },
        update: {
          csrfToken: data.csrfToken,
          cookies: JSON.stringify(data.cookies),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          lastActivityAt: new Date(),
        },
      });

      logger.debug('Session stored', { sessionId, hasToken: !!data.csrfToken });
    } catch (error) {
      logger.error('Failed to store session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    try {
      await this.prisma.client.session.delete({
        where: { sessionId },
      });
      logger.info('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', { sessionId, error });
      // Don't throw if session doesn't exist
    }
  }

  /**
   * Check if session exists
   */
  async has(sessionId: string): Promise<boolean> {
    try {
      const count = await this.prisma.client.session.count({
        where: { sessionId },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check session existence', { sessionId, error });
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  async getAll(): Promise<SessionData[]> {
    try {
      const sessions = await this.prisma.client.session.findMany({
        orderBy: { lastActivityAt: 'desc' },
      });

      return sessions.map(
        (s: {
          sessionId: string;
          csrfToken: string;
          cookies: string;
          metadata: string | null;
          createdAt: Date;
          lastActivityAt: Date;
        }) => this.mapToSessionData(s)
      );
    } catch (error) {
      logger.error('Failed to get all sessions', { error });
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanup(maxAgeMs: number): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - maxAgeMs);

      const result = await this.prisma.client.session.deleteMany({
        where: {
          lastActivityAt: {
            lt: cutoff,
          },
        },
      });

      if (result.count > 0) {
        logger.info('Session cleanup completed', {
          cleaned: result.count,
        });
      }

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup sessions', { error });
      return 0;
    }
  }

  /**
   * Map database model to SessionData
   */
  private mapToSessionData(session: {
    sessionId: string;
    csrfToken: string;
    cookies: string;
    metadata: string | null;
    createdAt: Date;
    lastActivityAt: Date;
  }): SessionData {
    const cookiesParsed = JSON.parse(session.cookies) as Record<string, string>;
    const metadataParsed = session.metadata
      ? (JSON.parse(session.metadata) as SessionData['metadata'])
      : undefined;

    return {
      sessionId: session.sessionId,
      csrfToken: session.csrfToken,
      cookies: cookiesParsed,
      metadata: metadataParsed,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    };
  }
}
