import { ENV } from '../env';
import { sessionStore } from '../session/store';

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
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
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
    if (body && typeof body === 'object' && 'error' in body) {
      const bodyWithError: { error?: unknown } = body;
      const errorBody = bodyWithError.error;
      if (errorBody && typeof errorBody === 'object' && 'id' in errorBody && 'code' in errorBody) {
        const apiErrorBody: ApiErrorBody = {
          id: 'id' in errorBody && typeof errorBody.id === 'string' ? errorBody.id : undefined,
          code:
            'code' in errorBody && typeof errorBody.code === 'string' ? errorBody.code : undefined,
          message:
            'message' in errorBody && typeof errorBody.message === 'string'
              ? errorBody.message
              : undefined,
          key: 'key' in errorBody && typeof errorBody.key === 'string' ? errorBody.key : undefined,
          details:
            'details' in errorBody && isRecord(errorBody.details) ? errorBody.details : undefined,
        };
        this.errorId = apiErrorBody.id;
        this.errorCode = apiErrorBody.code;
        this.key = apiErrorBody.key;
        this.details = apiErrorBody.details;
      }
    }
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

async function send<TResponse>(method: HttpMethod, path: string, options: RequestOptions = {}) {
  // Use relative URL if apiBaseUrl is empty (same-domain deployment)
  // Otherwise construct full URL
  const url = ENV.apiBaseUrl ? new URL(path, ENV.apiBaseUrl) : path;
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Better Auth uses cookies for authentication, so we don't need to send JWT tokens
  // Cookies are automatically sent by the browser when credentials: 'include' is set
  // We only send JWT tokens if sessionStore has a session (for backward compatibility)
  if (!options.skipAuth) {
    const session = sessionStore.getSession();
    if (session) {
      // Legacy JWT token support (for backward compatibility)
      headers.set('Authorization', `Bearer ${session.token}`);
      headers.set('x-username', session.username);
    }
  }

  const urlString = typeof url === 'string' ? url : url.toString();
  const response = await fetch(urlString, {
    ...options,
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include', // Include cookies for Better Auth sessions
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => undefined) : undefined;

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
