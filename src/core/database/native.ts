import type { Database, SqlExecutionResult, SqlExecutor, SqlParams, SqlRow, SqlValue } from './types';
import { SerialQueue } from './types';

const DATABASE_NAME = 'manka';

function normalizeParams(params?: SqlParams): SqlValue[] {
  if (params === undefined) return [];
  if (Array.isArray(params)) return [...params];
  return [];
}

class NativeDatabase implements Database {
  readonly backend = 'native' as const;
  private readonly queue = new SerialQueue();
  private readonly connection: SQLiteDBConnectionLike;
  private readonly sqlite: SQLiteConnectionLike;
  private inTransaction = false;
  private closed = false;

  constructor(connection: SQLiteDBConnectionLike, sqlite: SQLiteConnectionLike) {
    this.connection = connection;
    this.sqlite = sqlite;
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('Database sudah ditutup.');
  }

  async query<T extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<T[]> {
    this.assertOpen();
    return this.queue.run(async () => {
      const result = await this.connection.query(sql, normalizeParams(params));
      const rows = result.values ?? [];
      return rows.map((row) => this.normalizeRow(row)) as T[];
    });
  }

  private normalizeRow(row: unknown): SqlRow {
    if (Array.isArray(row)) {
      const result: SqlRow = {};
      row.forEach((value, index) => {
        result[String(index)] = typeof value === 'boolean' ? (value ? 1 : 0) : (value as SqlValue);
      });
      return result;
    }
    if (row && typeof row === 'object') {
      const result: SqlRow = {};
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        if (
          value === null ||
          typeof value === 'string' ||
          typeof value === 'number'
        ) {
          result[key] = value;
        } else if (typeof value === 'boolean') {
          result[key] = value ? 1 : 0;
        } else if (value === undefined) {
          result[key] = null;
        } else {
          result[key] = String(value);
        }
      }
      return result;
    }
    return {};
  }

  async execute(sql: string, params?: SqlParams): Promise<SqlExecutionResult> {
    this.assertOpen();
    return this.queue.run(async () => {
      const result = await this.connection.run(sql, normalizeParams(params), false);
      return {
        changes: result.changes?.changes ?? 0,
        lastInsertId: result.changes?.lastId ?? null,
      };
    });
  }

  async executeScript(sql: string): Promise<void> {
    this.assertOpen();
    return this.queue.run(async () => {
      await this.connection.execute(sql, false);
    });
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.assertOpen();
    return this.queue.run(async () => {
      await this.connection.beginTransaction();
      this.inTransaction = true;
      const tx: SqlExecutor = {
        query: async <R extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<R[]> => {
          const result = await this.connection.query(sql, normalizeParams(params));
          return (result.values ?? []).map((row) => this.normalizeRow(row)) as R[];
        },
        execute: async (sql: string, params?: SqlParams): Promise<SqlExecutionResult> => {
          const result = await this.connection.run(sql, normalizeParams(params), false);
          return {
            changes: result.changes?.changes ?? 0,
            lastInsertId: result.changes?.lastId ?? null,
          };
        },
        executeScript: async (sql: string): Promise<void> => {
          await this.connection.execute(sql, false);
        },
      };

      try {
        const result = await work(tx);
        await this.connection.commitTransaction();
        this.inTransaction = false;
        return result;
      } catch (error) {
        try {
          await this.connection.rollbackTransaction();
        } catch {
          // Rollback dapat gagal jika transaksi sudah tidak aktif; error asli tetap dilempar.
        }
        this.inTransaction = false;
        throw error;
      }
    });
  }

  async close(): Promise<void> {
    if (this.closed) return;
    await this.queue.run(async () => {
      if (this.inTransaction) {
        try {
          await this.connection.rollbackTransaction();
        } catch {
          // Abaikan rollback saat penutupan.
        }
      }
      await this.connection.close();
      await this.sqlite.closeConnection(DATABASE_NAME, false);
      this.closed = true;
    });
  }
}

interface SQLiteChangesLike {
  changes?: number;
  lastId?: number;
}

interface SQLiteRunResultLike {
  changes?: SQLiteChangesLike;
}

interface SQLiteQueryResultLike {
  values?: unknown[];
}

interface SQLiteDBConnectionLike {
  open(): Promise<void>;
  execute(statement: string, transaction?: boolean): Promise<unknown>;
  query(statement: string, values?: SqlValue[]): Promise<SQLiteQueryResultLike>;
  run(statement: string, values?: SqlValue[], transaction?: boolean): Promise<SQLiteRunResultLike>;
  beginTransaction(): Promise<unknown>;
  commitTransaction(): Promise<unknown>;
  rollbackTransaction(): Promise<unknown>;
  close(): Promise<void>;
}

interface SQLiteConnectionLike {
  closeConnection(database: string, readonly: boolean): Promise<void>;
}

interface SQLitePluginLike {
  checkConnectionsConsistency(): Promise<{ result?: boolean }>;
  isConnection(database: string, readonly: boolean): Promise<{ result?: boolean }>;
  retrieveConnection(database: string, readonly: boolean): Promise<SQLiteDBConnectionLike>;
  createConnection(
    database: string,
    encrypted: boolean,
    mode: string,
    version: number,
    readonly: boolean,
  ): Promise<SQLiteDBConnectionLike>;
}

export async function openNativeDatabase(): Promise<Database> {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlite = new SQLiteConnection(CapacitorSQLite) as unknown as SQLiteConnectionLike &
    SQLitePluginLike;
  const consistency = await sqlite.checkConnectionsConsistency();
  const existing = await sqlite.isConnection(DATABASE_NAME, false);
  const connection =
    consistency.result && existing.result
      ? await sqlite.retrieveConnection(DATABASE_NAME, false)
      : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
  await connection.open();
  await connection.execute('PRAGMA foreign_keys = ON;', false);
  return new NativeDatabase(connection, sqlite);
}
