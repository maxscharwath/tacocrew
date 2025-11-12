import 'hono';
import type { auth } from '../../auth';
import type { UserId } from '../../schemas/user.schema';

declare module 'hono' {
  interface ContextVariableMap {
    // Better Auth session data (set by global middleware)
    user: Awaited<ReturnType<typeof auth.api.getSession>>['user'] | null;
    session: Awaited<ReturnType<typeof auth.api.getSession>>['session'] | null;

    // App-specific user context (set by auth middleware)
    userId?: UserId;
    username?: string;
    slackId?: string;
    email?: string;
  }
}
