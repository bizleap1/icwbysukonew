-- CreateTable CartMergeRequest
CREATE TABLE IF NOT EXISTS "CartMergeRequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "merge_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "warnings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CartMergeRequest_user_id_merge_id_key" ON "CartMergeRequest"("user_id", "merge_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CartMergeRequest_user_id_merge_id_idx" ON "CartMergeRequest"("user_id", "merge_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CartMergeRequest_expires_at_idx" ON "CartMergeRequest"("expires_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CartMergeRequest_user_id_fkey'
    ) THEN
        ALTER TABLE "CartMergeRequest" ADD CONSTRAINT "CartMergeRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
