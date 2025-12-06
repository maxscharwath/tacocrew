import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { ErrorCodes } from '@/shared/types/types';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Maps Better Auth error codes to our internal error codes with i18n keys
 */
const BETTER_AUTH_ERROR_MAP: Record<string, { code: string; key: string }> = {
  // Passkey errors
  PASSKEY_NOT_FOUND: ErrorCodes.PASSKEY_NOT_FOUND,
  CHALLENGE_NOT_FOUND: ErrorCodes.CHALLENGE_NOT_FOUND,
  YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY: ErrorCodes.PASSKEY_REGISTRATION_NOT_ALLOWED,
  FAILED_TO_VERIFY_REGISTRATION: ErrorCodes.PASSKEY_VERIFICATION_FAILED,

  // General auth errors
  INVALID_EMAIL_OR_PASSWORD: ErrorCodes.INVALID_EMAIL_OR_PASSWORD,
  USER_NOT_FOUND: ErrorCodes.USER_NOT_FOUND,
  EMAIL_ALREADY_IN_USE: ErrorCodes.EMAIL_ALREADY_IN_USE,
  INVALID_TOKEN: ErrorCodes.INVALID_TOKEN,

  // Session errors
  SESSION_NOT_FOUND: ErrorCodes.SESSION_NOT_FOUND,
  SESSION_EXPIRED: ErrorCodes.SESSION_EXPIRED,

  // Generic errors
  UNAUTHORIZED: ErrorCodes.UNAUTHORIZED,
  FORBIDDEN: ErrorCodes.FORBIDDEN,
};

/**
 * Wraps Better Auth responses to add i18n keys to error responses
 *
 * Better Auth returns errors in the format:
 * { "code": "PASSKEY_NOT_FOUND", "message": "Passkey not found" }
 *
 * This middleware transforms them to our standardized format:
 * {
 *   "error": {
 *     "id": "uuid",
 *     "code": "PASSKEY_NOT_FOUND",
 *     "key": "errors.auth.passkey.notFound",
 *     "details": {}
 *   }
 * }
 */
export async function wrapBetterAuthErrors(
  c: Context,
  betterAuthHandler: (request: Request) => Promise<Response | null>
): Promise<Response> {
  const response = await betterAuthHandler(c.req.raw);

  // If Better Auth returns null/undefined, it means the route wasn't handled
  if (!response) {
    return c.notFound();
  }

  // Only process error responses (4xx, 5xx status codes)
  if (response.status < 400) {
    return response;
  }

  try {
    // Clone the response to read the body
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type');

    // Only process JSON responses
    if (!contentType?.includes('application/json')) {
      return response;
    }

    const body = (await clonedResponse.json()) as { code?: string; message?: string };

    // Check if this is a Better Auth error with a code
    if (body.code) {
      const errorMapping = BETTER_AUTH_ERROR_MAP[body.code];

      if (errorMapping) {
        const errorId = randomUUID();

        // Log the error
        logger.warn('Better Auth error:', {
          id: errorId,
          method: c.req.method,
          url: c.req.url,
          code: body.code,
          message: body.message,
        });

        // Transform to our standardized error format
        const transformedError = {
          error: {
            id: errorId,
            code: errorMapping.code,
            key: errorMapping.key,
            details: {},
          },
        };

        return c.json(transformedError, response.status as 400 | 401 | 403 | 404 | 500);
      }

      // If no mapping found, log it and return as-is with a warning
      logger.warn('Unmapped Better Auth error code:', {
        code: body.code,
        message: body.message,
        method: c.req.method,
        url: c.req.url,
      });
    }

    // Return original response if no transformation needed
    return response;
  } catch (error) {
    // If we can't parse the response, return it as-is
    logger.error('Failed to parse Better Auth error response:', error);
    return response;
  }
}
