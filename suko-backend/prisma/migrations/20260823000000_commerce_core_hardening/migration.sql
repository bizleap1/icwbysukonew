-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "sub_category" TEXT,
ADD COLUMN IF NOT EXISTS "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "size_stock" JSONB DEFAULT '{}';

-- AlterTable CartItem
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "size" TEXT;

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discount" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "coupon_code" TEXT,
ADD COLUMN IF NOT EXISTS "reservation_status" TEXT,
ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "inventory_released_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT,
ADD COLUMN IF NOT EXISTS "status_before_cancel_request" TEXT,
ADD COLUMN IF NOT EXISTS "cart_item_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "shipping_name" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_phone" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_line1" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_city" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_state" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_pincode" TEXT,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable Wishlist
CREATE TABLE IF NOT EXISTS "Wishlist" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable Coupon
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount_percent" INTEGER,
    "discount_flat" DECIMAL(65,30),
    "min_order_value" DECIMAL(65,30) DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable Review
CREATE TABLE IF NOT EXISTS "Review" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockNotification
CREATE TABLE IF NOT EXISTS "StockNotification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "size" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable Payment
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "razorpay_order_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "amount_in_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_user_id_product_id_key" ON "Wishlist"("user_id", "product_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_razorpay_order_id_key" ON "Payment"("razorpay_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_razorpay_payment_id_key" ON "Payment"("razorpay_payment_id");

-- AddForeignKey (Wishlist, Review, StockNotification, Payment)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_user_id_fkey') THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_product_id_fkey') THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_user_id_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_product_id_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockNotification_user_id_fkey') THEN
        ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockNotification_product_id_fkey') THEN
        ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_order_id_fkey') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
