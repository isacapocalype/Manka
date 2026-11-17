import initSqlJs, { type Database as SqlJsRawDatabase, type SqlJsStatic } from 'sql.js';
import wasmAssetUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type {
  Database,
  DatabaseBackend,
  SqlExecutionResult,
  SqlExecutor,
  SqlParams,
  SqlRow,
  SqlValue,
} from './types';
import { SerialQueue } from './types';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

export function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => wasmAssetUrl,
    });
  }
  return sqlJsPromise;
}

function normalizeParams(params?: SqlParams): SqlValue[] | Record<string, SqlValue> | undefined {
  if (params === undefined) return undefined;
  if (Array.isArray(params)) return [...params];
  return params as Record<string, SqlValue>;
}

function normalizeRow(row: Record<string, unknown>): SqlRow {
  const result: SqlRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      value instanceof Uint8Array
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

interface SqlJsDatabaseOptions {
  raw: SqlJsRawDatabase;
  backend?: DatabaseBackend;
  onWrite?: (bytes: Uint8Array) => Promise<void>;
}

class SqlJsDatabase implements Database {
  readonly backend: DatabaseBackend;
  private readonly raw: SqlJsRawDatabase;
  private readonly queue = new SerialQueue();
  private readonly onWrite?: (bytes: Uint8Array) => Promise<void>;
  private inTransaction = false;
  private closed = false;

  constructor(options: SqlJsDatabaseOptions) {
    this.raw = options.raw;
    this.backend = options.backend ?? 'web';
    this.onWrite = options.onWrite;
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('Database sudah ditutup.');
  }

  private async persist(): Promise<void> {
    if (!this.onWrite) return;
    const bytes = this.raw.export();
    await this.onWrite(bytes);
  }

  async query<T extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<T[]> {
    this.assertOpen();
    return this.queue.run(async () => {
      const statement = this.raw.prepare(sql);
      try {
        const bound = normalizeParams(params);
        if (bound !== undefined) statement.bind(bound);
        const rows: T[] = [];
        while (statement.step()) {
          rows.push(normalizeRow(statement.getAsObject()) as T);
        }
        return rows;
      } finally {
        statement.free();
      }
    });
  }

  async execute(sql: string, params?: SqlParams): Promise<SqlExecutionResult> {
    this.assertOpen();
    return this.queue.run(async () => {
      const bound = normalizeParams(params);
      this.raw.run(sql, bound);
      const changes = this.raw.getRowsModified();
      const lastIdRows = this.raw.exec('SELECT last_insert_rowid() AS id;');
      const lastIdValue = lastIdRows[0]?.values[0]?.[0];
      const result: SqlExecutionResult = {
        changes,
        lastInsertId: typeof lastIdValue === 'number' ? lastIdValue : null,
      };
      if (!this.inTransaction) await this.persist();
      return result;
    });
  }

  async executeScript(sql: string): Promise<void> {
    this.assertOpen();
    return this.queue.run(async () => {
      this.raw.exec(sql);
      if (!this.inTransaction) await this.persist();
    });
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.assertOpen();
    return this.queue.run(async () => {
      this.raw.exec('BEGIN IMMEDIATE TRANSACTION;');
      this.inTransaction = true;
      const tx: SqlExecutor = {
        query: async <R extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<R[]> => {
          const statement = this.raw.prepare(sql);
          try {
            const bound = normalizeParams(params);
            if (bound !== undefined) statement.bind(bound);
            const rows: R[] = [];
            while (statement.step()) {
              rows.push(normalizeRow(statement.getAsObject()) as R);
            }
            return rows;
          } finally {
            statement.free();
          }
        },
        execute: async (sql: string, params?: SqlParams): Promise<SqlExecutionResult> => {
          this.raw.run(sql, normalizeParams(params));
          const changes = this.raw.getRowsModified();
          const lastIdRows = this.raw.exec('SELECT last_insert_rowid() AS id;');
          const lastIdValue = lastIdRows[0]?.values[0]?.[0];
          return {
            changes,
            lastInsertId: typeof lastIdValue === 'number' ? lastIdValue : null,
          };
        },
        executeScript: async (sql: string): Promise<void> => {
          this.raw.exec(sql);
        },
      };

      try {
        const result = await work(tx);
        this.raw.exec('COMMIT;');
        this.inTransaction = false;
        await this.persist();
        return result;
      } catch (error) {
        try {
          this.raw.exec('ROLLBACK;');
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
      await this.persist();
      this.raw.close();
      this.closed = true;
    });
  }

  /** Untuk backup bytes pada adapter web. */
  async exportBytes(): Promise<Uint8Array> {
    return this.queue.run(async () => this.raw.export());
  }
}

export async function createSqlJsDatabase(options?: {
  bytes?: Uint8Array;
  onWrite?: (bytes: Uint8Array) => Promise<void>;
  backend?: DatabaseBackend;
  wasmBinary?: ArrayBuffer;
}): Promise<Database & { exportBytes(): Promise<Uint8Array> }> {
  const SQL = options?.wasmBinary
    ? await initSqlJs({ wasmBinary: options.wasmBinary })
    : await loadSqlJs();
  const raw = options?.bytes ? new SQL.Database(options.bytes) : new SQL.Database();
  raw.exec('PRAGMA foreign_keys = ON;');
  return new SqlJsDatabase({
    raw,
    ...(options?.onWrite ? { onWrite: options.onWrite } : {}),
    ...(options?.backend ? { backend: options.backend } : {}),
  });
}

const IDB_NAME = 'manka-local-database';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'main';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka penyimpanan lokal.'));
  });
}

async function readPersistedBytes(): Promise<Uint8Array | undefined> {
  const db = await openIndexedDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).get(IDB_KEY);
      request.onsuccess = () => {
        const value: unknown = request.result;
        resolve(value instanceof Uint8Array ? value : undefined);
      };
      request.onerror = () => reject(request.error ?? new Error('Gagal membaca database lokal.'));
    });
  } finally {
    db.close();
  }
}

async function writePersistedBytes(bytes: Uint8Array): Promise<void> {
  const db = await openIndexedDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Gagal menyimpan database lokal.'));
      tx.onabort = () => reject(tx.error ?? new Error('Penyimpanan database dibatalkan.'));
    });
  } finally {
    db.close();
  }
}

export async function openWebDatabase(): Promise<Database> {
  const bytes = await readPersistedBytes();
  return createSqlJsDatabase({
    ...(bytes ? { bytes } : {}),
    onWrite: writePersistedBytes,
    backend: 'web',
  });
}
