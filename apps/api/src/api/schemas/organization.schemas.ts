/**
 * Organization schemas (request and response)
 * @module api/schemas/organization
 */

import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema, jsonContent } from '@/api/schemas/shared.schemas';

// Define enums first before they are used
const OrganizationRoleSchema = z.enum(['ADMIN', 'MEMBER']);
const OrganizationMemberStatusSchema = z.enum(['PENDING', 'ACTIVE']);

const OrganizationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

const UserOrganizationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  role: OrganizationRoleSchema,
  status: OrganizationMemberStatusSchema,
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

const CreateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

const AddUserToOrganizationRequestSchema = z.object({
  email: z.string().email(),
  role: OrganizationRoleSchema.optional(),
});

const OrganizationMemberResponseSchema = z.object({
  userId: z.uuid(),
  role: OrganizationRoleSchema,
  status: OrganizationMemberStatusSchema,
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
    username: z.string().nullable(),
  }),
  createdAt: z.coerce.date(),
});

const UpdateUserRoleRequestSchema = z.object({
  role: OrganizationRoleSchema,
});

const UpdateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

export const OrganizationSchemas = {
  OrganizationResponseSchema,
  UserOrganizationResponseSchema,
  CreateOrganizationRequestSchema,
  AddUserToOrganizationRequestSchema,
  OrganizationRoleSchema,
  OrganizationMemberStatusSchema,
  OrganizationMemberResponseSchema,
  UpdateUserRoleRequestSchema,
  UpdateOrganizationRequestSchema,
  ErrorResponseSchema,
};

export { jsonContent };
