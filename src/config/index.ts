/**
 * Application configuration
 * @module config
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  const required = ['BACKEND_BASE_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

/**
 * Application configuration object
 */
export const config = {
  /**
   * Backend API configuration
   */
  backend: {
    baseUrl: process.env.BACKEND_BASE_URL as string,
    timeout: parseInt(process.env.BACKEND_TIMEOUT || '30000', 10),
    csrfRefreshInterval: parseInt(process.env.CSRF_REFRESH_INTERVAL || '1800000', 10), // 30 minutes
  },

  /**
   * Slack bot configuration
   */
  slack: {
    enabled: process.env.SLACK_ENABLED === 'true',
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    port: parseInt(process.env.SLACK_PORT || '3000', 10),
  },

  /**
   * Web API configuration
   */
  webApi: {
    enabled: process.env.WEB_API_ENABLED === 'true',
    port: parseInt(process.env.WEB_API_PORT || '4000', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  },

  /**
   * Logging configuration
   */
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  /**
   * Application environment
   */
  env: process.env.NODE_ENV || 'development',

  /**
   * Is production environment
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Is development environment
   */
  isDevelopment: process.env.NODE_ENV !== 'production',
} as const;

export default config;
