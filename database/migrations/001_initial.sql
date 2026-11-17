-- Manka database schema, version 1.
-- Semua nominal Rupiah disimpan sebagai INTEGER (tanpa floating point).
-- Tanggal bisnis disimpan sebagai TEXT dengan format YYYY-MM-DD (zona Asia/Jakarta).

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopee', 'tiktok', 'other')),
  email TEXT,
  phone TEXT,
  password_enc TEXT,
  ktp_name TEXT,
  bank_account_enc TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (status);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON stores (platform);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL COLLATE NOCASE UNIQUE,
  category TEXT,
  variant TEXT,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE TABLE IF NOT EXISTS product_costs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  effective_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs (product_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_costs_effective ON product_costs (effective_at);

CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price >= 0),
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices (product_id, effective_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  marketplace_order_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded'
  )),
  seller_discount INTEGER NOT NULL DEFAULT 0 CHECK (seller_discount >= 0),
  marketplace_discount INTEGER NOT NULL DEFAULT 0 CHECK (marketplace_discount >= 0),
  shipping_paid INTEGER NOT NULL DEFAULT 0 CHECK (shipping_paid >= 0),
  settlement_value INTEGER CHECK (settlement_value IS NULL OR settlement_value >= 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, marketplace_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_store_date ON orders (store_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_id ON orders (marketplace_order_id);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  hpp_snapshot INTEGER NOT NULL CHECK (hpp_snapshot >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items (sku);

CREATE TABLE IF NOT EXISTS marketplace_fees (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES orders (id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN (
    'admin', 'service', 'transaction', 'commission', 'promotion', 'other'
  )),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  fee_date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'actual' CHECK (source IN ('actual', 'estimated')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fees_store ON marketplace_fees (store_id);
CREATE INDEX IF NOT EXISTS idx_fees_date ON marketplace_fees (fee_date);
CREATE INDEX IF NOT EXISTS idx_fees_order ON marketplace_fees (order_id);
CREATE INDEX IF NOT EXISTS idx_fees_store_date ON marketplace_fees (store_id, fee_date);

CREATE TABLE IF NOT EXISTS advertising_campaigns (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores (id) ON DELETE RESTRICT,
  platform TEXT NOT NULL CHECK (platform IN ('shopee', 'tiktok', 'meta', 'google', 'other')),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_store ON advertising_campaigns (store_id);

CREATE TABLE IF NOT EXISTS advertising_expenses (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES advertising_campaigns (id) ON DELETE CASCADE,
  expense_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  impressions INTEGER CHECK (impressions IS NULL OR impressions >= 0),
  clicks INTEGER CHECK (clicks IS NULL OR clicks >= 0),
  attributed_orders INTEGER CHECK (attributed_orders IS NULL OR attributed_orders >= 0),
  attributed_revenue INTEGER CHECK (attributed_revenue IS NULL OR attributed_revenue >= 0),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ad_expenses_campaign ON advertising_expenses (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_expenses_date ON advertising_expenses (expense_date);

CREATE TABLE IF NOT EXISTS operational_expenses (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores (id) ON DELETE RESTRICT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'salary', 'electricity', 'internet', 'rent', 'machine_maintenance',
    'supplies', 'transportation', 'other'
  )),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  receipt_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_op_expenses_store ON operational_expenses (store_id);
CREATE INDEX IF NOT EXISTS idx_op_expenses_date ON operational_expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_op_expenses_category ON operational_expenses (category);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  settlement_no TEXT NOT NULL,
  settlement_date TEXT NOT NULL,
  gross_sales INTEGER NOT NULL CHECK (gross_sales >= 0),
  total_deductions INTEGER NOT NULL CHECK (total_deductions >= 0),
  total_payout INTEGER NOT NULL CHECK (total_payout >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, settlement_no)
);

CREATE INDEX IF NOT EXISTS idx_settlements_store ON settlements (store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements (settlement_date);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  settlement_id TEXT REFERENCES settlements (id) ON DELETE SET NULL,
  refund_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refunds_store ON refunds (store_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds (refund_date);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds (status);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  success_rows INTEGER NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
  failed_rows INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  skipped_rows INTEGER NOT NULL DEFAULT 0 CHECK (skipped_rows >= 0),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_batches_date ON import_batches (created_at);

CREATE TABLE IF NOT EXISTS import_errors (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES import_batches (id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number >= 0),
  message TEXT NOT NULL,
  raw_data TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_errors_batch ON import_errors (batch_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
