/**
 * Custom error classes for backend client
 * @module gigatacos-client/errors
 */

import { AxiosError } from 'axios';

/**
 * CSRF token error
 */
export class CsrfError extends Error {
  public readonly statusCode: number = 403;

  constructor(message = 'CSRF token is invalid or missing') {
    super(message);
    this.name = 'CsrfError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  public readonly statusCode: number = 429;

  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network error
 */
export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Check if an error is a CSRF error
 */
export function isCsrfError(error: unknown): boolean {
  if (error instanceof CsrfError) {
    return true;
  }

  if (error instanceof AxiosError) {
    // 403 status usually indicates CSRF error
    if (error.response?.status === 403) {
      return true;
    }
    // Check error message
    const message = error.message?.toLowerCase() || '';
    if (message.includes('csrf') || message.includes('token')) {
      return true;
    }
    // Check response data
    const data = error.response?.data;
    if (typeof data === 'string' && (data.toLowerCase().includes('csrf') || data.toLowerCase().includes('token'))) {
      return true;
    }
  }

  if (error instanceof Error) {
    const message = error.message?.toLowerCase() || '';
    if (message.includes('csrf') || message.includes('token') || message.includes('forbidden')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof AxiosError) {
    if (error.response?.status === 429) {
      return true;
    }
    const message = error.message?.toLowerCase() || '';
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
  }

  return false;
}

