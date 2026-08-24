-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cloudinary_public_id" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cloudinary_public_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
