-- DropIndex
DROP INDEX "user_orders_groupOrderId_userId_key";

-- CreateIndex
CREATE INDEX "user_orders_groupOrderId_userId_idx" ON "user_orders"("groupOrderId", "userId");
