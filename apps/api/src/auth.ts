import { randomUUID } from 'node:crypto';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession } from 'better-auth/plugins';
import { Resend } from 'resend';
import { getPrismaClient } from '@/infrastructure/database/prisma.client';
import { renderEmail } from '@/templates/email';

// Use the shared PrismaClient instance to avoid connection pool exhaustion
const prisma = getPrismaClient();

const resend = new Resend(process.env['RESEND_API_KEY']);

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
    // Cookie cache disabled to prevent large cookies when user images are base64 encoded
    // Large base64 images cause cookies to exceed 4KB limit and split into multiple cookies
    // TODO: Re-enable cookie cache once user images are stored as URLs instead of base64
    cookieCache: {
      enabled: false, // Disabled to prevent cookie size issues with large base64 images
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const email = await renderEmail('reset-password', user, { url });
      await resend.emails.send({
        from: 'TacoCrew <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your TacoCrew password',
        html: email.html,
        attachments: [...email.attachments],
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const email = await renderEmail('verify-email', user, { url });
      await resend.emails.send({
        from: 'TacoCrew <onboarding@resend.dev>',
        to: user.email,
        subject: 'Verify your TacoCrew email',
        html: email.html,
        attachments: [...email.attachments],
      });
    },
  },
  plugins: [
    passkey({
      rpID: process.env['PASSKEY_RP_ID'] || 'localhost',
      rpName: process.env['PASSKEY_RP_NAME'] || 'TacoCrew',
      origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    }),
    // Exclude image from session to reduce cookie size
    // Large base64 images cause cookies to be split into multiple cookies
    customSession(({ user, session }) => {
      const { image: _, ...userWithoutImage } = user;
      return Promise.resolve({
        user: userWithoutImage,
        session,
      });
    }),
  ],
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
});
