/**
 * Core API client for communicating with the backend
 * @module api/client
 */

import 'reflect-metadata';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { injectable } from 'tsyringe';
import config from '../config';
import { HttpService } from '../services/http.service';
import { ErrorCode } from '../types';
import {
  ApiError,
  CsrfError,
  DuplicateOrderError,
  NetworkError,
  RateLimitError,
} from '../utils/errors';
import { inject } from '../utils/inject';
import { logger } from '../utils/logger';
import { extractCsrfTokenFromHtml } from '../utils/html-parser';

/**
 * API Client for backend communication
 */
@injectable()
export class TacosApiClient {
  private readonly httpService = inject(HttpService);

  private axiosInstance: AxiosInstance;

  constructor(private baseUrl: string = config.backend.baseUrl) {
    // Create axios instance with default logging interceptors
    this.axiosInstance = this.httpService.createInstance(this.baseUrl);

    // Add error handling interceptors
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Response interceptor - handle errors
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
        throw new CsrfError('CSRF token invalid');
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
   * Refresh CSRF token using existing cookies (for existing sessions)
   * This maintains the session by using stored cookies
   * Fetches the token from index.php?content=livraison and extracts it from HTML
   */
  async refreshCsrfTokenWithCookies(cookies: Record<string, string>): Promise<{ csrfToken: string; cookies: Record<string, string> }> {
    try {
      // Build cookie header from existing cookies
      const cookieHeader = Object.keys(cookies).length > 0
        ? Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ')
        : undefined;

      logger.debug('Fetching CSRF token from HTML page with existing cookies', { 
        baseUrl: this.baseUrl,
        cookieCount: Object.keys(cookies).length,
      });
      
      // Fetch the HTML page containing the CSRF token
      const htmlResponse = await axios.get<string>(
        `${this.baseUrl}/index.php?content=livraison`,
        {
          headers: {
            'Accept': 'text/html',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        }
      );

      // Extract CSRF token from HTML
      const csrfToken = extractCsrfTokenFromHtml(htmlResponse.data);
      if (!csrfToken) {
        throw new CsrfError('CSRF token not found in HTML response');
      }

      // Extract cookies from response and merge with existing
      const updatedCookies: Record<string, string> = { ...cookies };
      const setCookieHeaders = htmlResponse.headers['set-cookie'];
      if (setCookieHeaders) {
        setCookieHeaders.forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = (nameValue || '').split('=');
          if (name && value) {
            updatedCookies[name.trim()] = value.trim();
          }
        });
      }

      logger.info('CSRF token fetched from HTML with existing cookies', {
        tokenLength: csrfToken.length,
        cookieCount: Object.keys(updatedCookies).length,
      });

      return {
        csrfToken,
        cookies: updatedCookies,
      };
    } catch (error) {
      logger.error('Failed to fetch CSRF token with cookies', { 
        error,
        baseUrl: this.baseUrl,
      });
      if (error instanceof CsrfError) {
        throw error;
      }
      throw new CsrfError(`Failed to fetch CSRF token from ${this.baseUrl}`);
    }
  }

  /**
   * Fetch a fresh CSRF token (creates new session - visits homepage first)
   * Use this when you need a token for creating a new cart
   * Fetches the token from index.php?content=livraison and extracts it from HTML
   * @returns Object with csrfToken and cookies from the response
   */
  async refreshCsrfToken(): Promise<{ csrfToken: string; cookies: Record<string, string> }> {
    try {
      // First, visit homepage to initialize PHP session properly
      // This ensures the session is fully established before getting the CSRF token
      logger.debug('Initializing session by visiting homepage', { baseUrl: this.baseUrl });
      const homeResponse = await axios.get<string>(`${this.baseUrl}/`, {
        headers: {
          'Accept': 'text/html',
        },
        validateStatus: () => true, // Don't throw on any status
      });
      
      // Extract cookies from homepage response
      const homeCookies: Record<string, string> = {};
      const homeSetCookieHeaders = homeResponse.headers['set-cookie'];
      if (homeSetCookieHeaders) {
        homeSetCookieHeaders.forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = (nameValue || '').split('=');
          if (name && value) {
            homeCookies[name.trim()] = value.trim();
          }
        });
      }
      
      logger.debug('Homepage visited', {
        status: homeResponse.status,
        cookieCount: Object.keys(homeCookies).length,
        cookieNames: Object.keys(homeCookies),
      });
      
      // Now fetch the HTML page containing the CSRF token, including cookies from homepage
      logger.debug('Fetching CSRF token from HTML page', { baseUrl: this.baseUrl });
      const cookieHeader = Object.keys(homeCookies).length > 0
        ? Object.entries(homeCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ')
        : undefined;
      
      const htmlResponse = await axios.get<string>(
        `${this.baseUrl}/index.php?content=livraison`,
        {
          headers: {
            'Accept': 'text/html',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
        }
      );

      // Extract CSRF token from HTML
      const csrfToken = extractCsrfTokenFromHtml(htmlResponse.data);
      if (!csrfToken) {
        throw new CsrfError('CSRF token not found in HTML response');
      }
      
      logger.info('CSRF token fetched successfully from HTML');
      
      // Extract cookies from HTML response and merge with homepage cookies
      // Store cookie values exactly as received (don't decode - send them back as-is)
      const cookies: Record<string, string> = { ...homeCookies }; // Start with homepage cookies
      const setCookieHeaders = htmlResponse.headers['set-cookie'];
      if (setCookieHeaders) {
        setCookieHeaders.forEach((cookie) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = (nameValue || '').split('=');
          if (name && value) {
            // Merge/overwrite with HTML response cookies
            cookies[name.trim()] = value.trim();
          }
        });
      }
      
      logger.info('CSRF token refresh response', {
        tokenLength: csrfToken.length,
        cookieCount: Object.keys(cookies).length,
        cookieNames: Object.keys(cookies),
        setCookieHeaders: setCookieHeaders?.length || 0,
        cookies: cookies, // Show actual cookie values for debugging
      });
      
      return {
        csrfToken,
        cookies,
      };
    } catch (error) {
      logger.error('Failed to fetch CSRF token', { 
        error,
        baseUrl: this.baseUrl,
        message: 'Please ensure BACKEND_BASE_URL is set correctly in your .env file'
      });
      if (error instanceof CsrfError) {
        throw error;
      }
      throw new CsrfError(`Failed to fetch CSRF token from ${this.baseUrl}. Please check your BACKEND_BASE_URL configuration.`);
    }
  }

  /**
   * Make GET request
   * Note: For requests that need CSRF token, pass it in config.headers['X-CSRF-Token']
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
    logger.info('API client destroyed');
  }
}
