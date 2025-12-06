/**
 * Organization authorization middleware
 * @module api/middleware/organization-auth
 */

import type { Context, Next } from 'hono';
import { OrganizationIdSchema } from '@/schemas/organization.schema';
import { OrganizationService } from '@/services/organization/organization.service';
import { ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { requireUserId } from '@/api/utils/route.utils';

/**
 * Middleware to ensure the user is an admin of the organization
 * Expects organizationId in route params
 */
export async function requireOrganizationAdmin(c: Context, next: Next): Promise<void> {
  const userId = requireUserId(c);
  const rawId = c.req.param('id');

  if (!rawId) {
    throw new ValidationError({ message: 'Organization ID is required' });
  }

  const organizationId = OrganizationIdSchema.parse(rawId);
  const organizationService = inject(OrganizationService);
  const isAdmin = await organizationService.isUserAdmin(userId, organizationId);

  if (!isAdmin) {
    throw new ValidationError({
      message: 'You must be an admin of this organization to perform this action',
    });
  }

  await next();
}
