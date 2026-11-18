-- Manka schema version 2: work order produksi.
-- Satu work order berpindah tahap sebagai satu batch utuh.
-- Qty lolos/cacat dicatat per tahap; produksi parsial dilakukan dengan memecah work order.

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  order_id TEXT REFERENCES orders (id) ON DELETE SET NULL,
  order_item_id TEXT REFERENCES order_items (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL CHECK (qty > 0),
  deadline TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  pic_name TEXT,
  current_stage TEXT NOT NULL DEFAULT 'antrian' CHECK (current_stage IN (
    'antrian', 'potong', 'jahit', 'finishing', 'qc', 'packing', 'selesai'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'cancelled')),
  qty_passed INTEGER NOT NULL DEFAULT 0 CHECK (qty_passed >= 0),
  qty_defect INTEGER NOT NULL DEFAULT 0 CHECK (qty_defect >= 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_work_orders_order ON work_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_order_item ON work_orders (order_item_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders (status);
CREATE INDEX IF NOT EXISTS idx_work_orders_stage ON work_orders (current_stage);
CREATE INDEX IF NOT EXISTS idx_work_orders_deadline ON work_orders (deadline);
CREATE INDEX IF NOT EXISTS idx_work_orders_pic ON work_orders (pic_name);

CREATE TABLE IF NOT EXISTS work_order_stages (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'antrian', 'potong', 'jahit', 'finishing', 'qc', 'packing'
  )),
  qty_in INTEGER NOT NULL CHECK (qty_in >= 0),
  qty_passed INTEGER NOT NULL CHECK (qty_passed >= 0),
  qty_defect INTEGER NOT NULL CHECK (qty_defect >= 0),
  pic_name TEXT,
  notes TEXT,
  started_at TEXT,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (work_order_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_work_order_stages_order ON work_order_stages (work_order_id, completed_at);
