import { Capacitor } from '@capacitor/core';
import type { Database } from './types';
import { openNativeDatabase } from './native';
import { openWebDatabase } from './sqljs';
import migration001 from '../../../database/migrations/001_initial.sql?raw';
import migration002 from '../../../database/migrations/002_production.sql?raw';
import migration003 from '../../../database/migrations/003_bom.sql?raw';
import { nowIso } from '@/core/utils/date';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial',
    sql: migration001,
  },
  {
    version: 2,
    name: 'production',
    sql: migration002,
  },
  {
    version: 3,
    name: 'bom',
    sql: migration003,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

export async function getSchemaVersion(db: Database): Promise<number> {
  const rows = await db.query<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations;',
  );
  return Number(rows[0]?.version ?? 0);
}

export async function migrateDatabase(db: Database): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON;');
  await db.execute(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);',
  );

  const current = await getSchemaVersion(db);
  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error(
      'Database ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi untuk membukanya.',
    );
  }

  const pending = MIGRATIONS.filter((migration) => migration.version > current).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      await tx.executeScript(migration.sql);
      await tx.execute('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);', [
        migration.version,
        nowIso(),
      ]);
    });
  }

  await db.execute('PRAGMA foreign_keys = ON;');
}

let databasePromise: Promise<Database> | null = null;

async function openDatabase(): Promise<Database> {
  if (Capacitor.isNativePlatform()) {
    return openNativeDatabase();
  }
  return openWebDatabase();
}

export function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = openDatabase()
      .then(async (db) => {
        await migrateDatabase(db);
        return db;
      })
      .catch((error: unknown) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

export async function closeDatabase(): Promise<void> {
  if (!databasePromise) return;
  const db = await databasePromise;
  await db.close();
  databasePromise = null;
}
