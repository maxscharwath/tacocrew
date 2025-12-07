import { randomUUID } from 'node:crypto';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { getPrismaClient } from '@/infrastructure/database/prisma.client';

// Use the shared PrismaClient instance to avoid connection pool exhaustion
const prisma = getPrismaClient();

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env['BETTER_AUTH_SECRET'] || process.env['JWT_SECRET'] || '',
  baseURL: process.env['BETTER_AUTH_URL'] || 'http://localhost:4000',
  basePath: '/api/auth',
  trustedOrigins: [
    process.env['BETTER_AUTH_URL'] || 'http://localhost:4000',
    process.env['FRONTEND_URL'] || 'http://localhost:5173',
  ],
  session: {
    // Disable cookieCache to store session data in database instead of cookies
    // This prevents large session data from being split across multiple cookies
    // Session will still be tracked via a small session cookie, but data is in DB
    cookieCache: {
      enabled: false,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    passkey({
      rpID: process.env['PASSKEY_RP_ID'] || 'localhost',
      rpName: process.env['PASSKEY_RP_NAME'] || 'TacoBot',
      origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    }),
  ],
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
});
