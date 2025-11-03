/**
 * HTTP Service - Provides configured Axios instance
 * @module services/http
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { injectable } from 'tsyringe';
import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * HTTP Service
 * Provides pre-configured Axios instances for API clients
 */
@injectable()
export class HttpService {
  /**
   * Create a configured Axios instance
   */
  createInstance(baseUrl?: string, customConfig?: AxiosRequestConfig): AxiosInstance {
    const instance = axios.create({
      baseURL: baseUrl || config.backend.baseUrl,
      timeout: config.backend.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...customConfig?.headers,
      },
      ...customConfig,
    });

    // Add default logging interceptors
    this.addLoggingInterceptors(instance);

    return instance;
  }

  /**
   * Add default logging interceptors to an Axios instance
   */
  private addLoggingInterceptors(instance: AxiosInstance): void {
    instance.interceptors.request.use(
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

    instance.interceptors.response.use(
      (response) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: Error) => {
        // Error handling is done by individual clients
        return Promise.reject(error);
      }
    );
  }
}
