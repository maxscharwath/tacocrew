/*
  Warnings:

  - You are about to drop the column `cartId` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `orders` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "slackId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "group_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "leaderId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_orders_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_orders_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "group_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "csrfToken" TEXT NOT NULL,
    "cookies" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);
INSERT INTO "new_carts" ("cookies", "createdAt", "csrfToken", "id", "lastActivityAt", "metadata") SELECT "cookies", "createdAt", "csrfToken", "id", "lastActivityAt", "metadata" FROM "carts";
DROP TABLE "carts";
ALTER TABLE "new_carts" RENAME TO "carts";
CREATE INDEX "carts_lastActivityAt_idx" ON "carts"("lastActivityAt");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "address" TEXT,
    "requestedFor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "price" REAL,
    "orderData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("address", "cartId", "createdAt", "customerName", "customerPhone", "id", "orderData", "orderType", "price", "requestedFor", "status", "updatedAt") SELECT "address", "cartId", "createdAt", "customerName", "customerPhone", "id", "orderData", "orderType", "price", "requestedFor", "status", "updatedAt" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE INDEX "orders_cartId_idx" ON "orders"("cartId");
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE TABLE "new_taco_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "tacoId" TEXT NOT NULL,
    "backendIndex" INTEGER NOT NULL,
    CONSTRAINT "taco_mappings_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_taco_mappings" ("backendIndex", "cartId", "id", "tacoId") SELECT "backendIndex", "cartId", "id", "tacoId" FROM "taco_mappings";
DROP TABLE "taco_mappings";
ALTER TABLE "new_taco_mappings" RENAME TO "taco_mappings";
CREATE INDEX "taco_mappings_cartId_idx" ON "taco_mappings"("cartId");
CREATE UNIQUE INDEX "taco_mappings_cartId_tacoId_key" ON "taco_mappings"("cartId", "tacoId");
CREATE UNIQUE INDEX "taco_mappings_cartId_backendIndex_key" ON "taco_mappings"("cartId", "backendIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_slackId_idx" ON "users"("slackId");

-- CreateIndex
CREATE INDEX "group_orders_leaderId_idx" ON "group_orders"("leaderId");

-- CreateIndex
CREATE INDEX "group_orders_startDate_endDate_idx" ON "group_orders"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "group_orders_status_idx" ON "group_orders"("status");

-- CreateIndex
CREATE INDEX "user_orders_groupOrderId_idx" ON "user_orders"("groupOrderId");

-- CreateIndex
CREATE INDEX "user_orders_userId_idx" ON "user_orders"("userId");

-- CreateIndex
CREATE INDEX "user_orders_status_idx" ON "user_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_orders_groupOrderId_userId_key" ON "user_orders"("groupOrderId", "userId");
