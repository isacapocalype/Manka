-- Manka schema version 3: BOM (bill of materials) dan HPP berbasis komponen.
-- BOM bersifat biaya saja; tidak ada pencatatan stok material.
-- Kuantitas material boleh desimal (REAL), nominal tetap INTEGER Rupiah.

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_name ON materials (name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials (status);

CREATE TABLE IF NOT EXISTS product_bom_items (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('material', 'labor', 'overhead')),
  material_id TEXT REFERENCES materials (id) ON DELETE RESTRICT,
  label TEXT,
  quantity REAL NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (item_type = 'material' AND material_id IS NOT NULL)
    OR (item_type IN ('labor', 'overhead') AND material_id IS NULL AND label IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_product_bom_items_product
  ON product_bom_items (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_bom_items_material
  ON product_bom_items (material_id);
