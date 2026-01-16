import { ApiError, parseApiError } from '@tacocrew/errors';
import { ENV } from '@/lib/env';

// Re-export for backwards compatibility
export { ApiError };

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

function buildUrl(path: string): string | URL {
  return ENV.apiBaseUrl ? new URL(path, ENV.apiBaseUrl) : path;
}

function setupHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return headers;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
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

  const isFormData = options.body instanceof FormData;
  if (isFormData) headers.delete('Content-Type');

  const response = await fetch(urlString, {
    ...options,
    method,
    headers,
    body: isFormData
      ? (options.body as FormData)
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
    credentials: 'include',
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw parseApiError(response.status, payload);
  }

  return payload as TResponse;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => send<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => send<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) => send<T>('PUT', path, options),
  patch: <T>(path: string, options?: RequestOptions) => send<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) => send<T>('DELETE', path, options),
};
