/**
 * Route debugging utilities
 * @module utils/route-debugger
 */

import { logger } from '@/utils/logger';

/**
 * Debug routes from manual route definitions
 */
export interface RouteDefinition {
  method: string;
  path: string;
}

/**
 * Log all registered routes in a formatted way
 */
export function debugRoutes(routes: RouteDefinition[], framework: 'Hono'): void {
  if (routes.length === 0) {
    logger.warn(`No routes registered for ${framework}`);
    return;
  }

  const groupedByPath = new Map<string, Set<string>>();
  const groupedByMethod = new Map<string, number>();

  routes.forEach(({ method, path }) => {
    if (!groupedByPath.has(path)) {
      groupedByPath.set(path, new Set());
    }
    groupedByPath.get(path)!.add(method);

    groupedByMethod.set(method, (groupedByMethod.get(method) ?? 0) + 1);
  });

  const methodsSummary = Array.from(groupedByMethod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([method, count]) => `${method}(${count})`)
    .join(', ');

  logger.info(
    `📋 ${framework} routes: ${groupedByPath.size} paths across ${groupedByMethod.size} methods [${methodsSummary}]`
  );

  const sortedRoutes = Array.from(groupedByPath.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [path, methods] of sortedRoutes) {
    const methodList = Array.from(methods).sort().join(', ');
    logger.info(`${methodList} ${path}`);
  }
}
