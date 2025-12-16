# Gigatacos Client Package Coding Guidelines

> **Package**: @tacocrew/gigatacos-client
> **Purpose**: Type-safe client for external taco ordering API
> **Framework**: TypeScript + Axios + Cheerio

## Table of Contents

- [Package Purpose](#package-purpose)
- [Client Architecture](#client-architecture)
- [Type Safety](#type-safety)
- [Error Handling](#error-handling)
- [HTTP Client Patterns](#http-client-patterns)
- [HTML Parsing](#html-parsing)
- [Testing Guidelines](#testing-guidelines)
- [Code Review Checklist](#code-review-checklist)

---

## Package Purpose

The Gigatacos Client package provides a **type-safe wrapper** around the external taco ordering backend API (gt-lausanne.ch).

**Responsibilities**:
- ✅ HTTP client with cookie management (session handling)
- ✅ HTML parsing and data extraction (web scraping)
- ✅ Type-safe API methods
- ✅ Error handling and recovery
- ✅ Response parsing and validation

**Who uses Gigatacos Client?**
- `apps/api` - Backend API integrates with external service
- Future services that need to interact with the taco ordering backend

**Design Principles**:
- **Type-safe**: All responses properly typed
- **Resilient**: Robust error handling
- **Stateful**: Cookie-based session management
- **Tested**: Comprehensive test coverage
- **Isolated**: No direct dependencies on app code

---

## Client Architecture

### HTTP Client with Cookie Management

**✅ DO** use axios with cookie jar:

```typescript
// http-client.ts
import axios, { type AxiosInstance } from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly cookieJar: CookieJar;

  constructor(baseURL: string) {
    this.cookieJar = new CookieJar();

    this.client = wrapper(
      axios.create({
        baseURL,
        timeout: 10000,
        jar: this.cookieJar,
        withCredentials: true,
        headers: {
          'User-Agent': 'TacoCrew/1.0',
        },
      })
    );
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // Cookie management
  getCookies(url: string): Promise<string> {
    return this.cookieJar.getCookieString(url);
  }

  async setCookie(cookie: string, url: string): Promise<void> {
    await this.cookieJar.setCookie(cookie, url);
  }
}
```

**Why cookie jar?**
- ✅ Maintains session state across requests
- ✅ Automatic cookie handling
- ✅ Mimics browser behavior for scraping

### Main Client Class

**✅ DO** organize API methods by domain:

```typescript
// client.ts
import { HttpClient } from './http-client';
import type { Menu, Order, OrderSubmission, Session } from './types';
import { parseMenuPage, parseOrderPage } from './parsers';

export class BackendClient {
  private readonly http: HttpClient;
  private session: Session | null = null;

  constructor(baseURL: string) {
    this.http = new HttpClient(baseURL);
  }

  // Authentication
  async login(email: string, password: string): Promise<Session> {
    const html = await this.http.post<string>('/login', { email, password });
    const session = parseSessionFromHtml(html);
    this.session = session;
    return session;
  }

  async logout(): Promise<void> {
    await this.http.post('/logout');
    this.session = null;
  }

  // Menu operations
  async getMenu(): Promise<Menu> {
    const html = await this.http.get<string>('/menu');
    return parseMenuPage(html);
  }

  async getAvailableTacos(): Promise<Taco[]> {
    const menu = await this.getMenu();
    return menu.tacos.filter((taco) => taco.available);
  }

  // Order operations
  async getActiveOrders(): Promise<Order[]> {
    const html = await this.http.get<string>('/orders');
    return parseOrderPage(html);
  }

  async submitOrder(order: OrderSubmission): Promise<Order> {
    const formData = this.buildOrderFormData(order);
    const html = await this.http.post<string>('/orders', formData);
    return parseOrderConfirmation(html);
  }

  // Session management
  isAuthenticated(): boolean {
    return this.session !== null;
  }

  getSession(): Session | null {
    return this.session;
  }

  private buildOrderFormData(order: OrderSubmission): FormData {
    const formData = new FormData();
    formData.append('size', order.size);
    order.meats.forEach((meat) => formData.append('meats[]', meat));
    order.sauces.forEach((sauce) => formData.append('sauces[]', sauce));
    return formData;
  }
}
```

---

## Type Safety

### Response Typing

**✅ DO** define types for all API responses:

```typescript
// types.ts

// Domain entities
export type TacoSize = 'small' | 'medium' | 'large';

export type Meat = {
  readonly id: string;
  readonly name: string;
  readonly available: boolean;
  readonly price: number;
};

export type Sauce = {
  readonly id: string;
  readonly name: string;
  readonly spicyLevel: number;
};

export type Taco = {
  readonly id: string;
  readonly name: string;
  readonly size: TacoSize;
  readonly meats: readonly Meat[];
  readonly sauces: readonly Sauce[];
  readonly price: number;
  readonly available: boolean;
};

export type Menu = {
  readonly tacos: readonly Taco[];
  readonly meats: readonly Meat[];
  readonly sauces: readonly Sauce[];
  readonly extras: readonly Extra[];
  readonly updatedAt: Date;
};

export type Order = {
  readonly id: string;
  readonly userId: string;
  readonly items: readonly OrderItem[];
  readonly total: number;
  readonly status: OrderStatus;
  readonly createdAt: Date;
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';

export type OrderItem = {
  readonly tacoId: string;
  readonly quantity: number;
  readonly customizations: readonly string[];
};

// Request types
export type OrderSubmission = {
  readonly size: TacoSize;
  readonly meats: readonly string[];
  readonly sauces: readonly string[];
  readonly garnitures: readonly string[];
  readonly note?: string;
};

// Session type
export type Session = {
  readonly userId: string;
  readonly email: string;
  readonly expiresAt: Date;
};
```

### Parser Functions

**✅ DO** create typed parser functions:

```typescript
// parsers/menu.parser.ts
import * as cheerio from 'cheerio';
import type { Menu, Taco, Meat } from '../types';

export function parseMenuPage(html: string): Menu {
  const $ = cheerio.load(html);

  const tacos = parseTacos($);
  const meats = parseMeats($);
  const sauces = parseSauces($);
  const extras = parseExtras($);

  return {
    tacos,
    meats,
    sauces,
    extras,
    updatedAt: new Date(),
  };
}

function parseTacos($: cheerio.CheerioAPI): Taco[] {
  const tacos: Taco[] = [];

  $('.taco-item').each((_, element) => {
    const $el = $(element);

    const id = $el.attr('data-id');
    const name = $el.find('.taco-name').text().trim();
    const priceText = $el.find('.taco-price').text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    const available = !$el.hasClass('unavailable');

    if (!id || !name) {
      throw new ParserError('Missing required taco fields');
    }

    tacos.push({
      id,
      name,
      size: 'medium', // Default
      meats: [],
      sauces: [],
      price,
      available,
    });
  });

  return tacos;
}

function parseMeats($: cheerio.CheerioAPI): Meat[] {
  const meats: Meat[] = [];

  $('.meat-option').each((_, element) => {
    const $el = $(element);

    meats.push({
      id: $el.attr('data-id') ?? '',
      name: $el.find('.meat-name').text().trim(),
      available: !$el.hasClass('out-of-stock'),
      price: parseFloat($el.attr('data-price') ?? '0'),
    });
  });

  return meats;
}
```

### Type Guards

**✅ DO** create type guards for runtime validation:

```typescript
// types.ts

export function isTacoSize(value: unknown): value is TacoSize {
  return typeof value === 'string' && ['small', 'medium', 'large'].includes(value);
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === 'string' &&
    ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(value)
  );
}

export function isMenu(value: unknown): value is Menu {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.tacos) &&
    Array.isArray(obj.meats) &&
    Array.isArray(obj.sauces) &&
    obj.updatedAt instanceof Date
  );
}
```

---

## Error Handling

### Custom Error Classes

**✅ DO** create domain-specific error classes:

```typescript
// errors.ts

export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

export class AuthenticationError extends ClientError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends ClientError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ParserError extends ClientError {
  constructor(
    message: string,
    public readonly html?: string
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

export class ValidationError extends ClientError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class OutOfStockError extends ClientError {
  constructor(
    public readonly itemId: string,
    public readonly itemName: string
  ) {
    super(`Item "${itemName}" is out of stock`);
    this.name = 'OutOfStockError';
  }
}
```

### Error Handling in Client

**✅ DO** catch and wrap errors appropriately:

```typescript
// client.ts
class BackendClient {
  async getMenu (): Promise<Menu> {
    try {
      const html = await this.http.get<string>('/menu');
      return parseMenuPage(html);
    } catch (error) {
      if (error instanceof ParserError) {
        // Log parser errors with context
        console.error('Failed to parse menu:', error.message);
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new NetworkError(
          'Failed to fetch menu',
          error.response?.status,
          error
        );
      }

      throw new ClientError(`Unexpected error: ${error}`);
    }
  }

  async submitOrder (order: OrderSubmission): Promise<Order> {
    // Pre-validation
    this.validateOrderSubmission(order);

    try {
      const formData = this.buildOrderFormData(order);
      const html = await this.http.post<string>('/orders', formData);
      return parseOrderConfirmation(html);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        // Handle specific HTTP errors
        if (status === 401) {
          throw new AuthenticationError('Session expired');
        }

        if (status === 400) {
          throw new ValidationError('Invalid order data');
        }

        if (status === 409) {
          // Parse which item is out of stock
          const itemName = parseOutOfStockItem(error.response?.data);
          throw new OutOfStockError('unknown', itemName);
        }

        throw new NetworkError('Failed to submit order', status, error);
      }

      throw error;
    }
  }

  private validateOrderSubmission (order: OrderSubmission): void {
    if (!isTacoSize(order.size)) {
      throw new ValidationError('Invalid taco size', 'size');
    }

    if (order.meats.length === 0) {
      throw new ValidationError('At least one meat is required', 'meats');
    }

    if (order.meats.length > 3) {
      throw new ValidationError('Maximum 3 meats allowed', 'meats');
    }

    if (order.sauces.length === 0) {
      throw new ValidationError('At least one sauce is required', 'sauces');
    }
  }
}
```

### Retry Strategies

**✅ DO** implement retry logic for network errors:

```typescript
// http-client.ts

export class HttpClient {
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.requestWithRetry(() => this.client.get<T>(url), options);
  }

  private async requestWithRetry<T>(
    request: () => Promise<AxiosResponse<T>>,
    options: RequestOptions
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await request();
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status) {
          const status = error.response.status;
          if (status >= 400 && status < 500) {
            throw error;
          }
        }

        if (isLastAttempt) {
          throw error;
        }

        // Wait before retrying
        await this.sleep(retryDelay * Math.pow(2, attempt));
      }
    }

    throw new NetworkError('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

type RequestOptions = {
  readonly maxRetries?: number;
  readonly retryDelay?: number;
};
```

---

## HTTP Client Patterns

### Request Configuration

**✅ DO** configure requests with proper headers and timeouts:

```typescript
export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, options: ClientOptions = {}) {
    this.client = axios.create({
      baseURL,
      timeout: options.timeout ?? 10000,
      headers: {
        'User-Agent': 'TacoCrew/1.0',
        'Accept': 'text/html,application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers,
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.debug(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.debug(`[HTTP] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          console.error(
            `[HTTP] ${error.response?.status ?? 'ERROR'} ${error.config?.url}`
          );
        }
        return Promise.reject(error);
      }
    );
  }
}

type ClientOptions = {
  readonly timeout?: number;
  readonly headers?: Record<string, string>;
};
```

### Session Management

**✅ DO** handle session state properly:

```typescript
export class BackendClient {
  private session: Session | null = null;

  async ensureAuthenticated(): Promise<void> {
    if (!this.session || this.isSessionExpired()) {
      throw new AuthenticationError('Session expired. Please login again.');
    }
  }

  private isSessionExpired(): boolean {
    if (!this.session) return true;
    return new Date() > this.session.expiresAt;
  }

  async getMenu(): Promise<Menu> {
    await this.ensureAuthenticated();
    // Fetch menu...
  }
}
```

---

## HTML Parsing

### Cheerio Parsing Patterns

**✅ DO** use defensive parsing with fallbacks:

```typescript
import * as cheerio from 'cheerio';

export function parseMenuPage(html: string): Menu {
  const $ = cheerio.load(html);

  // Check for error page
  if ($('.error-message').length > 0) {
    throw new ParserError('Server returned error page');
  }

  // Parse with fallbacks
  const tacos = parseTacos($);
  const meats = parseMeats($);
  const sauces = parseSauces($);

  if (tacos.length === 0) {
    throw new ParserError('No tacos found on menu page');
  }

  return { tacos, meats, sauces, updatedAt: new Date() };
}

function parseTacos($: cheerio.CheerioAPI): Taco[] {
  const tacos: Taco[] = [];

  $('.taco-item').each((_, element) => {
    try {
      const taco = parseTacoElement($, $(element));
      tacos.push(taco);
    } catch (error) {
      // Log but continue parsing other tacos
      console.warn('Failed to parse taco element:', error);
    }
  });

  return tacos;
}

function parseTacoElement($: cheerio.CheerioAPI, $el: cheerio.Cheerio): Taco {
  // Required fields
  const id = $el.attr('data-id');
  if (!id) {
    throw new ParserError('Taco missing ID attribute');
  }

  const name = $el.find('.taco-name').text().trim();
  if (!name) {
    throw new ParserError(`Taco ${id} missing name`);
  }

  // Optional fields with fallbacks
  const priceText = $el.find('.taco-price').text().trim() || '0';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

  const available = !$el.hasClass('unavailable');

  return {
    id,
    name,
    size: 'medium',
    meats: [],
    sauces: [],
    price,
    available,
  };
}
```

### Data Extraction Utilities

**✅ DO** create reusable extraction helpers:

```typescript
// utils/parsers.ts

export function extractAttribute(
  $el: cheerio.Cheerio,
  attribute: string
): string | null {
  const value = $el.attr(attribute);
  return value ? value.trim() : null;
}

export function extractText($el: cheerio.Cheerio, selector: string): string {
  return $el.find(selector).text().trim();
}

export function extractPrice(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return Number.isNaN(price) ? 0 : price;
}

export function extractDate(text: string): Date | null {
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function extractBoolean($el: cheerio.Cheerio, className: string): boolean {
  return $el.hasClass(className);
}
```

---

## Testing Guidelines

### Mocking External APIs

**✅ DO** use nock for HTTP mocking:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { BackendClient } from './client';

describe('BackendClient', () => {
  let client: BackendClient;
  const baseURL = 'https://api.example.com';

  beforeEach(() => {
    client = new BackendClient(baseURL);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getMenu', () => {
    it('should fetch and parse menu successfully', async () => {
      const mockHtml = `
        <div class="taco-item" data-id="taco-1">
          <span class="taco-name">Beef Taco</span>
          <span class="taco-price">$5.99</span>
        </div>
      `;

      nock(baseURL)
        .get('/menu')
        .reply(200, mockHtml);

      const menu = await client.getMenu();

      expect(menu.tacos).toHaveLength(1);
      expect(menu.tacos[0]).toEqual({
        id: 'taco-1',
        name: 'Beef Taco',
        size: 'medium',
        meats: [],
        sauces: [],
        price: 5.99,
        available: true,
      });
    });

    it('should throw NetworkError on HTTP error', async () => {
      nock(baseURL)
        .get('/menu')
        .reply(500, 'Internal Server Error');

      await expect(client.getMenu()).rejects.toThrow(NetworkError);
    });
  });
});
```

### Parser Testing

**✅ DO** test parsers with real HTML samples:

```typescript
import { describe, it, expect } from 'vitest';
import { parseMenuPage } from './parsers/menu.parser';
import { readFileSync } from 'node:fs';

describe('parseMenuPage', () => {
  it('should parse menu page HTML', () => {
    const html = readFileSync('./__fixtures__/menu-page.html', 'utf-8');
    const menu = parseMenuPage(html);

    expect(menu.tacos).toBeDefined();
    expect(menu.tacos.length).toBeGreaterThan(0);
  });

  it('should handle empty menu gracefully', () => {
    const html = '<html><body><div class="menu-container"></div></body></html>';

    expect(() => parseMenuPage(html)).toThrow(ParserError);
  });

  it('should extract all taco properties', () => {
    const html = `
      <div class="taco-item" data-id="taco-1">
        <span class="taco-name">Beef Taco</span>
        <span class="taco-price">$5.99</span>
      </div>
    `;

    const menu = parseMenuPage(html);
    const taco = menu.tacos[0];

    expect(taco.id).toBe('taco-1');
    expect(taco.name).toBe('Beef Taco');
    expect(taco.price).toBe(5.99);
    expect(taco.available).toBe(true);
  });
});
```

### Integration Tests

**✅ DO** create integration tests with test fixtures:

```typescript
describe('BackendClient integration', () => {
  it('should handle complete order flow', async () => {
    const client = new BackendClient(baseURL);

    // Mock login
    nock(baseURL)
      .post('/login')
      .reply(200, '<div class="user-id">user-123</div>');

    await client.login('test@example.com', 'password');
    expect(client.isAuthenticated()).toBe(true);

    // Mock menu fetch
    nock(baseURL)
      .get('/menu')
      .reply(200, menuHtmlFixture);

    const menu = await client.getMenu();
    expect(menu.tacos.length).toBeGreaterThan(0);

    // Mock order submission
    nock(baseURL)
      .post('/orders')
      .reply(201, orderConfirmationHtmlFixture);

    const order = await client.submitOrder({
      size: 'medium',
      meats: ['beef'],
      sauces: ['spicy'],
      garnitures: ['lettuce'],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('confirmed');
  });
});
```

---

## Code Review Checklist

### Type Safety
- [ ] All response types defined
- [ ] Parser functions return typed data
- [ ] Type guards for runtime validation
- [ ] No `any` or `as` type assertions

### Error Handling
- [ ] Custom error classes used
- [ ] Network errors wrapped properly
- [ ] Parser errors include context
- [ ] Retry logic for transient failures

### HTTP Client
- [ ] Cookie jar configured
- [ ] Request/response interceptors added
- [ ] Timeout configured
- [ ] Proper headers set

### Parsing
- [ ] Defensive parsing with fallbacks
- [ ] Required fields validated
- [ ] Parser errors thrown when data missing
- [ ] HTML fixtures saved for testing

### Testing
- [ ] Unit tests for parsers
- [ ] Mocked HTTP requests
- [ ] Integration tests for workflows
- [ ] Error cases covered

### Documentation
- [ ] JSDoc comments on public methods
- [ ] Type definitions exported
- [ ] Usage examples in README

---

## Resources

- [Axios Documentation](https://axios-http.com/docs/intro)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Tough Cookie Documentation](https://github.com/salesforce/tough-cookie)
- [Nock Documentation](https://github.com/nock/nock)

---

**Next**: See [API Guidelines](../../apps/api/GUIDELINES.md) for integrating this client into the backend.
