/**
 * HTTP Client for backend API requests
 * @module gigatacos-client/http-client
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { HttpClientConfig, Logger, ProxyConfig } from './types';
import { noopLogger } from './utils/logger';
import { CsrfError, RateLimitError, NetworkError, isCsrfError, isRateLimitError } from './errors';

/**
 * Request configuration
 */
export interface RequestConfig {
  csrfToken: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * HTTP Client for making requests to the backend API
 * Requires CSRF token and cookies to be provided explicitly
 */
export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string; // Original backend URL
  private readonly logger: Logger;
  private readonly proxyConfig?: ProxyConfig;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.logger = config.logger ?? noopLogger;
    this.proxyConfig = config.proxy;

    this.axiosInstance = axios.create({
      baseURL: this.getAxiosBaseUrl(),
      headers: this.buildProxyHeaders(),
    });

    this.setupErrorInterceptor();
  }

  /**
   * Get the base URL for axios requests
   * Uses proxy URL if configured, otherwise uses original baseUrl
   */
  private getAxiosBaseUrl(): string {
    return this.proxyConfig?.url || this.baseUrl;
  }

  /**
   * Build proxy headers if proxy is configured
   */
  private buildProxyHeaders(): Record<string, string> | undefined {
    if (!this.proxyConfig) {
      return undefined;
    }

    const headers: Record<string, string> = {
      'X-Target-URL': this.baseUrl, // Use baseUrl as target URL
    };

    if (this.proxyConfig.apiKey) {
      headers['X-API-Key'] = this.proxyConfig.apiKey;
    }

    return headers;
  }


  /**
   * Setup error handling interceptor
   */
  private setupErrorInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          return this.handleResponseError(error);
        }
        if (error.request) {
          return this.handleNetworkError(error);
        }
        return this.handleRequestError(error);
      }
    );
  }

  /**
   * Handle HTTP response errors
   */
  private handleResponseError(error: AxiosError): never {
    const { response, config } = error;
    const errorContext = {
      status: response!.status,
      statusText: response!.statusText,
      url: config?.url,
      method: config?.method,
    };

    if (isCsrfError(error)) {
      this.logger.error('CSRF error detected', {
        ...errorContext,
        responseData: response!.data,
        responseHeaders: response!.headers,
        requestData: config?.data,
        requestHeaders: config?.headers,
      });
      throw new CsrfError();
    }

    if (isRateLimitError(error)) {
      this.logger.error('Rate limit error detected', errorContext);
      throw new RateLimitError();
    }

    this.logger.error('HTTP request failed', {
      ...errorContext,
      responseData: response!.data,
      responseHeaders: response!.headers,
      requestData: config?.data,
      requestHeaders: config?.headers,
    });
    throw error;
  }

  /**
   * Handle network errors (no response received)
   */
  private handleNetworkError(error: AxiosError): never {
    this.logger.error('Network error - no response received', {
      url: error.config?.url,
      method: error.config?.method,
    });
    throw new NetworkError(error.message || 'Network request failed');
  }

  /**
   * Handle request setup errors
   */
  private handleRequestError(error: AxiosError): never {
    this.logger.error('Request setup error', {
      message: error.message,
    });
    throw error;
  }

  /**
   * Build request headers with CSRF token and cookies
   */
  private buildHeaders(config: RequestConfig, additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'X-CSRF-Token': config.csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': this.baseUrl + '/',
      'Origin': this.baseUrl,
      ...additionalHeaders,
      ...config.headers,
    };

    if (config.cookies && Object.keys(config.cookies).length > 0) {
      headers['Cookie'] = Object.entries(config.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    return headers;
  }

  /**
   * Parse Set-Cookie headers from response
   */
  private parseCookies(setCookieHeaders: string[] | undefined): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!setCookieHeaders) return cookies;

    for (const cookie of setCookieHeaders) {
      const [nameValue] = cookie.split(';');
      const [name, value] = (nameValue || '').split('=');
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    }

    return cookies;
  }

  /**
   * Extract response data and cookies
   */
  private extractResponse<T>(response: AxiosResponse<T>): { data: T; cookies: Record<string, string> } {
    return {
      data: response.data,
      cookies: this.parseCookies(response.headers['set-cookie']),
    };
  }

  /**
   * Append data to form (URLSearchParams or FormData)
   */
  private appendFormData(
    form: URLSearchParams | FormData,
    data: Record<string, unknown>
  ): void {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          form.append(key, String(item));
        }
      } else {
        form.append(key, String(value));
      }
    }
  }

  /**
   * Convert data to URL-encoded form string
   */
  private toFormData(data: Record<string, unknown>, csrfToken: string): string {
    const formData = new URLSearchParams();
    this.appendFormData(formData, data);
    formData.append('csrf_token', csrfToken);
    return formData.toString();
  }

  /**
   * Convert data to FormData object
   */
  private toFormDataObject(data: Record<string, unknown>, csrfToken: string): FormData {
    const formData = new FormData();
    this.appendFormData(formData, data);
    formData.append('csrf_token', csrfToken);
    return formData;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, config: RequestConfig): Promise<{ data: T; cookies: Record<string, string> }> {
    this.logRequest('GET', path, config);
    const response = await this.axiosInstance.get<T>(path, {
      headers: this.buildHeaders(config),
    });
    return this.extractResponse(response);
  }

  /**
   * Make a POST request with form data (application/x-www-form-urlencoded)
   */
  async postForm<T>(
    path: string,
    data: Record<string, unknown>,
    config: RequestConfig
  ): Promise<{ data: T; cookies: Record<string, string> }> {
    const formDataString = this.toFormData(data, config.csrfToken);
    const headers = this.buildHeaders(config, {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    });

    this.logger.debug('HTTP POST form request', {
      url: `${this.baseUrl}${path}`,
      hasCookies: !!config.cookies && Object.keys(config.cookies).length > 0,
      dataKeys: Object.keys(data),
      formDataLength: formDataString.length,
    });

    const response = await this.axiosInstance.post<T>(path, formDataString, { headers });
    return this.extractResponse(response);
  }

  /**
   * Make a POST request with JSON body
   */
  async postJson<T>(
    path: string,
    data: Record<string, unknown>,
    config: RequestConfig
  ): Promise<{ data: T; cookies: Record<string, string> }> {
    this.logRequest('POST', path, config, Object.keys(data));
    const response = await this.axiosInstance.post<T>(path, data, {
      headers: this.buildHeaders(config, {
        'Content-Type': 'application/json',
      }),
    });
    return this.extractResponse(response);
  }

  /**
   * Make a POST request with FormData (multipart/form-data)
   */
  async postFormData<T>(
    path: string,
    data: Record<string, unknown>,
    config: RequestConfig
  ): Promise<{ data: T; cookies: Record<string, string> }> {
    this.logRequest('POST', path, config);
    const response = await this.axiosInstance.post<T>(
      path,
      this.toFormDataObject(data, config.csrfToken),
      { headers: this.buildHeaders(config) }
    );
    return this.extractResponse(response);
  }

  /**
   * Log HTTP request for debugging
   */
  private logRequest(method: string, path: string, config: RequestConfig, dataKeys?: string[]): void {
    this.logger.debug(`HTTP ${method} request`, {
      url: `${this.baseUrl}${path}`,
      hasCookies: !!config.cookies && Object.keys(config.cookies).length > 0,
      ...(dataKeys && { dataKeys }),
    });
  }
}
