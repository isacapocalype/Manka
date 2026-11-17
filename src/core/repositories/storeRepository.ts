import type { Database } from '@/core/database/types';
import type {
  Store,
  StoreFilters,
  StorePlatform,
  StoreRecord,
  StoreStatus,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getString } from './rowUtils';
import type { SqlRow } from '@/core/database/types';

interface StoreRow extends SqlRow {
  id: string;
  name: string;
  platform: string;
  email: string | null;
  phone: string | null;
  password_enc: string | null;
  ktp_name: string | null;
  bank_account_enc: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const PUBLIC_COLUMNS =
  'id, name, platform, email, phone, ktp_name, status, created_at, updated_at';

function toPlatform(value: string): StorePlatform {
  return value === 'shopee' || value === 'tiktok' || value === 'other' ? value : 'other';
}

function toStatus(value: string): StoreStatus {
  return value === 'archived' ? 'archived' : 'active';
}

function mapPublic(row: SqlRow): Store {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    platform: toPlatform(getString(row, 'platform')),
    email: getNullableString(row, 'email'),
    phone: getNullableString(row, 'phone'),
    ktpName: getNullableString(row, 'ktp_name'),
    status: toStatus(getString(row, 'status')),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapRecord(row: StoreRow): StoreRecord {
  return {
    ...mapPublic(row),
    passwordEnc: getNullableString(row, 'password_enc'),
    bankAccountEnc: getNullableString(row, 'bank_account_enc'),
  };
}

export interface StoreWriteData {
  name: string;
  platform: StorePlatform;
  email: string | null;
  phone: string | null;
  ktpName: string | null;
  passwordEnc: string | null;
  bankAccountEnc: string | null;
  status: StoreStatus;
}

export class StoreRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: StoreFilters = {}): Promise<Store[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (!filters.includeArchived) {
      where.push("status = 'active'");
    }
    if (filters.platform) {
      where.push('platform = ?');
      params.push(filters.platform);
    }
    if (filters.search?.trim()) {
      where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }
    const rows = await this.db.query(
      `SELECT ${PUBLIC_COLUMNS} FROM stores ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY status ASC, name COLLATE NOCASE ASC;`,
      params,
    );
    return rows.map(mapPublic);
  }

  async listAll(): Promise<Store[]> {
    return this.list({ includeArchived: true });
  }

  async getPublic(id: string): Promise<Store | null> {
    const rows = await this.db.query(`SELECT ${PUBLIC_COLUMNS} FROM stores WHERE id = ?;`, [id]);
    return rows[0] ? mapPublic(rows[0]) : null;
  }

  async getRecord(id: string): Promise<StoreRecord | null> {
    const rows = await this.db.query<StoreRow>('SELECT * FROM stores WHERE id = ?;', [id]);
    return rows[0] ? mapRecord(rows[0]) : null;
  }

  async create(data: StoreWriteData): Promise<Store> {
    const id = createId();
    const timestamp = nowIso();
    await this.db.execute(
      `INSERT INTO stores (id, name, platform, email, phone, password_enc, ktp_name, bank_account_enc, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.platform,
        data.email,
        data.phone,
        data.passwordEnc,
        data.ktpName,
        data.bankAccountEnc,
        data.status,
        timestamp,
        timestamp,
      ],
    );
    const store = await this.getPublic(id);
    if (!store) throw new Error('Toko gagal disimpan.');
    return store;
  }

  async update(id: string, data: StoreWriteData): Promise<Store> {
    await this.db.execute(
      `UPDATE stores
       SET name = ?, platform = ?, email = ?, phone = ?, password_enc = ?, ktp_name = ?,
           bank_account_enc = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.name,
        data.platform,
        data.email,
        data.phone,
        data.passwordEnc,
        data.ktpName,
        data.bankAccountEnc,
        data.status,
        nowIso(),
        id,
      ],
    );
    const store = await this.getPublic(id);
    if (!store) throw new Error('Toko tidak ditemukan.');
    return store;
  }

  async setStatus(id: string, status: StoreStatus): Promise<void> {
    await this.db.execute('UPDATE stores SET status = ?, updated_at = ? WHERE id = ?;', [
      status,
      nowIso(),
      id,
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM stores WHERE id = ?;', [id]);
  }

  async countTransactions(storeId: string): Promise<number> {
    const rows = await this.db.query(
      `SELECT
        (SELECT COUNT(*) FROM orders WHERE store_id = ?) +
        (SELECT COUNT(*) FROM marketplace_fees WHERE store_id = ?) +
        (SELECT COUNT(*) FROM refunds WHERE store_id = ?) +
        (SELECT COUNT(*) FROM settlements WHERE store_id = ?) +
        (SELECT COUNT(*) FROM operational_expenses WHERE store_id = ?) +
        (SELECT COUNT(*) FROM advertising_campaigns WHERE store_id = ?) AS total;`,
      [storeId, storeId, storeId, storeId, storeId, storeId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async exists(id: string): Promise<boolean> {
    const rows = await this.db.query('SELECT 1 AS found FROM stores WHERE id = ?;', [id]);
    return rows.length > 0;
  }
}
