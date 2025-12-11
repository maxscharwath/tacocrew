/**
 * Gigatacos Client
 * High-level client for interacting with www.gt-lausanne.ch backend API
 * @module gigatacos-client/client
 */

import { CsrfError } from './errors';
import { HttpClient } from './http-client';
import {extractCsrfTokenFromHtml, 
  type OrderSummary,
  parseCategorySummaryFromTacos,
  parseOrderSummary,
  parseTacoCard,
  parseTacoCards
} from './parsers';
import type {
  CartItemResponse,
  DessertFormData,
  DrinkFormData,
  ExtraFormData,
  GigatacosClientConfig,
  Logger,
  OrderSubmissionData,
  OrderSubmissionResponse,
  SessionContext,
  StockAvailability,
  StockAvailabilityBackend,
  Taco,
  TacoFormData,
} from './types';
import { noopLogger } from './utils/logger';

/**
 * Gigatacos Client
 * High-level client for interacting with www.gt-lausanne.ch backend API
 * Provides methods grouped by endpoint with built-in parsing
 * 
 * @example
 * ```typescript
 * const client = new GigatacosClient({
 *   baseUrl: 'https://www.gt-lausanne.ch',
 *   logger // optional
 * });
 * 
 * const session: SessionContext = {
 *   sessionId: '...',
 *   csrfToken: '...',
 *   cookies: { ... }
 * };
 * 
 * const summary = await client.getOrderSummary(session);
 * ```
 */
export class GigatacosClient {
  private readonly httpClient: HttpClient;
  private readonly logger: Logger;

  private readonly baseUrl: string;

  constructor(config: GigatacosClientConfig) {
    this.baseUrl = config.baseUrl;
    this.logger = config.logger ?? noopLogger;
    
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      logger: this.logger,
      proxy: config.proxy, // Pass proxy config object
    });
  }

  /**
   * Build request configuration from session context
   */
  private buildRequestConfig(
    session: SessionContext,
    headers?: Record<string, string>
  ): { csrfToken: string; cookies: Record<string, string>; headers?: Record<string, string> } {
    return {
      csrfToken: session.csrfToken,
      cookies: session.cookies,
      ...(headers && { headers }),
    };
  }

  // ============================================================================
  // os.php - Order Summary
  // ============================================================================

  /**
   * Get order summary with totals and delivery fees
   * Note: os.php requires POST with csrf_token in body, not GET
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async getOrderSummary(session: SessionContext): Promise<{ data: OrderSummary | null; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session, {
      Accept: 'text/html',
    });
    // os.php requires POST with csrf_token in body (not GET)
    const formData = {
      csrf_token: session.csrfToken,
    };
    const result = await this.httpClient.postForm<string>('/ajax/os.php', formData, config);

    const summary = parseOrderSummary(result.data, this.logger);
    if (summary) {
      this.logger.info('Order summary retrieved', {
        sessionId: session.sessionId,
        cartTotal: summary.cartTotal,
        deliveryFee: summary.deliveryFee,
        totalAmount: summary.totalAmount,
      });
    }
    return { data: summary, cookies: result.cookies };
  }

  // ============================================================================
  // owt.php - Taco Cart Operations
  // ============================================================================

  /**
   * Add a taco to cart
   * Returns the parsed taco card and updated cookies
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async addTacoToCart(
    session: SessionContext,
    formData: TacoFormData,
    tacoId: string,
    stockData?: StockAvailability
  ): Promise<{ data: Taco | null; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    const result = await this.httpClient.postForm<string>('/ajax/owt.php', formData, config);
    
    const taco = parseTacoCard(result.data, tacoId, stockData, this.logger);
    return { data: taco, cookies: result.cookies };
  }

  /**
   * Get all taco cards from cart
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async getTacoCards(
    session: SessionContext,
    stockData?: StockAvailability
  ): Promise<{ data: Taco[]; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    const result = await this.httpClient.postForm<string>('/ajax/owt.php', { loadProducts: true }, config);
    
    const tacos = parseCategorySummaryFromTacos(result.data, stockData, this.logger);
    return { data: tacos, cookies: result.cookies };
  }

  /**
   * Get taco cards with ID mapping
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async getTacoCardsWithMapping(
    session: SessionContext,
    mapping: Map<number, string>,
    stockData?: StockAvailability
  ): Promise<{ data: Taco[]; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    const result = await this.httpClient.postForm<string>('/ajax/owt.php', { loadProducts: true }, config);
    
    const tacos = parseTacoCards(result.data, mapping, stockData, this.logger);
    return { data: tacos, cookies: result.cookies };
  }

  // ============================================================================
  // ues.php - Extras
  // ============================================================================

  /**
   * Add an extra to cart
   * Backend expects JSON: { id, name, price, quantity, free_sauce?, free_sauces? }
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async addExtraToCart(session: SessionContext, extraData: ExtraFormData): Promise<{ data: CartItemResponse; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    // Backend expects id, name, price, quantity, and optionally free_sauce/free_sauces
    const payload: Record<string, unknown> = {
      id: extraData.id,
      name: extraData.name,
      price: extraData.price,
      quantity: extraData.quantity,
    };
    
    // Add free_sauce if provided (object format)
    if (extraData.free_sauce) {
      payload['free_sauce'] = extraData.free_sauce;
    }

    // Add free_sauces if provided (array format)
    if (extraData.free_sauces && extraData.free_sauces.length > 0) {
      payload['free_sauces'] = extraData.free_sauces;
    }
    
    const result = await this.httpClient.postJson<CartItemResponse>('/ajax/ues.php', payload, config);
    
    return { data: result.data, cookies: result.cookies };
  }

  // ============================================================================
  // ubs.php - Drinks
  // ============================================================================

  /**
   * Add a drink to cart
   * Backend expects JSON: { id, name, price, quantity }
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async addDrinkToCart(session: SessionContext, drinkData: DrinkFormData): Promise<{ data: CartItemResponse; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    // Backend expects id, name, price, quantity
    const payload = {
      id: drinkData.id,
      name: drinkData.name,
      price: drinkData.price,
      quantity: drinkData.quantity,
    };
    const result = await this.httpClient.postJson<CartItemResponse>('/ajax/ubs.php', payload, config);
    
    return { data: result.data, cookies: result.cookies };
  }

  // ============================================================================
  // usd.php - Desserts
  // ============================================================================

  /**
   * Add a dessert to cart
   * Note: usd.php endpoint returns 404 - may not exist. Verify with backend.
   * Backend expects JSON: { id, name, price, quantity } (if endpoint exists)
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async addDessertToCart(
    session: SessionContext,
    dessertData: DessertFormData
  ): Promise<{ data: CartItemResponse; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    // Backend expects id, name, price, quantity (if endpoint exists)
    const payload = {
      id: dessertData.id,
      name: dessertData.name,
      price: dessertData.price,
      quantity: dessertData.quantity,
    };
    const result = await this.httpClient.postJson<CartItemResponse>('/ajax/usd.php', payload, config);
    
    return { data: result.data, cookies: result.cookies };
  }

  // ============================================================================
  // RocknRoll.php - Order Submission
  // ============================================================================

  /**
   * Submit order to backend
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async submitOrder(
    session: SessionContext,
    orderData: OrderSubmissionData
  ): Promise<{ data: OrderSubmissionResponse; cookies: Record<string, string> }> {
    const config = this.buildRequestConfig(session);
    const result = await this.httpClient.postFormData<OrderSubmissionResponse>('/ajax/RocknRoll.php', orderData, config);
    
    return { data: result.data, cookies: result.cookies };
  }

  // ============================================================================
  // CSRF Token Management
  // ============================================================================

  /**
   * Create a new session context (creates new session - visits homepage first)
   * Use this when you need a completely new session for a new cart
   * @returns New SessionContext with fresh csrfToken and cookies
   * @throws {CsrfError} If CSRF token cannot be fetched
   */
  async createNewSession(): Promise<SessionContext> {
    try {
      // First, visit homepage to initialize PHP session properly
      this.logger.debug('Initializing session by visiting homepage', { baseUrl: this.baseUrl });
      const homeResult = await this.httpClient.get<string>('/', {
        csrfToken: '', // Not needed for homepage
        headers: {},
      });

      // Cookies are already extracted by httpClient
      const homeCookies = homeResult.cookies;

      this.logger.debug('Homepage visited', {
        status: 200, // If we got here, it was successful
        cookieCount: Object.keys(homeCookies).length,
        cookieNames: Object.keys(homeCookies),
      });

      // Now fetch the HTML page containing the CSRF token
      const csrfResult = await this.requestCsrfPage(homeCookies);

      // Extract CSRF token from HTML
      const csrfToken = extractCsrfTokenFromHtml(csrfResult.data, this.logger);
      if (!csrfToken) {
        throw new CsrfError();
      }

      // Merge cookies from both requests
      const cookies: Record<string, string> = { ...homeCookies, ...csrfResult.cookies };

      this.logger.info('New session created successfully', {
        tokenLength: csrfToken.length,
        cookieCount: Object.keys(cookies).length,
        cookies: cookies, // Log all cookies for debugging
        csrfToken: csrfToken, // Log token for debugging
      });

      // Generate a temporary session ID (caller should provide their own)
      const tempSessionId = `temp-${Date.now()}`;

      return {
        sessionId: tempSessionId,
        csrfToken,
        cookies,
      };
    } catch (error) {
      this.logger.error('Failed to create new session', {
        error,
        baseUrl: this.baseUrl,
      });
      if (error instanceof CsrfError) {
        throw error;
      }
      throw new CsrfError();
    }
  }

  /**
   * Refresh CSRF token for an existing session
   * If sessionContext is provided, uses its cookies. Otherwise creates a new session.
   * @param sessionContext Optional existing session context to refresh token for
   * @returns Updated SessionContext with fresh csrfToken and cookies
   * @throws {CsrfError} If CSRF token cannot be fetched
   */
  async refreshCsrfToken(
    sessionContext?: SessionContext
  ): Promise<SessionContext> {
    // If no session context provided, create a new one
    if (!sessionContext) {
      return await this.createNewSession();
    }

    // Refresh token for existing session
    return await this.refreshCsrfTokenWithCookies(sessionContext.cookies);
  }

  /**
   * Refresh CSRF token using existing cookies (for existing sessions)
   * This maintains the session by using stored cookies
   * @param cookies Existing cookies to use for the request
   * @returns SessionContext with csrfToken and updated cookies (sessionId will be empty string - caller should provide)
   * @throws {CsrfError} If CSRF token cannot be fetched
   */
  async refreshCsrfTokenWithCookies(
    cookies: Record<string, string>
  ): Promise<SessionContext> {
    try {
      this.logger.debug('Refreshing CSRF token - visiting homepage first to reinitialize session', {
        baseUrl: this.baseUrl,
        cookieCount: Object.keys(cookies).length,
      });

      // First, visit homepage to reinitialize PHP session properly
      const homeResult = await this.httpClient.get<string>('/', {
        csrfToken: '', // Not needed for homepage
        cookies,
        headers: {},
      });

      // Merge cookies from homepage
      const updatedCookies = { ...cookies, ...homeResult.cookies };

      this.logger.debug('Homepage visited, fetching CSRF token page', {
        status: 200,
        cookieCount: Object.keys(updatedCookies).length,
      });

      // Fetch the HTML page containing the CSRF token with updated cookies
      const csrfResult = await this.requestCsrfPage(updatedCookies);

      // Extract CSRF token from HTML
      const csrfToken = extractCsrfTokenFromHtml(csrfResult.data, this.logger);
      if (!csrfToken) {
        throw new CsrfError();
      }

      // Merge all cookies
      const finalCookies = { ...updatedCookies, ...csrfResult.cookies };

      this.logger.info('CSRF token refreshed with existing cookies', {
        tokenLength: csrfToken.length,
        cookieCount: Object.keys(finalCookies).length,
        csrfToken: csrfToken, // Log actual token for debugging
      });

      // Return SessionContext with empty sessionId (caller should provide their own)
      return {
        sessionId: '',
        csrfToken,
        cookies: finalCookies,
      };
    } catch (error) {
      this.logger.error('Failed to refresh CSRF token with cookies', {
        error,
        baseUrl: this.baseUrl,
      });
      if (error instanceof CsrfError) {
        throw error;
      }
      throw new CsrfError();
    }
  }

  /**
   * Request CSRF page with fallback URLs
   */
  private async requestCsrfPage(cookies: Record<string, string>): Promise<{ data: string; cookies: Record<string, string> }> {
    const csrfPath = '/index.php?content=livraison';

    try {
      return await this.httpClient.get<string>(csrfPath, {
        csrfToken: '', // Not needed yet
        cookies,
        headers: {},
      });
    } catch (error) {
      this.logger.error('Failed to fetch CSRF page', { error });
      throw error instanceof Error ? error : new CsrfError();
    }
  }

  // ============================================================================
  // Stock Management
  // ============================================================================

  /**
   * Get stock availability from backend
   * Requires a CSRF token (can be obtained via refreshCsrfToken)
   * @param csrfToken CSRF token for authentication
   * @param cookies Optional cookies to include in the request
   * @returns Stock availability data
   * @throws {CsrfError} If CSRF token is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {NetworkError} If network request fails
   */
  async getStock(
    csrfToken: string,
    cookies?: Record<string, string>
  ): Promise<StockAvailabilityBackend> {
    const config: { csrfToken: string; cookies?: Record<string, string>; headers?: Record<string, string> } = {
      csrfToken,
      ...(cookies && { cookies }),
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    };
    const result = await this.httpClient.get<StockAvailabilityBackend>(
      '/office/stock_management.php?type=all',
      config
    );
    
    return result.data;
  }
}
