/**
 * Session management service
 * @module services/session
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SessionId } from '@/schemas/session.schema';
import { CreateSessionOptions, SessionData, SessionStats } from '@/shared/types/session';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import { randomUUID } from '@/shared/utils/uuid.utils';

/**
 * Session Service
 *
 * A "session" is a draft cart row (`Cart` table). Since the move to
 * commande.app, sessions no longer carry CSRF tokens or cookies — the
 * service only tracks ids, timestamps, and free-form metadata.
 */
@injectable()
export class SessionService {
  private readonly prisma = inject(PrismaService);

  private readonly SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  constructor() {
    this.startCleanupTimer();
  }

  async createSession(options: CreateSessionOptions = {}): Promise<SessionData> {
    const rawSessionId = options.sessionId || randomUUID();
    const sessionId = SessionId.parse(rawSessionId);

    logger.info('Creating new session', { sessionId });

    const metadataJson = options.metadata == null ? null : JSON.stringify(options.metadata);

    const cart = await this.prisma.client.cart.create({
      data: {
        id: sessionId,
        metadata: metadataJson,
      },
    });

    return {
      sessionId,
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
      metadata: this.parseMetadata(cart.metadata),
    };
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const parsedSessionId = SessionId.parse(sessionId);

    const cart = await this.prisma.client.cart.findUnique({
      where: { id: parsedSessionId },
    });

    if (!cart) {
      return null;
    }

    await this.prisma.client.cart.update({
      where: { id: parsedSessionId },
      data: { lastActivityAt: new Date() },
    });

    return {
      sessionId: SessionId.parse(cart.id),
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
      metadata: this.parseMetadata(cart.metadata),
    };
  }

  async getSessionOrThrow(sessionId: string): Promise<SessionData> {
    const session = await this.getSession(sessionId);

    if (!session) {
      logger.warn('Session not found', { sessionId });
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session;
  }

  async updateSessionMetadata(
    sessionId: string,
    metadata: Record<string, unknown> | null
  ): Promise<void> {
    const parsedSessionId = SessionId.parse(sessionId);
    await this.getSessionOrThrow(sessionId);

    await this.prisma.client.cart.update({
      where: { id: parsedSessionId },
      data: {
        metadata: metadata == null ? null : JSON.stringify(metadata),
        lastActivityAt: new Date(),
      },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const parsedSessionId = SessionId.parse(sessionId);
    await this.prisma.client.cart.delete({
      where: { id: parsedSessionId },
    });
  }

  async hasSession(sessionId: string): Promise<boolean> {
    const parsedSessionId = SessionId.parse(sessionId);
    const cart = await this.prisma.client.cart.findUnique({
      where: { id: parsedSessionId },
      select: { id: true },
    });
    return cart !== null;
  }

  async getAllSessions(): Promise<SessionData[]> {
    const carts = await this.prisma.client.cart.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return carts.map((cart) => ({
      sessionId: SessionId.parse(cart.id),
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
      metadata: this.parseMetadata(cart.metadata),
    }));
  }

  async getStats(): Promise<SessionStats> {
    const [total, activeCount, oldest, newest] = await Promise.all([
      this.prisma.client.cart.count(),
      this.prisma.client.cart.count({
        where: {
          lastActivityAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
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

  async cleanupExpiredSessions(): Promise<number> {
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

  private parseMetadata(raw: string | null): Record<string, unknown> | null {
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  }

  private startCleanupTimer(): void {
    logger.info('Session cleanup timer started (runs every hour)');
  }
}
