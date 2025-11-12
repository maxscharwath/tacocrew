function resolveApiBaseUrl(): string | undefined {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (!explicit) {
    return undefined;
  }
  return explicit;
}

export const ENV = {
  apiBaseUrl: resolveApiBaseUrl(),
};
