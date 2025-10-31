/**
 * Core API client for communicating with the backend
 * @module api/client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import {
  CsrfError,
  NetworkError,
  RateLimitError,
  DuplicateOrderError,
  ApiError,
} from '../utils/errors';
import { CsrfTokenResponse, ErrorCode } from '../types';

/**
 * API Client for backend communication
 */
export class TacosApiClient {
  private axiosInstance: AxiosInstance;
  private csrfToken: string | null = null;
  private csrfRefreshTimer: NodeJS.Timeout | null = null;

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
   * Setup axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add CSRF token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.csrfToken && config.headers) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }
        logger.debug('API Request', {
          method: config.method,
          url: config.url,
          hasToken: !!this.csrfToken,
        });
        return config;
      },
      (error: Error) => {
        logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
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
        this.csrfToken = null;
        await this.refreshCsrfToken();
        throw new CsrfError('CSRF token invalid, refreshed automatically');
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
   * Initialize the client (fetch CSRF token)
   */
  async initialize(): Promise<void> {
    logger.info('Initializing API client');
    await this.refreshCsrfToken();
    this.startCsrfRefreshTimer();
    logger.info('API client initialized successfully');
  }

  /**
   * Refresh CSRF token
   */
  async refreshCsrfToken(): Promise<string> {
    try {
      logger.debug('Refreshing CSRF token');
      const response = await axios.get<CsrfTokenResponse>(
        `${this.baseUrl}/ajax/refresh_token.php`
      );
      this.csrfToken = response.data.csrf_token;
      logger.info('CSRF token refreshed successfully');
      return this.csrfToken;
    } catch (error) {
      logger.error('Failed to refresh CSRF token', { error });
      throw new CsrfError('Failed to refresh CSRF token');
    }
  }

  /**
   * Start automatic CSRF token refresh timer
   */
  private startCsrfRefreshTimer(): void {
    if (this.csrfRefreshTimer) {
      clearInterval(this.csrfRefreshTimer);
    }

    this.csrfRefreshTimer = setInterval(() => {
      void this.refreshCsrfToken();
    }, config.backend.csrfRefreshInterval);

    logger.info('CSRF refresh timer started', {
      intervalMs: config.backend.csrfRefreshInterval,
    });
  }

  /**
   * Stop CSRF refresh timer
   */
  stopCsrfRefreshTimer(): void {
    if (this.csrfRefreshTimer) {
      clearInterval(this.csrfRefreshTimer);
      this.csrfRefreshTimer = null;
      logger.info('CSRF refresh timer stopped');
    }
  }

  /**
   * Make GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Make POST request with JSON body
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make POST request with URL-encoded form data
   */
  async postForm<T>(url: string, data: Record<string, unknown>): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }

    const response = await this.axiosInstance.post<T>(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  /**
   * Make POST request with multipart form data
   */
  async postFormData<T>(url: string, data: Record<string, unknown>): Promise<T> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }

    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopCsrfRefreshTimer();
    this.csrfToken = null;
    logger.info('API client destroyed');
  }
}

// Export singleton instance
export const apiClient = new TacosApiClient();

export default apiClient;
