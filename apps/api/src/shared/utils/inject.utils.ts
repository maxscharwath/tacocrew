/**
 * Dependency injection helper
 * @module utils/inject
 */

import { container, delay, InjectionToken } from 'tsyringe';

/**
 * Inject a dependency using TSyringe container
 * Usage: private readonly service = inject(ServiceClass);
 */
export function inject<T>(token: InjectionToken<T>): T {
  return container.resolve<T>(token);
}

/**
 * Inject a dependency lazily to break circular dependencies
 * Usage: private readonly getService = injectLazy(ServiceClass);
 */
export function injectLazy<T>(token: new (...args: unknown[]) => T) {
  return inject(delay(() => token));
}
