import 'hono';
import type { UserId } from '@/schemas/user.schema';

declare module 'hono' {
  interface ContextVariableMap {
    userId?: UserId;
    username?: string;
    slackId?: string;
  }
}
