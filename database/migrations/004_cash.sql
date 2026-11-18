-- Manka schema version 4: kas, rekening, buku besar, transfer, dan rekonsiliasi.
-- Settlement dan refund adalah arus kas, bukan pendapatan baru.
-- Potongan/refund yang sudah termasuk dalam pencairan settlement tidak membuat
-- entri kas keluar tambahan.

CREATE TABLE IF NOT EXISTS cash_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet')),
  opening_balance INTEGER NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_accounts_name
  ON cash_accounts (name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_cash_accounts_status ON cash_accounts (status);

CREATE TABLE IF NOT EXISTS cash_entries (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES cash_accounts (id) ON DELETE RESTRICT,
  entry_date TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'settlement',
    'operational_expense',
    'advertising_expense',
    'refund',
    'transfer',
    'adjustment'
  )),
  source_id TEXT,
  description TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cash_entries_account
  ON cash_entries (account_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_entries_date ON cash_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_entries_source
  ON cash_entries (source_type, source_id);

CREATE TABLE IF NOT EXISTS cash_transfers (
  id TEXT PRIMARY KEY,
  from_account_id TEXT NOT NULL REFERENCES cash_accounts (id) ON DELETE RESTRICT,
  to_account_id TEXT NOT NULL REFERENCES cash_accounts (id) ON DELETE RESTRICT,
  transfer_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (from_account_id <> to_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cash_transfers_date ON cash_transfers (transfer_date);

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES cash_accounts (id) ON DELETE CASCADE,
  reconciliation_date TEXT NOT NULL,
  statement_balance INTEGER NOT NULL CHECK (statement_balance >= 0),
  book_balance INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_account
  ON cash_reconciliations (account_id, reconciliation_date);

ALTER TABLE settlements
  ADD COLUMN account_id TEXT REFERENCES cash_accounts (id) ON DELETE SET NULL;

ALTER TABLE operational_expenses
  ADD COLUMN account_id TEXT REFERENCES cash_accounts (id) ON DELETE SET NULL;
ALTER TABLE operational_expenses
  ADD COLUMN is_paid INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0, 1));

ALTER TABLE advertising_expenses
  ADD COLUMN account_id TEXT REFERENCES cash_accounts (id) ON DELETE SET NULL;
ALTER TABLE advertising_expenses
  ADD COLUMN is_paid INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0, 1));

ALTER TABLE refunds
  ADD COLUMN account_id TEXT REFERENCES cash_accounts (id) ON DELETE SET NULL;
