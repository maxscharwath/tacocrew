import 'hono';
import type { User } from '@/schemas/user.schema';

declare module 'hono' {
  interface ContextVariableMap {
    // Authenticated user from our database (set by auth middleware)
    // Similar to Spring Boot's Principal pattern - single source of truth for authenticated user
    user?: User;
  }
}
