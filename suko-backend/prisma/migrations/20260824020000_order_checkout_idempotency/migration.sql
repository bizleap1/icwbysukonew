-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "checkout_id" TEXT,
ADD COLUMN IF NOT EXISTS "checkout_fingerprint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_user_id_checkout_id_key" ON "Order"("user_id", "checkout_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_user_id_checkout_id_idx" ON "Order"("user_id", "checkout_id");

