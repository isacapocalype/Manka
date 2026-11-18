-- Manka schema version 5: template pemetaan kolom import per marketplace.
-- Template menyimpan pemetaan kolom (bukan data transaksi) agar file ekspor
-- marketplace dengan format yang sama dapat diimpor ulang tanpa memetakan ulang.

CREATE TABLE IF NOT EXISTS import_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('shopee', 'tiktok', 'other')),
  import_type TEXT NOT NULL CHECK (import_type IN ('orders', 'fees', 'settlements')),
  mapping_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_import_templates_scope
  ON import_templates (marketplace, import_type, name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_import_templates_type ON import_templates (import_type);
