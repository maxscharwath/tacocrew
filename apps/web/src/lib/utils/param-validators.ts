/**
 * Route parameter validation utilities
 * @module lib/utils/param-validators
 */

/**
 * Require a param to be present, throw Response error if missing
 *
 * @param params - The params object from LoaderFunctionArgs or ActionFunctionArgs
 * @param key - The param key to extract
 * @param errorMessage - Optional custom error message
 * @returns The param value (guaranteed to be a string)
 * @throws {Response} 400 Bad Request if param is missing
 *
 * @example
 * ```typescript
 * export const orderLoader = createLoader(async ({ params }) => {
 *   const orderId = requireParam(params, 'orderId');
 *   // orderId is guaranteed to be a string
 *   const order = await OrdersApi.getOrder(orderId);
 *   return { order };
 * });
 * ```
 */
export function requireParam(
  params: Record<string, string | undefined>,
  key: string,
  errorMessage?: string
): string {
  const value = params[key];
  if (!value) {
    const message = errorMessage ?? `Missing required parameter: ${key}`;
    throw new Response(message, { status: 400 });
  }
  return value;
}

/**
 * Require multiple params to be present
 *
 * @param params - The params object from LoaderFunctionArgs or ActionFunctionArgs
 * @param keys - Array of param keys to extract
 * @returns Record with all param values
 * @throws {Response} 400 Bad Request if any param is missing
 *
 * @example
 * ```typescript
 * export const loader = createLoader(async ({ params }) => {
 *   const { userId, postId } = requireParams(params, ['userId', 'postId'] as const);
 *   // Both userId and postId are guaranteed strings
 *   return { userId, postId };
 * });
 * ```
 */
export function requireParams<T extends readonly string[]>(
  params: Record<string, string | undefined>,
  keys: T
): Record<T[number], string> {
  const result = {} as Record<T[number], string>;
  for (const key of keys) {
    result[key as T[number]] = requireParam(params, key);
  }
  return result;
}

/**
 * Get an optional param with a default value
 *
 * @param params - The params object from LoaderFunctionArgs or ActionFunctionArgs
 * @param key - The param key to extract
 * @param defaultValue - Default value if param is missing
 * @returns The param value or default value
 *
 * @example
 * ```typescript
 * export const loader = createLoader(async ({ params }) => {
 *   const page = getParam(params, 'page', '1');
 *   return { page: Number.parseInt(page, 10) };
 * });
 * ```
 */
export function getParam(
  params: Record<string, string | undefined>,
  key: string,
  defaultValue: string
): string {
  return params[key] ?? defaultValue;
}
