/**
 * Session-aware API client
 * @module api/session-client
 */

import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { injectable } from 'tsyringe';
import { HttpService } from '@/infrastructure/api/http.service';
import { TacosApiClient } from '@/infrastructure/api/tacos-api.client';
import type { SessionId } from '@/schemas/session.schema';
import { SessionService } from '@/services/session/session.service';
import { config } from '@/shared/config/app.config';
import { ErrorCode } from '@/shared/types/types';
import {
  ApiError,
  CsrfError,
  DuplicateOrderError,
  NetworkError,
  RateLimitError,
} from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

/**
 * Session-aware API Client
 * Each session has its own CSRF token and cookies
 */
@injectable()
export class SessionApiClient {
  private readonly httpService = inject(HttpService);
  private readonly sessionService = inject(SessionService);
  private readonly apiClient = inject(TacosApiClient);

  private axiosInstance: AxiosInstance;

  constructor(private baseUrl: string = config.backend.baseUrl) {
    // Create axios instance with default logging interceptors
    this.axiosInstance = this.httpService.createInstance({ baseURL: this.baseUrl });

    // Add error handling interceptor
    this.setupErrorInterceptor();
  }

  /**
   * Setup error handling interceptor
   */
  private setupErrorInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): never {
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

      const errorMessage = this.getErrorMessage(data);
      const errorDetails = this.getErrorDetails(data);
      throw new ApiError(ErrorCode.UNKNOWN_ERROR, errorMessage, status, errorDetails);
    }

    if (error.request) {
      logger.error('Network Error', { error: error.message });
      throw new NetworkError('No response from server');
    }

    logger.error('Request Setup Error', { error: error.message });
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, error.message);
  }

  /**
   * Get error message from unknown data
   */
  private getErrorMessage(data: unknown): string {
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = data.message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return 'API request failed';
  }

  /**
   * Get error details from unknown data
   */
  private getErrorDetails(data: unknown): Record<string, unknown> {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const details: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        details[key] = value;
      }
      return details;
    }
    return {};
  }

  /**
   * Check if error is rate limit error
   */
  private isRateLimitError(data: unknown): boolean {
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = data.message;
      if (typeof message === 'string') {
        return message.includes('1 Order per minute') || message.includes('Maximum');
      }
    }
    return false;
  }

  /**
   * Make request with session context
   * CSRF tokens are fetched fresh for each request using stored cookies
   * Cookies are stored when a cart is created (POST /carts) and updated on responses
   */
  /**
   * Get or fetch CSRF token for a session
   */
  private async getCsrfToken(
    sessionId: SessionId,
    cookies: Record<string, string>
  ): Promise<string> {
    const { csrfToken } = await this.apiClient.refreshCsrfTokenWithCookies(cookies);

    logger.debug('Fetched fresh CSRF token', {
      sessionId,
      tokenLength: csrfToken.length,
    });

    return csrfToken;
  }

  private async makeSessionRequest<T>(
    sessionId: SessionId,
    method: 'get' | 'post',
    url: string,
    data?: unknown,
    additionalConfig?: AxiosRequestConfig
  ): Promise<T> {
    // Get cart session data (cookies only - tokens are fetched fresh)
    // SessionId is CartId - each cart ID serves as a session identifier
    const sessionData = await this.sessionService.getSession(sessionId);
    const session = sessionData ? { cookies: sessionData.cookies } : { cookies: {} };

    // Get CSRF token (cached briefly to handle parallel requests)
    const csrfToken = await this.getCsrfToken(sessionId, session.cookies);

    // Log full request details
    logger.info('SessionApiClient Request', {
      sessionId,
      method: method.toUpperCase(),
      url: `${this.baseUrl}${url}`,
      headers: {
        'X-CSRF-Token': csrfToken.substring(0, 20) + '...',
        Cookie: Object.keys(session.cookies).length > 0 ? 'present' : 'none',
        ...(additionalConfig?.headers || {}),
      },
      data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined,
      cookieCount: Object.keys(session.cookies).length,
      cookieNames: Object.keys(session.cookies),
    });

    // Prepare config with fresh CSRF token and stored cookies
    const requestConfig: AxiosRequestConfig = {
      ...additionalConfig,
      headers: {
        ...additionalConfig?.headers,
        'X-CSRF-Token': csrfToken,
      },
    };

    // Add cookies if present
    if (Object.keys(session.cookies).length > 0) {
      // Send cookies exactly as stored (they're already in the correct format from server)
      const cookieString = Object.entries(session.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      requestConfig.headers = {
        ...requestConfig.headers,
        Cookie: cookieString,
      };
      logger.debug('Cookies added to request', {
        sessionId,
        cookieCount: Object.keys(session.cookies).length,
      });
    } else {
      logger.debug('No cookies found in session', { sessionId });
    }

    try {
      const response =
        method === 'get'
          ? await this.axiosInstance.get<T>(url, requestConfig)
          : await this.axiosInstance.post<T>(url, data, requestConfig);

      // Log full response details
      const responseData =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      logger.info('SessionApiClient Response', {
        sessionId,
        method: method.toUpperCase(),
        url: `${this.baseUrl}${url}`,
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers['content-type'],
          'set-cookie': response.headers['set-cookie'] ? 'present' : 'none',
        },
        data: responseData,
      });

      // Extract and store cookies from response, merging with existing
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
          // Get current session to merge cookies instead of replacing
          // SessionId is CartId - each cart ID serves as a session identifier
          const currentSession = await this.sessionService.getSession(sessionId);
          if (currentSession) {
            const mergedCookies = { ...currentSession.cookies, ...cookies };
            await this.sessionService.updateSessionCookies(sessionId, mergedCookies);
          } else {
            // If session doesn't exist, create it with cookies
            await this.sessionService.createSession({
              sessionId,
              metadata: { cookies },
            });
          }
        }
      }

      return response.data;
    } catch (error) {
      // If CSRF error, try refreshing cookies and retry once
      // (This shouldn't happen since we fetch fresh tokens, but handle it just in case)
      if (error instanceof CsrfError) {
        logger.warn('CSRF error despite fresh token, refreshing cookies and retrying...', {
          sessionId,
          url,
        });

        try {
          // Get current session cookies
          // SessionId is CartId - each cart ID serves as a session identifier
          const currentSession = await this.sessionService.getSession(sessionId);
          const sessionCookies = currentSession?.cookies || {};

          // Get fresh token using existing cookies (maintains session)
          const { csrfToken: retryToken, cookies: updatedCookies } =
            await this.apiClient.refreshCsrfTokenWithCookies(sessionCookies);

          // Update cart session with any new cookies from token refresh
          if (Object.keys(updatedCookies).length > 0) {
            if (currentSession) {
              await this.sessionService.updateSessionCookies(sessionId, updatedCookies);
            } else {
              // Create session if it doesn't exist
              await this.sessionService.createSession({
                sessionId,
                metadata: { cookies: updatedCookies },
              });
            }
          }

          logger.info('Cookies refreshed, retrying request', { sessionId, url });

          const retryConfig: AxiosRequestConfig = {
            ...additionalConfig,
            headers: {
              ...additionalConfig?.headers,
              'X-CSRF-Token': retryToken,
            },
          };

          // Add cookies to retry request (use updated cookies from token refresh)
          if (Object.keys(updatedCookies).length > 0) {
            const cookieString = Object.entries(updatedCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join('; ');
            retryConfig.headers = {
              ...retryConfig.headers,
              Cookie: cookieString,
            };
          }

          const retryResponse =
            method === 'get'
              ? await this.axiosInstance.get<T>(url, retryConfig)
              : await this.axiosInstance.post<T>(url, data, retryConfig);

          // Update cookies from retry response
          const setCookieHeaders = retryResponse.headers['set-cookie'];
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
              // Merge with cookies we already have from token refresh (don't fetch session again)
              const mergedCookies = { ...updatedCookies, ...cookies };
              await this.sessionService.updateSessionCookies(sessionId, mergedCookies);
            }
          }

          logger.info('Request succeeded after cookie refresh', { sessionId, url });
          return retryResponse.data;
        } catch (refreshError) {
          logger.error('Failed to refresh cookies', {
            sessionId,
            url,
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          });
          throw new CsrfError(
            `CSRF error and cookie refresh failed. Please create a new cart with POST /carts`
          );
        }
      }
      throw error;
    }
  }

  /**
   * GET request with session
   */
  get<T>(sessionId: SessionId, url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeSessionRequest<T>(sessionId, 'get', url, undefined, config);
  }

  /**
   * POST request with JSON body
   */
  post<T>(
    sessionId: SessionId,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.makeSessionRequest<T>(sessionId, 'post', url, data, config);
  }

  /**
   * POST request with URL-encoded form data
   */
  postForm<T>(sessionId: SessionId, url: string, data: Record<string, unknown>): Promise<T> {
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
  postFormData<T>(sessionId: SessionId, url: string, data: Record<string, unknown>): Promise<T> {
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
}
