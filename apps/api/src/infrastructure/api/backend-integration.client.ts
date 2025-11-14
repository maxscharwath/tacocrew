/**
 * Backend Integration Adapter
 * Adapts the new @tacobot/gigatacos-client package to work with the existing app
 * Handles CSRF token management and automatic regeneration
 * @module infrastructure/backend-client/adapter
 */

import {
  type CartItemResponse,
  CsrfError,
  type DessertFormData,
  type DrinkFormData,
  type ExtraFormData,
  GigatacosClient,
  type OrderSubmissionData,
  type OrderSubmissionResponse,
  type OrderSummary,
  type SessionContext,
  type StockAvailability,
  type StockAvailabilityBackend,
  type Taco,
  type TacoFormData,
} from '@tacobot/gigatacos-client';
import { injectable } from 'tsyringe';
import type { SessionId } from '../../schemas/session.schema';
import { SessionService } from '../../services/session/session.service';
import { config } from '../../shared/config/app.config';
import { injectLazy } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';

export type { OrderSummary } from '@tacobot/gigatacos-client';

/**
 * Adapter that wraps the new gigatacos-client package
 * Provides automatic CSRF token regeneration on errors
 */
@injectable()
export class BackendIntegrationClient {
  private readonly client: GigatacosClient;
  private readonly sessionService = injectLazy(SessionService);

  constructor() {
    this.client = new GigatacosClient({
      baseUrl: config.backend.baseUrl,
      logger,
    });
  }

  /**
   * Get or create session context from session ID
   */
  private async getSessionContext(sessionId: SessionId): Promise<SessionContext> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Ensure we have a CSRF token
    let csrfToken = session.csrfToken;
    if (!csrfToken) {
      // Refresh token for existing session
      const sessionContext: SessionContext = {
        sessionId,
        csrfToken: '',
        cookies: session.cookies,
      };
      const refreshed = await this.client.refreshCsrfToken(sessionContext);
      csrfToken = refreshed.csrfToken;
      await this.sessionService.updateSessionCookies(sessionId, refreshed.cookies);
      await this.sessionService.updateSessionCsrfToken(sessionId, refreshed.csrfToken);
    }

    return {
      sessionId,
      csrfToken,
      cookies: session.cookies,
    };
  }

  /**
   * Update session with new cookies and CSRF token
   */
  private async updateSession(
    sessionId: SessionId,
    cookies: Record<string, string>,
    csrfToken?: string
  ): Promise<void> {
    await this.sessionService.updateSessionCookies(sessionId, cookies);
    if (csrfToken) {
      await this.sessionService.updateSessionCsrfToken(sessionId, csrfToken);
    }
  }

  /**
   * Execute request with automatic CSRF token regeneration on error
   * Always gets a fresh session context before each operation
   * Updates session cookies after successful operations
   */
  private async executeWithRetry<T>(
    sessionId: SessionId,
    operation: (context: SessionContext) => Promise<{ data: T; cookies: Record<string, string> }>,
    retries = 1
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const context = await this.getSessionContext(sessionId);

      try {
        const result = await operation(context);

        // Update session cookies after successful operation
        if (Object.keys(result.cookies).length > 0) {
          await this.updateSession(sessionId, {
            ...context.cookies,
            ...result.cookies,
          });
        }

        return result.data;
      } catch (error) {
        if (error instanceof CsrfError && attempt < retries) {
          logger.warn('CSRF error detected, regenerating token and retrying', {
            sessionId,
            attempt: attempt + 1,
            maxRetries: retries,
          });

          // Regenerate CSRF token and update session
          const refreshed = await this.client.refreshCsrfToken(context);
          await this.updateSession(
            sessionId,
            {
              ...context.cookies,
              ...refreshed.cookies,
            },
            refreshed.csrfToken
          );

          continue;
        }

        throw error;
      }
    }

    throw new Error('Max retries reached');
  }

  /**
   * Get order summary with totals and delivery fees
   */
  async getOrderSummary(sessionId: SessionId): Promise<OrderSummary | null> {
    return await this.executeWithRetry(
      sessionId,
      (context) => this.client.getOrderSummary(context),
      1
    );
  }

  /**
   * Add a taco to cart
   * Returns the parsed taco object
   */
  async addTacoToCart(
    sessionId: SessionId,
    formData: TacoFormData,
    tacoId: string,
    stockData?: StockAvailability
  ): Promise<Taco | null> {
    return await this.executeWithRetry(
      sessionId,
      (context) => this.client.addTacoToCart(context, formData, tacoId, stockData),
      2
    );
  }

  /**
   * Get all taco cards from cart
   */
  async getTacoCards(sessionId: SessionId, stockData?: StockAvailability): Promise<Taco[]> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.getTacoCards(context, stockData)
    );
  }

  /**
   * Get taco cards with ID mapping
   */
  async getTacoCardsWithMapping(
    sessionId: SessionId,
    mapping: Map<number, string>,
    stockData?: StockAvailability
  ): Promise<Taco[]> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.getTacoCardsWithMapping(context, mapping, stockData)
    );
  }

  /**
   * Add an extra to cart
   */
  async addExtraToCart(sessionId: SessionId, extraData: ExtraFormData): Promise<CartItemResponse> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.addExtraToCart(context, extraData)
    );
  }

  /**
   * Add a drink to cart
   */
  async addDrinkToCart(sessionId: SessionId, drinkData: DrinkFormData): Promise<CartItemResponse> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.addDrinkToCart(context, drinkData)
    );
  }

  /**
   * Add a dessert to cart
   */
  async addDessertToCart(
    sessionId: SessionId,
    dessertData: DessertFormData
  ): Promise<CartItemResponse> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.addDessertToCart(context, dessertData)
    );
  }

  /**
   * Submit order to backend
   */
  async submitOrder(
    sessionId: SessionId,
    orderData: OrderSubmissionData
  ): Promise<OrderSubmissionResponse> {
    return await this.executeWithRetry(sessionId, (context) =>
      this.client.submitOrder(context, orderData)
    );
  }

  /**
   * Get stock availability from backend
   */
  async getStock(
    csrfToken: string,
    cookies?: Record<string, string>
  ): Promise<StockAvailabilityBackend> {
    return await this.client.getStock(csrfToken, cookies);
  }

  /**
   * Create a new session context (creates new session - visits homepage first)
   */
  async createNewSession(): Promise<SessionContext> {
    return await this.client.createNewSession();
  }

  /**
   * Refresh CSRF token for an existing session
   * If sessionContext is provided, uses its cookies. Otherwise creates a new session.
   */
  async refreshCsrfToken(sessionContext?: SessionContext): Promise<SessionContext> {
    return await this.client.refreshCsrfToken(sessionContext);
  }

  /**
   * Refresh CSRF token with existing cookies
   */
  async refreshCsrfTokenWithCookies(cookies: Record<string, string>): Promise<SessionContext> {
    return await this.client.refreshCsrfTokenWithCookies(cookies);
  }
}
