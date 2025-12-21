import { ENV } from '@/lib/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiErrorBody {
  id?: string;
  code?: string;
  message?: string;
  key?: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if value is a Record<string, unknown>
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    !Array.isArray(value) &&
    value instanceof Object &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Extract error information from error body
 */
function extractErrorInfo(errorBody: unknown): ApiErrorBody | null {
  if (!errorBody || Array.isArray(errorBody) || !(errorBody instanceof Object)) {
    return null;
  }

  if (!('id' in errorBody && 'code' in errorBody)) {
    return null;
  }

  const isString = (value: unknown): value is string => {
    return value !== null && value !== undefined && (value as string).constructor === String;
  };

  return {
    id: 'id' in errorBody && isString(errorBody.id) ? errorBody.id : undefined,
    code: 'code' in errorBody && isString(errorBody.code) ? errorBody.code : undefined,
    message: 'message' in errorBody && isString(errorBody.message) ? errorBody.message : undefined,
    key: 'key' in errorBody && isString(errorBody.key) ? errorBody.key : undefined,
    details: 'details' in errorBody && isRecord(errorBody.details) ? errorBody.details : undefined,
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly errorId?: string;
  public readonly errorCode?: string;
  public readonly key?: string;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;

    // Extract error information if body contains error object
    if (body && !Array.isArray(body) && body instanceof Object && 'error' in body) {
      const bodyWithError: { error?: unknown } = body;
      const errorInfo = extractErrorInfo(bodyWithError.error);
      if (errorInfo) {
        this.errorId = errorInfo.id;
        this.errorCode = errorInfo.code;
        this.key = errorInfo.key;
        this.details = errorInfo.details;
      }
    }
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

/**
 * Build request URL
 */
function buildUrl(path: string): string | URL {
  return ENV.apiBaseUrl ? new URL(path, ENV.apiBaseUrl) : path;
}

function setupHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

/**
 * Parse response payload
 */
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  if (!isJson) {
    return undefined;
  }
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function send<TResponse>(method: HttpMethod, path: string, options: RequestOptions = {}) {
  const url = buildUrl(path);
  const headers = setupHeaders(options);
  const urlString = typeof url === 'string' ? url : url.toString();

  // Handle FormData separately (for file uploads)
  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    // Don't set Content-Type for FormData - browser will set it with boundary
    headers.delete('Content-Type');
  }

  const response = await fetch(urlString, {
    ...options,
    method,
    headers,
    body: (() => {
      if (isFormData) return options.body as FormData;
      if (options.body) return JSON.stringify(options.body);
      return undefined;
    })(),
    credentials: 'include', // Include cookies for Better Auth sessions
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    // Note: We don't clear session on 401 because Better Auth manages sessions via cookies
    // The auth system will handle redirects and session invalidation
    // Clearing here would cause infinite loops when the user is simply not logged in
    throw new ApiError(response.status, payload);
  }

  // TypeScript cannot infer generic type from JSON.parse
  // The payload structure is validated by the API contract at runtime
  // We return payload and let the generic type parameter handle the typing
  return payload as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: RequestOptions) => send<TResponse>('GET', path, options),
  post: <TResponse>(path: string, options?: RequestOptions) =>
    send<TResponse>('POST', path, options),
  put: <TResponse>(path: string, options?: RequestOptions) => send<TResponse>('PUT', path, options),
  patch: <TResponse>(path: string, options?: RequestOptions) =>
    send<TResponse>('PATCH', path, options),
  delete: <TResponse>(path: string, options?: RequestOptions) =>
    send<TResponse>('DELETE', path, options),
};
