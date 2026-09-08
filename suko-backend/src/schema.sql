-- SUKO Backend - Database Schema (Unified Product Architecture + Orders + Admin)
-- Safe to run multiple times (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  tagline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
  sub_category VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  sku VARCHAR(100),
  gender VARCHAR(20) DEFAULT 'female',
  fabric VARCHAR(255),
  color VARCHAR(100),
  secondary_color VARCHAR(100),
  pattern VARCHAR(100),
  finish VARCHAR(100),
  silhouette VARCHAR(100),
  fit VARCHAR(100),
  occasion VARCHAR(100),
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  size_stock JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column additions for categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Idempotent column additions for products
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS finish VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS silhouette VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS moment VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS moments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS moment_name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_schema JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
CREATE INDEX IF NOT EXISTS idx_products_moment ON products(moment);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_archived ON categories(is_archived);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'payment_pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'upi_qr',
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  line1 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  cancel_reason TEXT,
  transaction_id VARCHAR(100),
  payment_screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column additions for existing installations
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_partner VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_date TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color VARCHAR(100);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50),
  product_name VARCHAR(255),
  product_image_url TEXT,
  category_name VARCHAR(100),
  size VARCHAR(10),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Seed the first admin user.
-- Login email: admin@indiancorporatewear.com
-- Login password: Suko@vnpZUO6tE4   (shared separately by Claude, change it after first login)
INSERT INTO users (name, email, phone, password_hash, role)
VALUES (
  'SUKO Admin',
  'admin@indiancorporatewear.com',
  '',
  '$2b$10$NV/BK6n.OurmKcsz/sSCF.SnktVDawg9RjTFOQ7vfb6VV.HP9yMpu',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  discount_flat NUMERIC(10,2),
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'percentage';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10,2);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100),
  product_name VARCHAR(255),
  user_name VARCHAR(255),
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  size VARCHAR(20),
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  audience_type VARCHAR(50) DEFAULT 'all',
  target VARCHAR(50) DEFAULT 'all',
  channel VARCHAR(20) DEFAULT 'email',
  recipient_email VARCHAR(255),
  recipient_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_by VARCHAR(100) DEFAULT 'SUKO Concierge',
  status VARCHAR(20) DEFAULT 'delivered',
  template_used VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);

-- Invoice & Brand Settings
CREATE TABLE IF NOT EXISTS brand_settings (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255) DEFAULT 'SUKO Atelier',
  tagline VARCHAR(255) DEFAULT 'Contemporary Indian Corporate Wear',
  logo_url TEXT DEFAULT '/logo.png',
  gst_number VARCHAR(100) DEFAULT '',
  address TEXT DEFAULT 'Atelier Flagship, Mumbai, Maharashtra, India',
  support_email VARCHAR(255) DEFAULT 'indiancorporatewearbysuko@gmail.com',
  support_phone VARCHAR(100) DEFAULT '+91 98765 43210',
  website_url VARCHAR(255) DEFAULT 'https://www.indiancorporatewear.com',
  instagram_url VARCHAR(255) DEFAULT 'https://www.instagram.com/icwbysuko?igsi=MXR4a2hwdWJmOW9lZw%3D%3D&utm_source=qr',
  instagram_handle VARCHAR(100) DEFAULT '@icwbysuko',
  invoice_prefix VARCHAR(50) DEFAULT 'INV-2026-',
  next_invoice_number INTEGER DEFAULT 1001,
  payment_details JSONB DEFAULT '{"bank_name":"","account_name":"","account_number":"","ifsc_code":"","upi_id":""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO brand_settings (id, business_name, tagline, logo_url, gst_number, address, support_email, support_phone, website_url, instagram_url, instagram_handle, invoice_prefix, next_invoice_number, payment_details)
VALUES (
  1,
  'SUKO Atelier',
  'Contemporary Indian Corporate Wear',
  '/logo.png',
  '',
  'Atelier Flagship, Mumbai, Maharashtra, India',
  'indiancorporatewearbysuko@gmail.com',
  '+91 98765 43210',
  'https://www.indiancorporatewear.com',
  'https://www.instagram.com/icwbysuko?igsi=MXR4a2hwdWJmOW9lZw%3D%3D&utm_source=qr',
  '@icwbysuko',
  'INV-2026-',
  1001,
  '{"bank_name":"","account_name":"","account_number":"","ifsc_code":"","upi_id":""}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- Document History Tracking (Invoices, Receipts, Packing Slips, Order Confirmations)
CREATE TABLE IF NOT EXISTS order_documents (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  pdf_url TEXT,
  sent_to_email VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_doc_number ON order_documents(document_number);

-- Inventory Movement History (Enterprise Fashion Batch Tracking)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  product_sku VARCHAR(100),
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  previous_size_stock JSONB DEFAULT '{}'::jsonb,
  new_size_stock JSONB DEFAULT '{}'::jsonb,
  adjustment_type VARCHAR(50) NOT NULL,
  delta INTEGER NOT NULL DEFAULT 0,
  admin_email VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- Admin Activity Audit Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id SERIAL PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_entity VARCHAR(50) DEFAULT 'products',
  affected_count INTEGER DEFAULT 1,
  details JSONB DEFAULT '{}'::jsonb,
  summary TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON admin_activity_logs(created_at DESC);

-- 30-Day Image Retention Deletion Queue
CREATE TABLE IF NOT EXISTS image_deletion_queue (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  product_id VARCHAR(100),
  scheduled_purge_at TIMESTAMPTZ NOT NULL,
  is_purged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_deletion_queue_purge ON image_deletion_queue(scheduled_purge_at) WHERE is_purged = false;
