/**
 * Dependency injection helper
 * @module utils/inject
 */

import { container } from 'tsyringe';

/**
 * Inject a dependency using TSyringe container
 * Usage: private readonly service = inject(ServiceClass);
 */
// biome-ignore lint/suspicious/noExplicitAny: TSyringe requires any[] for constructor types
export function inject<T>(token: new (...args: any[]) => T): T {
  return container.resolve<T>(token);
}
