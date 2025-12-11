/**
 * HTTP Client for backend API requests
 * @module gigatacos-client/http-client
 */

import axios, { AxiosError, AxiosInstance, type AxiosRequestConfig, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { getAjaxHeaders, getRealisticBrowserHeaders } from './browser-headers';
import { CsrfError, isCsrfError, isRateLimitError, NetworkError, RateLimitError } from './errors';
import type { HttpClientConfig, Logger, ProxyConfig } from './types';
import { noopLogger } from './utils/logger';

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
  private readonly cookieJar: CookieJar;

  constructor(config: HttpClientConfig) {
    // Normalize baseUrl to remove trailing slash
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.logger = config.logger ?? noopLogger;
    this.proxyConfig = config.proxy;
    this.cookieJar = new CookieJar();

    // Create axios instance with cookie jar support
    // jar property is added by axios-cookiejar-support
    const instance = axios.create({
      baseURL: this.getAxiosBaseUrl(),
      headers: {
        ...getRealisticBrowserHeaders(),
        ...this.buildProxyHeaders(),
      },
      jar: this.cookieJar,
      withCredentials: true,
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
    } as AxiosRequestConfig & { jar: CookieJar });

    this.axiosInstance = wrapper(instance);
    this.setupErrorInterceptor();
  }

  /**
   * Get the base URL for axios requests
   * Uses proxy URL if configured, otherwise uses original baseUrl
   */
  private getAxiosBaseUrl(): string {
    const url = this.proxyConfig?.url || this.baseUrl;
    // Ensure no trailing slash for axios baseURL
    return url.endsWith('/') ? url.slice(0, -1) : url;
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
    // Normalize baseUrl to remove trailing slash for Origin
    const normalizedBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;

    // Get AJAX headers for form submissions (includes realistic browser headers)
    const ajaxHeaders = getAjaxHeaders(`${normalizedBaseUrl}/index.php?content=livraison`);

    const headers: Record<string, string> = {
      ...ajaxHeaders,
      'X-CSRF-Token': config.csrfToken,
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

    // For GET requests with cookies (subsequent navigation), update Sec-Fetch-Site
    const normalizedBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const hasCookies = config.cookies && Object.keys(config.cookies).length > 0;

    const headers: Record<string, string> = {
      'X-CSRF-Token': config.csrfToken,
      ...config.headers,
    };

    // If we have cookies, this is a same-origin navigation, not initial load
    if (hasCookies && config.cookies) {
      headers['Referer'] = `${normalizedBaseUrl}/`;
      headers['Sec-Fetch-Site'] = 'same-origin';
      headers['Cookie'] = Object.entries(config.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    const response = await this.axiosInstance.get<T>(path, { headers });
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

    // Build headers with AJAX-specific headers for form submissions
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
