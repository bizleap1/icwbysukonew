-- Phase 2: Backend Security & Authentication Hardening Migration
-- Defensive, non-destructive forward migration with IF NOT EXISTS guards

-- 1. Add token_version and timestamp updates to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Create OtpVerification table
CREATE TABLE IF NOT EXISTS "OtpVerification" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "metadata" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- 3. Create Indexes on OtpVerification
CREATE INDEX IF NOT EXISTS "OtpVerification_email_purpose_idx" ON "OtpVerification"("email", "purpose");
CREATE INDEX IF NOT EXISTS "OtpVerification_expires_at_idx" ON "OtpVerification"("expires_at");
