/**
 * Organization routes for Hono
 * @module api/routes/organization
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { jsonContent, OrganizationSchemas } from '@/api/schemas/organization.schemas';
import { IsoDateStringSchema } from '@/api/schemas/shared.schemas';
import { authSecurity, createAuthenticatedRouteApp, requireUserId } from '@/api/utils/route.utils';
import { OrganizationMemberStatus, OrganizationRole } from '@/generated/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { OrganizationIdSchema } from '@/schemas/organization.schema';
import { UserIdSchema } from '@/schemas/user.schema';
import { OrganizationService } from '@/services/organization/organization.service';
import {
  buildOrganizationAvatarUrl,
  processAvatarImage,
  processProfileImage,
} from '@/shared/utils/image.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

const app = createAuthenticatedRouteApp();

function buildErrorResponse(code: string, message: string) {
  return { error: { code, message } };
}

function serializeOrganizationResponse(organization: {
  id: string;
  name: string;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const hasImage = Boolean(organization.image);
  return {
    id: organization.id,
    name: organization.name,
    image: buildOrganizationAvatarUrl({
      id: organization.id,
      hasImage,
      updatedAt: organization.updatedAt,
    }),
    createdAt: organization.createdAt?.toISOString(),
    updatedAt: organization.updatedAt?.toISOString(),
  };
}

function serializeUserOrganizationResponse(data: {
  organization: {
    id: string;
    name: string;
    image?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
  role: OrganizationRole;
  status: OrganizationMemberStatus;
}) {
  const hasImage = Boolean(data.organization.image);
  return {
    id: data.organization.id,
    name: data.organization.name,
    image: buildOrganizationAvatarUrl({
      id: data.organization.id,
      hasImage,
      updatedAt: data.organization.updatedAt,
    }),
    role: data.role,
    status: data.status,
    createdAt: data.organization.createdAt?.toISOString(),
    updatedAt: data.organization.updatedAt?.toISOString(),
  };
}

// GET /organizations - List all organizations (admin)
app.openapi(
  createRoute({
    method: 'get',
    path: '/organizations',
    tags: ['Organization'],
    security: authSecurity,
    responses: {
      200: {
        description: 'List of all organizations',
        content: jsonContent(OrganizationSchemas.OrganizationResponseSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const organizationService = inject(OrganizationService);
    const organizations = await organizationService.listAllOrganizations();
    return c.json(organizations.map(serializeOrganizationResponse), 200);
  }
);

// GET /organizations/{id} - Get organization by ID
app.openapi(
  createRoute({
    method: 'get',
    path: '/organizations/{id}',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Organization details',
        content: jsonContent(OrganizationSchemas.OrganizationResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'Organization not found',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const organization = await organizationService.getOrganizationById(organizationId);

    if (!organization) {
      return c.json(buildErrorResponse('NOT_FOUND', 'Organization not found'), 404);
    }

    return c.json(serializeOrganizationResponse(organization), 200);
  }
);

// POST /organizations - Create organization (admin)
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      body: {
        content: jsonContent(OrganizationSchemas.CreateOrganizationRequestSchema),
      },
    },
    responses: {
      201: {
        description: 'Organization created',
        content: jsonContent(OrganizationSchemas.OrganizationResponseSchema),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const payload = c.req.valid('json');
    const organizationService = inject(OrganizationService);
    // Creator is automatically set as ADMIN with ACTIVE status
    const organization = await organizationService.createOrganization(payload, userId);
    return c.json(serializeOrganizationResponse(organization), 201);
  }
);

// POST /organizations/{id}/users - Add user to organization (admin)
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations/{id}/users',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: jsonContent(OrganizationSchemas.AddUserToOrganizationRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'User added to organization',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      404: {
        description: 'User not found',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      409: {
        description: 'User already a member',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const adminUserId = requireUserId(c);
    const { id } = c.req.valid('param');
    const { email, role } = c.req.valid('json');
    const organizationService = inject(OrganizationService);
    const userRepository = inject(UserRepository);
    const organizationId = OrganizationIdSchema.parse(id);

    // Check if requester is admin
    const isAdmin = await organizationService.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return c.json(buildErrorResponse('NOT_FOUND', `User with email ${email} not found`), 404);
    }

    // Check if user is already a member
    const membership = await organizationService.getUserMembership(user.id, organizationId);
    if (membership) {
      if (membership.status === OrganizationMemberStatus.ACTIVE) {
        return c.json(
          buildErrorResponse('CONFLICT', 'User is already an active member of this organization'),
          409
        );
      }
      if (membership.status === OrganizationMemberStatus.PENDING) {
        // If pending, accept their request (this will send a notification)
        const finalRole = role ?? membership.role;
        await organizationService.acceptJoinRequest(adminUserId, user.id, organizationId);
        // Update role if different from default
        if (finalRole !== OrganizationRole.MEMBER) {
          await organizationService.updateUserRole(user.id, organizationId, finalRole, adminUserId);
        }
        return c.json({ success: true }, 200);
      }
    }

    // Add user with ACTIVE status (no confirmation needed for admin-added users)
    await organizationService.addUserToOrganization(user.id, organizationId, {
      role: role ?? OrganizationRole.MEMBER,
      status: OrganizationMemberStatus.ACTIVE,
    });

    return c.json({ success: true }, 200);
  }
);

// GET /organizations/{id}/members - List organization members (ACTIVE members only)
app.openapi(
  createRoute({
    method: 'get',
    path: '/organizations/{id}/members',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'List of organization members',
        content: jsonContent(OrganizationSchemas.OrganizationMemberResponseSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);

    // Check if user is an ACTIVE member - pending members cannot see members list
    const membership = await organizationService.getUserMembership(userId, organizationId);
    if (!membership || membership.status !== OrganizationMemberStatus.ACTIVE) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an active member of this organization'),
        403
      );
    }

    // Fix: If org has no admins, make current user admin
    const members = await organizationService.getOrganizationMembers(organizationId);
    const hasAdmin = members.some(
      (m) => m.role === OrganizationRole.ADMIN && m.status === OrganizationMemberStatus.ACTIVE
    );
    if (!hasAdmin) {
      await organizationService.addUserToOrganization(userId, organizationId, {
        role: OrganizationRole.ADMIN,
        status: OrganizationMemberStatus.ACTIVE,
      });
    }

    const updatedMembers = await organizationService.getOrganizationMembers(organizationId);
    return c.json(updatedMembers, 200);
  }
);

// GET /organizations/{id}/pending - List pending join requests (admin)
app.openapi(
  createRoute({
    method: 'get',
    path: '/organizations/{id}/pending',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'List of pending join requests',
        content: jsonContent(
          z.array(
            z.object({
              userId: z.string().uuid(),
              role: OrganizationSchemas.OrganizationRoleSchema,
              user: z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string(),
                image: z.string().nullable(),
                username: z.string().nullable(),
              }),
              createdAt: IsoDateStringSchema,
            })
          )
        ),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(userId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const pending = await organizationService.getPendingRequests(organizationId);
    return c.json(pending, 200);
  }
);

// POST /organizations/{id}/requests/{userId}/accept - Accept join request (admin)
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations/{id}/requests/{userId}/accept',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Join request accepted',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const adminUserId = requireUserId(c);
    const { id, userId } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const parsedUserId = UserIdSchema.parse(userId);
    await organizationService.acceptJoinRequest(adminUserId, parsedUserId, organizationId);
    return c.json({ success: true }, 200);
  }
);

// POST /organizations/{id}/requests/{userId}/reject - Reject join request (admin)
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations/{id}/requests/{userId}/reject',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Join request rejected',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const adminUserId = requireUserId(c);
    const { id, userId } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const parsedUserId = UserIdSchema.parse(userId);
    await organizationService.rejectJoinRequest(adminUserId, parsedUserId, organizationId);
    return c.json({ success: true }, 200);
  }
);

// PATCH /organizations/{id}/users/{userId}/role - Update user role (admin)
app.openapi(
  createRoute({
    method: 'patch',
    path: '/organizations/{id}/users/{userId}/role',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      body: {
        content: jsonContent(OrganizationSchemas.UpdateUserRoleRequestSchema),
      },
    },
    responses: {
      200: {
        description: 'User role updated',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      400: {
        description: 'Invalid request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const adminUserId = requireUserId(c);
    const { id, userId } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(adminUserId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const parsedUserId = UserIdSchema.parse(userId);
    const parsedRole = OrganizationSchemas.OrganizationRoleSchema.parse(role);
    await organizationService.updateUserRole(parsedUserId, organizationId, parsedRole, adminUserId);
    return c.json({ success: true }, 200);
  }
);

// DELETE /organizations/{id}/users/{userId} - Remove user from organization (admin)
app.openapi(
  createRoute({
    method: 'delete',
    path: '/organizations/{id}/users/{userId}',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User removed from organization',
        content: jsonContent(
          z.object({
            success: z.boolean(),
          })
        ),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id, userId: targetUserId } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(userId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const parsedUserId = UserIdSchema.parse(targetUserId);
    await organizationService.removeUserFromOrganization(parsedUserId, organizationId);
    return c.json({ success: true }, 200);
  }
);

// POST /organizations/{id}/join - Request to join organization
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations/{id}/join',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Join request sent',
        content: jsonContent(z.object({ success: z.boolean() })),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      409: {
        description: 'Conflict - Already a member or pending request',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const organizationService = inject(OrganizationService);
    const organizationId = OrganizationIdSchema.parse(id);

    try {
      // Check if org has any admins - if not, make this user admin (fix for old orgs)
      const members = await organizationService.getOrganizationMembers(organizationId);
      const hasAdmin = members.some(
        (m) => m.role === OrganizationRole.ADMIN && m.status === OrganizationMemberStatus.ACTIVE
      );

      if (!hasAdmin) {
        // No admins exist - make this user admin
        await organizationService.addUserToOrganization(userId, organizationId, {
          role: OrganizationRole.ADMIN,
          status: OrganizationMemberStatus.ACTIVE,
        });
      } else {
        await organizationService.requestToJoinOrganization(userId, organizationId);
      }

      return c.json({ success: true }, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('already a member') ||
          error.message.includes('already have a pending')
        ) {
          return c.json(buildErrorResponse('CONFLICT', error.message), 409);
        }
      }
      throw error;
    }
  }
);

// GET /users/me/organizations - Get current user's organizations with role and status
app.openapi(
  createRoute({
    method: 'get',
    path: '/users/me/organizations',
    tags: ['Organization'],
    security: authSecurity,
    responses: {
      200: {
        description: "User's organizations with membership info",
        content: jsonContent(OrganizationSchemas.UserOrganizationResponseSchema.array()),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const organizationService = inject(OrganizationService);
    const userOrganizations = await organizationService.getUserOrganizations(userId);
    return c.json(userOrganizations.map(serializeUserOrganizationResponse), 200);
  }
);

// POST /organizations/{id}/avatar - Upload organization avatar (admin)
app.openapi(
  createRoute({
    method: 'post',
    path: '/organizations/{id}/avatar',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z.any(),
              backgroundColor: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Avatar uploaded successfully',
        content: jsonContent(OrganizationSchemas.OrganizationResponseSchema),
      },
      400: {
        description: 'Invalid image file',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(userId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }
    const formData = await c.req.formData();
    const file = formData.get('image');

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      logger.warn('Avatar upload: invalid file', {
        organizationId: id,
        fileType: typeof file,
        hasArrayBuffer: file && typeof file === 'object' ? 'arrayBuffer' in file : false,
      });
      return c.json(buildErrorResponse('ORG_AVATAR_INVALID', 'Image file is required'), 400);
    }

    try {
      const backgroundColor = formData.get('backgroundColor');
      const bgColor =
        backgroundColor && typeof backgroundColor === 'string' ? backgroundColor : undefined;

      const processedImage = await processProfileImage(file, bgColor);

      const updatedOrganization = await organizationService.updateOrganizationImage(
        organizationId,
        processedImage
      );

      return c.json(serializeOrganizationResponse(updatedOrganization), 200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      logger.error('Avatar upload failed', {
        error: errorMessage,
        organizationId: id,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(buildErrorResponse('ORG_AVATAR_UPLOAD_FAILED', errorMessage), 400);
    }
  }
);

// DELETE /organizations/{id}/avatar - Delete organization avatar (admin)
app.openapi(
  createRoute({
    method: 'delete',
    path: '/organizations/{id}/avatar',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Avatar deleted successfully',
        content: jsonContent(OrganizationSchemas.OrganizationResponseSchema),
      },
      401: {
        description: 'Unauthorized',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
      403: {
        description: 'Forbidden',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const userId = requireUserId(c);
    const { id } = c.req.valid('param');
    const organizationId = OrganizationIdSchema.parse(id);
    const organizationService = inject(OrganizationService);
    const isAdmin = await organizationService.isUserAdmin(userId, organizationId);
    if (!isAdmin) {
      return c.json(
        buildErrorResponse('FORBIDDEN', 'You must be an admin of this organization'),
        403
      );
    }

    const updatedOrganization = await organizationService.updateOrganizationImage(
      organizationId,
      null
    );

    return c.json(serializeOrganizationResponse(updatedOrganization), 200);
  }
);

// GET /organizations/{id}/avatar - Get organization avatar
app.openapi(
  createRoute({
    method: 'get',
    path: '/organizations/{id}/avatar',
    tags: ['Organization'],
    security: authSecurity,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      query: z.object({
        w: z
          .string()
          .optional()
          .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
        h: z
          .string()
          .optional()
          .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
        size: z
          .string()
          .optional()
          .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
        dpr: z
          .string()
          .optional()
          .transform((val) => (val ? Number.parseFloat(val) : undefined)),
        v: z.string().optional(), // Version parameter for cache busting (ignored but allowed)
      }),
    },
    responses: {
      200: {
        description: 'Organization avatar image',
        content: {
          'image/webp': {
            schema: z.instanceof(Buffer),
          },
        },
      },
      404: {
        description: 'Avatar not found',
        content: jsonContent(OrganizationSchemas.ErrorResponseSchema),
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const { w, h, size, dpr } = c.req.valid('query');
    const organizationService = inject(OrganizationService);

    try {
      const organizationId = OrganizationIdSchema.parse(id);
      const avatar = await organizationService.getOrganizationAvatar(organizationId);

      if (!avatar) {
        logger.debug('Avatar not found for organization', { organizationId: id });
        return c.json(buildErrorResponse('ORG_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
      }

      if (!avatar.image || avatar.image.length === 0) {
        logger.warn('Avatar image is empty for organization', { organizationId: id });
        return c.json(buildErrorResponse('ORG_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
      }

      const { buffer: imageBuffer, etag } = await processAvatarImage(avatar.image, {
        width: w,
        height: h,
        size,
        dpr,
      });

      c.header('ETag', etag);
      if (avatar.updatedAt) {
        c.header('Last-Modified', avatar.updatedAt.toUTCString());
      }

      if (c.req.header('if-none-match') === etag) {
        return c.body(null, 304);
      }

      c.header('Cache-Control', 'public, max-age=31536000, immutable');
      c.header('Content-Type', 'image/webp');
      c.header('Content-Length', imageBuffer.length.toString());

      return c.body(new Uint8Array(imageBuffer), 200);
    } catch (error) {
      logger.error('Error serving avatar', {
        organizationId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return c.json(buildErrorResponse('ORG_AVATAR_NOT_FOUND', 'Avatar not found'), 404);
    }
  }
);

export const organizationRoutes = app;
