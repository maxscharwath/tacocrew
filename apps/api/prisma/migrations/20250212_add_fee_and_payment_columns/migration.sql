-- Safe migration to add fee tracking and payment status columns without data loss
ALTER TABLE "group_orders"
  ADD COLUMN IF NOT EXISTS "fee" DOUBLE PRECISION;

ALTER TABLE "user_orders"
  ADD COLUMN IF NOT EXISTS "reimbursed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reimbursedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reimbursedById" TEXT,
  ADD COLUMN IF NOT EXISTS "paidByUser" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paidByUserAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paidByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "user_orders_paidByUser_idx" ON "user_orders" ("paidByUser");
CREATE INDEX IF NOT EXISTS "user_orders_paidByUserId_idx" ON "user_orders" ("paidByUserId");
CREATE INDEX IF NOT EXISTS "user_orders_reimbursed_idx" ON "user_orders" ("reimbursed");
CREATE INDEX IF NOT EXISTS "user_orders_reimbursedById_idx" ON "user_orders" ("reimbursedById");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_orders_reimbursedById_fkey'
  ) THEN
    ALTER TABLE "user_orders" DROP CONSTRAINT "user_orders_reimbursedById_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_orders_reimbursedById_fkey'
  ) THEN
    ALTER TABLE "user_orders"
      ADD CONSTRAINT "user_orders_reimbursedById_fkey"
      FOREIGN KEY ("reimbursedById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_orders_paidByUserId_fkey'
  ) THEN
    ALTER TABLE "user_orders" DROP CONSTRAINT "user_orders_paidByUserId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_orders_paidByUserId_fkey'
  ) THEN
    ALTER TABLE "user_orders"
      ADD CONSTRAINT "user_orders_paidByUserId_fkey"
      FOREIGN KEY ("paidByUserId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;
