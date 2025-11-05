function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  if (typeof window !== 'undefined') {
    const fallback = `${window.location.protocol}//${window.location.hostname}:4000`;
    console.warn(
      'VITE_API_BASE_URL is not set. Using default API origin ' +
        `${fallback}. Set VITE_API_BASE_URL in apps/frontend/.env for explicit control.`
    );
    return fallback;
  }

  throw new Error('Missing VITE_API_BASE_URL environment variable');
}

export const ENV = {
  apiBaseUrl: resolveApiBaseUrl(),
};
