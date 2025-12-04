-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "OrganizationMemberStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "user_organizations" ADD COLUMN "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "user_organizations" ADD COLUMN "status" "OrganizationMemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_role_idx" ON "user_organizations"("organizationId", "role");

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_status_idx" ON "user_organizations"("organizationId", "status");

