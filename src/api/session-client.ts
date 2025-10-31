/**
 * Session-aware API client
 * @module api/session-client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import { sessionService } from '../services/session.service';
import {
  CsrfError,
  NetworkError,
  RateLimitError,
  DuplicateOrderError,
  ApiError,
} from '../utils/errors';
import { CsrfTokenResponse, ErrorCode } from '../types';

/**
 * Session-aware API Client
 * Each session has its own CSRF token and cookies
 */
export class SessionApiClient {
  private axiosInstance: AxiosInstance;

  constructor(private baseUrl: string = config.backend.baseUrl) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: config.backend.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.debug('API Request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error: Error) => {
        logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const { status, data } = error.response;

      logger.error('API Error Response', {
        status,
        url: error.config?.url,
        data,
      });

      // CSRF token error
      if (status === 403) {
        throw new CsrfError('CSRF token invalid or expired');
      }

      // Rate limit error
      if (status === 429 || (status === 403 && this.isRateLimitError(data))) {
        throw new RateLimitError('Rate limit exceeded');
      }

      // Duplicate order
      if (status === 409) {
        throw new DuplicateOrderError('Order already exists');
      }

      throw new ApiError(
        ErrorCode.UNKNOWN_ERROR,
        (data as { message?: string })?.message || 'API request failed',
        status,
        data as Record<string, unknown>
      );
    }

    if (error.request) {
      logger.error('Network Error', { error: error.message });
      throw new NetworkError('No response from server');
    }

    logger.error('Request Setup Error', { error: error.message });
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, error.message);
  }

  /**
   * Check if error is rate limit error
   */
  private isRateLimitError(data: unknown): boolean {
    if (typeof data === 'object' && data !== null) {
      const message = (data as { message?: string }).message || '';
      return message.includes('1 Order per minute') || message.includes('Maximum');
    }
    return false;
  }

  /**
   * Make request with session context
   */
  private async makeSessionRequest<T>(
    sessionId: string,
    method: 'get' | 'post',
    url: string,
    data?: unknown,
    additionalConfig?: AxiosRequestConfig
  ): Promise<T> {
    // Get session
    const session = await sessionService.getSessionOrThrow(sessionId);

    // Prepare config with session token and cookies
    const requestConfig: AxiosRequestConfig = {
      ...additionalConfig,
      headers: {
        ...additionalConfig?.headers,
        'X-CSRF-Token': session.csrfToken,
      },
    };

    // Add cookies if present
    if (Object.keys(session.cookies).length > 0) {
      const cookieString = Object.entries(session.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      requestConfig.headers = {
        ...requestConfig.headers,
        Cookie: cookieString,
      };
    }

    try {
      const response =
        method === 'get'
          ? await this.axiosInstance.get<T>(url, requestConfig)
          : await this.axiosInstance.post<T>(url, data, requestConfig);

      // Extract and store cookies from response
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        const cookies: Record<string, string> = {};
        setCookieHeaders.forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = (nameValue || '').split('=');
          if (name && value) {
            cookies[name.trim()] = value.trim();
          }
        });

        if (Object.keys(cookies).length > 0) {
          await sessionService.updateSessionCookies(sessionId, cookies);
        }
      }

      return response.data;
    } catch (error) {
      // If CSRF error, try refreshing token once
      if (error instanceof CsrfError) {
        logger.warn('CSRF error, refreshing session token', { sessionId });
        await sessionService.refreshSessionToken(sessionId);
        // Don't retry automatically to avoid loops - let caller handle it
      }
      throw error;
    }
  }

  /**
   * GET request with session
   */
  async get<T>(sessionId: string, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeSessionRequest<T>(sessionId, 'get', url, undefined, config);
  }

  /**
   * POST request with JSON body
   */
  async post<T>(
    sessionId: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.makeSessionRequest<T>(sessionId, 'post', url, data, config);
  }

  /**
   * POST request with URL-encoded form data
   */
  async postForm<T>(sessionId: string, url: string, data: Record<string, unknown>): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }

    return this.makeSessionRequest<T>(sessionId, 'post', url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * POST request with multipart form data
   */
  async postFormData<T>(
    sessionId: string,
    url: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }

    return this.makeSessionRequest<T>(sessionId, 'post', url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Refresh CSRF token (global, not session-specific)
   */
  async refreshCsrfToken(): Promise<string> {
    try {
      logger.debug('Refreshing CSRF token');
      const response = await axios.get<CsrfTokenResponse>(
        `${this.baseUrl}/ajax/refresh_token.php`
      );
      logger.info('CSRF token refreshed successfully');
      return response.data.csrf_token;
    } catch (error) {
      logger.error('Failed to refresh CSRF token', { error });
      throw new CsrfError('Failed to refresh CSRF token');
    }
  }
}

// Export singleton instance
export const sessionApiClient = new SessionApiClient();
export default sessionApiClient;
