import { ENV } from '../env';
import { sessionStore } from '../session/store';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

async function send<TResponse>(method: HttpMethod, path: string, options: RequestOptions = {}) {
  const url = new URL(path, ENV.apiBaseUrl);
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const session = sessionStore.getSession();
    if (session) {
      headers.set('Authorization', `Bearer ${session.token}`);
      headers.set('x-username', session.username);
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const error = new ApiError(response.status, payload);

    if (response.status === 401) {
      sessionStore.clearSession();
    }

    throw error;
  }

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
