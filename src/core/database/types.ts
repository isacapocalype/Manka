export type SqlValue = string | number | null | Uint8Array;
export type SqlRow = Record<string, SqlValue>;
export type SqlParams = readonly SqlValue[] | Record<string, SqlValue>;

export interface SqlExecutionResult {
  changes: number;
  lastInsertId: number | null;
}

export interface SqlExecutor {
  query<T extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<T[]>;
  execute(sql: string, params?: SqlParams): Promise<SqlExecutionResult>;
  executeScript(sql: string): Promise<void>;
}

export type DatabaseBackend = 'native' | 'web';

export interface Database extends SqlExecutor {
  readonly backend: DatabaseBackend;
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Antrian serial sederhana. Semua operasi database melewati antrian ini agar
 * transaksi tidak pernah berselang dengan query lain dari UI.
 */
export class SerialQueue {
  private tail: Promise<void> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
