/**
 * Type utilities for extracting loader and action data types
 * @module lib/types/loader-types
 */

/**
 * Extract the data type from a loader function
 *
 * @template T - The loader function type
 *
 * @example
 * ```typescript
 * export const profileLoader = createLoader(async () => {
 *   const profile = await UserApi.getProfile();
 *   return { profile };
 * });
 *
 * // Extract the type:
 * type Data = LoaderData<typeof profileLoader>;
 * // Data = { profile: Profile }
 *
 * // Use in component:
 * const { profile } = useLoaderData<LoaderData<typeof profileLoader>>();
 * ```
 */
export type LoaderData<T> = T extends (...args: never[]) => Promise<Response>
  ? Awaited<ReturnType<Awaited<ReturnType<T>>['json']>>
  : never;

/**
 * Extract the data type from an action function
 *
 * @template T - The action function type
 *
 * @example
 * ```typescript
 * export const createOrderAction = createActionHandler({ ... });
 *
 * // Extract the type:
 * type Data = ActionData<typeof createOrderAction>;
 *
 * // Use in component:
 * const actionData = useActionData<ActionData<typeof createOrderAction>>();
 * ```
 */
export type ActionData<T> = LoaderData<T>;

/**
 * Extract the data type from a deferred loader function
 *
 * @template T - The deferred loader function type
 *
 * @example
 * ```typescript
 * export const dashboardLoader = createDeferredLoader(async () => {
 *   const data = await loadDashboard();
 *   return data;
 * });
 *
 * // Extract the type:
 * type Data = DeferredLoaderData<typeof dashboardLoader>;
 * // Data = { data: Promise<DashboardData> }
 *
 * // Use in component:
 * const { data } = useLoaderData<DeferredLoaderData<typeof dashboardLoader>>();
 * ```
 */
export type DeferredLoaderData<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;

/**
 * Helper type to extract API return type
 *
 * @template T - An async function that returns a promise
 *
 * @example
 * ```typescript
 * // Instead of:
 * type Profile = Awaited<ReturnType<typeof UserApi.getProfile>>;
 *
 * // Use:
 * type Profile = ApiReturnType<typeof UserApi.getProfile>;
 * ```
 */
export type ApiReturnType<T extends (...args: never[]) => Promise<unknown>> = Awaited<
  ReturnType<T>
>;
