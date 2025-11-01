/**
 * Application configuration
 * @module config
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Required (must be set in .env file)
  BACKEND_BASE_URL: z.url(),

  // Optional with defaults
  BACKEND_TIMEOUT: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10)),
  CSRF_REFRESH_INTERVAL: z
    .string()
    .default('1800000')
    .transform((val) => parseInt(val, 10)),

  WEB_API_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  WEB_API_PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10)),
  CORS_ORIGIN: z.string().default('*'),

  RATE_LIMIT_WINDOW: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().default('file:./dev.db'),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const error = result.error;
    const flattened = error.flatten();

    // Separate missing required variables from invalid values
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const issue of error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';

      if (issue.code === 'invalid_type' && 'received' in issue && issue.received === 'undefined') {
        missing.push(path);
      } else {
        // Use the formatted error message for better readability
        const fieldErrors = flattened.fieldErrors;
        const fieldError = fieldErrors[path as keyof typeof fieldErrors];
        if (fieldError) {
          const errorText = Array.isArray(fieldError) ? fieldError.join(', ') : String(fieldError);
          invalid.push(`${path}: ${errorText}`);
        } else {
          invalid.push(`${path}: ${issue.message}`);
        }
      }
    }

    // Build a comprehensive error message
    const errorMessages: string[] = [];

    if (missing.length > 0) {
      errorMessages.push(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (invalid.length > 0) {
      errorMessages.push(`Invalid environment variables:\n  - ${invalid.join('\n  - ')}`);
    }

    throw new Error(errorMessages.join('\n\n'));
  }

  return result.data;
};

const env = parseEnv();

/**
 * Application configuration object
 */
export const config = {
  /**
   * Backend API configuration
   */
  backend: {
    baseUrl: env.BACKEND_BASE_URL,
    timeout: env.BACKEND_TIMEOUT,
    csrfRefreshInterval: env.CSRF_REFRESH_INTERVAL, // 30 minutes
  },

  /**
   * Web API configuration
   */
  webApi: {
    enabled: env.WEB_API_ENABLED,
    port: env.WEB_API_PORT,
    corsOrigin: env.CORS_ORIGIN,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW, // 1 minute
      max: env.RATE_LIMIT_MAX,
    },
  },

  /**
   * Logging configuration
   */
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },

  /**
   * Application environment
   */
  env: env.NODE_ENV,

  /**
   * Is production environment
   */
  isProduction: env.NODE_ENV === 'production',

  /**
   * Is development environment
   */
  isDevelopment: env.NODE_ENV !== 'production',

  /**
   * Database configuration
   */
  database: {
    url: env.DATABASE_URL,
  },
} as const;

export default config;
