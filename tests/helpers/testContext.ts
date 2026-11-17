import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createSqlJsDatabase } from '@/core/database/sqljs';
import { migrateDatabase } from '@/core/database';
import { createAppServices, type AppServices } from '@/core/services/appServices';
import { MemorySecretStore } from '@/core/crypto/secretStore';
import type { Database } from '@/core/database/types';

export interface TestContext {
  db: Database & { exportBytes(): Promise<Uint8Array> };
  services: AppServices;
  secretStore: MemorySecretStore;
}

export async function createTestContext(): Promise<TestContext> {
  const wasmPath = fileURLToPath(
    new URL('../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url),
  );
  const buffer = await readFile(wasmPath);
  const wasmBinary = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const db = await createSqlJsDatabase({ wasmBinary });
  await migrateDatabase(db);
  const secretStore = new MemorySecretStore();
  const services = createAppServices(db, secretStore);
  return { db, services, secretStore };
}
