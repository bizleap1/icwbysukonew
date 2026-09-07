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
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  size_stock JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

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
