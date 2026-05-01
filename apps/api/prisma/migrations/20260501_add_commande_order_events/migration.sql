-- Audit log of commande.app order status transitions.
-- See CommandeOrderEventService.recordIfChanged for write semantics.
CREATE TABLE IF NOT EXISTS "commande_order_events" (
  "id" TEXT NOT NULL,
  "commandeOrderId" TEXT NOT NULL,
  "groupOrderId" TEXT,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commande_order_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commande_order_events_commandeOrderId_observedAt_idx"
  ON "commande_order_events" ("commandeOrderId", "observedAt");

CREATE INDEX IF NOT EXISTS "commande_order_events_groupOrderId_idx"
  ON "commande_order_events" ("groupOrderId");

ALTER TABLE "commande_order_events"
  ADD CONSTRAINT "commande_order_events_groupOrderId_fkey"
  FOREIGN KEY ("groupOrderId") REFERENCES "group_orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
