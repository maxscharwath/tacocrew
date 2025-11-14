/**
 * Simple defer utility for React Router v7
 * Returns an object with promises that can be resolved with Suspense/Await
 */
export function defer<T extends Record<string, unknown>>(obj: T): T {
  return obj;
}
