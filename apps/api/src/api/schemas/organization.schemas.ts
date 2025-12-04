/**
 * Organization schemas (request and response)
 * @module api/schemas/organization
 */

import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema, IsoDateStringSchema, jsonContent } from './shared.schemas';

// Define enums first before they are used
const OrganizationRoleSchema = z.enum(['ADMIN', 'MEMBER']);
const OrganizationMemberStatusSchema = z.enum(['PENDING', 'ACTIVE']);

const OrganizationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const UserOrganizationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  role: OrganizationRoleSchema,
  status: OrganizationMemberStatusSchema,
  createdAt: IsoDateStringSchema.optional(),
  updatedAt: IsoDateStringSchema.optional(),
});

const CreateOrganizationRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

const AddUserToOrganizationRequestSchema = z.object({
  email: z.string().email(),
  role: OrganizationRoleSchema.optional(),
});

const OrganizationMemberResponseSchema = z.object({
  userId: z.string().uuid(),
  role: OrganizationRoleSchema,
  status: OrganizationMemberStatusSchema,
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
    username: z.string().nullable(),
  }),
  createdAt: IsoDateStringSchema,
});

const UpdateUserRoleRequestSchema = z.object({
  role: OrganizationRoleSchema,
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
  ErrorResponseSchema,
};

export { jsonContent };
