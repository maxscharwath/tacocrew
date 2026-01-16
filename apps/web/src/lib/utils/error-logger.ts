/**
 * Error logging and monitoring utilities
 * Structured error tracking for debugging and analytics
 */

import type { FormError } from '@/lib/types/form-error';
import type { OrderError } from '@/lib/types/order-error';

export interface ErrorLog {
  timestamp: number;
  type: 'order' | 'form' | 'unknown';
  code: string;
  message: string;
  context?: Record<string, unknown>;
  originalError?: string;
  stackTrace?: string;
  url?: string;
  userAgent?: string;
}

/**
 * Central error logger
 * Use for monitoring, debugging, and analytics
 */
class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory

  /**
   * Log an order error
   */
  logOrderError(error: OrderError, additionalContext?: Record<string, unknown>): void {
    this.addLog({
      type: 'order',
      code: error.code,
      message: error.message,
      context: { ...error.context, ...additionalContext },
      originalError: error.originalError?.message,
      stackTrace: error.originalError?.stack,
    });

    this.logToConsole('OrderError', error, additionalContext);
    this.sendToAnalytics('error:order', error, additionalContext);
  }

  /**
   * Log a form error
   */
  logFormError(error: FormError, additionalContext?: Record<string, unknown>): void {
    this.addLog({
      type: 'form',
      code: error.code,
      message: error.message,
      context: { field: error.field, ...error.context, ...additionalContext },
      originalError: error.originalError?.message,
      stackTrace: error.originalError?.stack,
    });

    this.logToConsole('FormError', error, additionalContext);
    this.sendToAnalytics('error:form', error, additionalContext);
  }

  /**
   * Log unknown error
   */
  logUnknownError(error: unknown, context?: Record<string, unknown>): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.addLog({
      type: 'unknown',
      code: 'UNKNOWN_ERROR',
      message: errorMsg,
      context,
      originalError: errorMsg,
      stackTrace: errorStack,
    });

    this.logToConsole('UnknownError', error, context);
    this.sendToAnalytics('error:unknown', { message: errorMsg }, context);
  }

  /**
   * Log to browser console in development
   * Note: Console methods used intentionally for development logging only
   */
  private logToConsole(
    _prefix: string,
    error: OrderError | FormError | unknown,
    context?: Record<string, unknown>
  ): void {
    if (process.env.NODE_ENV === 'development') {
      if (error instanceof Object && 'message' in error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      } else {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      if (context) {
        // eslint-disable-next-line no-console
        console.log('Context:', context);
      }
      if (error instanceof Object && 'originalError' in error && error.originalError) {
        // eslint-disable-next-line no-console
        console.error('Original Error:', error.originalError);
      }
    }
  }

  /**
   * Send to analytics service
   * Implement based on your analytics provider (Sentry, LogRocket, etc.)
   */
  private sendToAnalytics(
    _eventName: string,
    _error: OrderError | FormError | Record<string, unknown>,
    _additionalContext?: Record<string, unknown>
  ): void {
    // Example: Send to Sentry
    // Sentry.captureException(error, { tags: { event: eventName }, extra: additionalContext });

    // Example: Send to custom analytics
    // analytics.trackError(eventName, error, additionalContext);

    // For now, just track in memory
    // Could implement custom event dispatch here when needed
  }

  /**
   * Add log to internal storage
   */
  private addLog(log: Omit<ErrorLog, 'timestamp'>): void {
    const fullLog: ErrorLog = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...log,
    };

    this.logs.push(fullLog);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get all logged errors (for debugging/support)
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Type-safe error logging helpers
 */
export const logError = {
  /**
   * Log order error with type safety
   */
  order: (error: OrderError, context?: Record<string, unknown>) => {
    errorLogger.logOrderError(error, context);
  },

  /**
   * Log form error with type safety
   */
  form: (error: FormError, context?: Record<string, unknown>) => {
    errorLogger.logFormError(error, context);
  },

  /**
   * Log unknown error
   */
  unknown: (error: unknown, context?: Record<string, unknown>) => {
    errorLogger.logUnknownError(error, context);
  },

  /**
   * Get debug info (for development support)
   */
  getDebugInfo: () => ({
    logs: errorLogger.getLogs(),
    logCount: errorLogger.getLogs().length,
    exported: errorLogger.exportLogs(),
  }),
};
