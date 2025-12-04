-- DropIndex
DROP INDEX IF EXISTS "users_displayUsername_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "displayUsername";

