/**
 * HTTP service for creating axios instances
 * @module common/api/http.service
 */

/**
 * HTTP service for creating axios instances
 * @module common/api/http.service
 */

import axios, { AxiosInstance, type AxiosRequestConfig } from 'axios';
import { injectable } from 'tsyringe';

/**
 * HTTP Service for creating configured axios instances
 */
@injectable()
export class HttpService {
  /**
   * Create a new axios instance with default configuration
   */
  createInstance(config?: AxiosRequestConfig): AxiosInstance {
    return axios.create(config);
  }
}
