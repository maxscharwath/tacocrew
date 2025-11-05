-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "csrfToken" TEXT NOT NULL,
    "cookies" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "taco_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "tacoId" TEXT NOT NULL,
    "backendIndex" INTEGER NOT NULL,
    CONSTRAINT "taco_mappings_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts" ("cartId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
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
    CONSTRAINT "orders_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts" ("cartId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_cartId_key" ON "carts"("cartId");

-- CreateIndex
CREATE INDEX "carts_lastActivityAt_idx" ON "carts"("lastActivityAt");

-- CreateIndex
CREATE INDEX "taco_mappings_cartId_idx" ON "taco_mappings"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "taco_mappings_cartId_tacoId_key" ON "taco_mappings"("cartId", "tacoId");

-- CreateIndex
CREATE UNIQUE INDEX "taco_mappings_cartId_backendIndex_key" ON "taco_mappings"("cartId", "backendIndex");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderId_key" ON "orders"("orderId");

-- CreateIndex
CREATE INDEX "orders_cartId_idx" ON "orders"("cartId");

-- CreateIndex
CREATE INDEX "orders_orderId_idx" ON "orders"("orderId");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
