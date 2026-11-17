import type { Database } from '@/core/database/types';
import { nowIso } from '@/core/utils/date';
import { getString } from './rowUtils';

export class SettingsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(key: string): Promise<string | null> {
    const rows = await this.db.query('SELECT value FROM app_settings WHERE key = ?;', [key]);
    return rows[0] ? getString(rows[0], 'value') : null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.execute(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, nowIso()],
    );
  }

  async delete(key: string): Promise<void> {
    await this.db.execute('DELETE FROM app_settings WHERE key = ?;', [key]);
  }

  async all(): Promise<Record<string, string>> {
    const rows = await this.db.query('SELECT key, value FROM app_settings ORDER BY key;');
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[getString(row, 'key')] = getString(row, 'value');
    }
    return result;
  }
}
