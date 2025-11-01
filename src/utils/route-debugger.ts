/**
 * Route debugging utilities
 * @module utils/route-debugger
 */

import { logger } from './logger';

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

  // Group by path
  const grouped: Record<string, string[]> = {};
  routes.forEach((route) => {
    const path = route.path;
    if (!grouped[path]) {
      grouped[path] = [];
    }
    const methods = grouped[path];
    if (methods && !methods.includes(route.method)) {
      methods.push(route.method);
    }
  });

  // Sort paths
  const sortedPaths = Object.keys(grouped).sort();

  // Log routes
  logger.info(`📋 Registered ${framework} Routes (${routes.length} total):`, {
    routes: sortedPaths.map((path) => ({
      path,
      methods: grouped[path].sort().join(', '),
    })),
  });

  // Also log in a more readable format
  logger.info('📋 Routes by method:');
  const byMethod: Record<string, string[]> = {};
  routes.forEach((route) => {
    const method = route.method;
    if (!byMethod[method]) {
      byMethod[method] = [];
    }
    const paths = byMethod[method];
    if (paths && !paths.includes(route.path)) {
      paths.push(route.path);
    }
  });

  Object.entries(byMethod)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([method, paths]) => {
      paths.sort().forEach((path) => {
        logger.info(`   ${method.padEnd(6)} ${path}`);
      });
    });
}


