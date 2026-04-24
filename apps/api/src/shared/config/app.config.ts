import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Required (must be set in .env file)
  BACKEND_BASE_URL: z.url(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required'),

  // Optional with defaults
  BACKEND_TIMEOUT: z.coerce.number().int().positive().default(30_000),

  // commande.app integration (giga-tacos).
  COMMANDE_BASE_URL: z.url().default('https://commande.app'),
  COMMANDE_RESTAURANT_ID: z.string().min(1).default('cmmcc6j8a00056h175p38kx6l'),
  COMMANDE_RESTAURANT_SLUG: z.string().min(1).default('giga-tacos-pontaise-lausanne'),

  // Proxy configuration (optional) - for Swiss IP restriction
  PROXY_URL: z.url().optional(),
  PROXY_API_KEY: z.string().optional(),

  WEB_API_ENABLED: z.coerce.boolean().default(true),
  WEB_API_PORT: z.coerce.number().int().min(1).max(65535).default(4_000),
  CORS_ORIGIN: z.string().default('*'),

  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'verbose'])
    .default(process.env['NODE_ENV'] === 'development' ? 'debug' : 'info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().default('file:./dev.db'),
});

const formatEnvErrors = (error: z.ZodError) => {
  const lines = error.issues.map((issue) => {
    const path = issue.path.join('.') || '(root)';
    return `  • ${path}: ${issue.message}`;
  });
  return ['Configuration validation failed:', ...lines].join('\n');
};

const configSchema = envSchema.transform(
  (env) =>
    ({
      backend: {
        baseUrl: env.BACKEND_BASE_URL,
        timeout: env.BACKEND_TIMEOUT,
      },
      commande: {
        baseUrl: env.COMMANDE_BASE_URL,
        restaurantId: env.COMMANDE_RESTAURANT_ID,
        restaurantSlug: env.COMMANDE_RESTAURANT_SLUG,
      },
      proxy: {
        url: env.PROXY_URL,
        apiKey: env.PROXY_API_KEY,
      },
      webApi: {
        enabled: env.WEB_API_ENABLED,
        port: env.WEB_API_PORT,
        corsOrigin: env.CORS_ORIGIN,
        rateLimit: {
          windowMs: env.RATE_LIMIT_WINDOW,
          max: env.RATE_LIMIT_MAX,
        },
      },
      logging: {
        level: env.LOG_LEVEL,
        format: env.LOG_FORMAT,
      },
      env: env.NODE_ENV,
      isProduction: env.NODE_ENV === 'production',
      isDevelopment: env.NODE_ENV !== 'production',
      database: {
        url: env.DATABASE_URL,
      },
      auth: {
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
      },
    }) as const
);

export type AppConfig = z.output<typeof configSchema>;

/**
 * Parse and validate environment variables
 */
const parseConfig = (): AppConfig => {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(formatEnvErrors(result.error));
  }

  return result.data;
};

/**
 * Application configuration object
 */
export const config = Object.freeze(parseConfig());
