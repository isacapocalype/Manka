import type { SqlRow } from '@/core/database/types';

export function getString(row: SqlRow, key: string): string {
  const value = row[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  throw new Error(`Kolom ${key} tidak berisi teks.`);
}

export function getNullableString(row: SqlRow, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  throw new Error(`Kolom ${key} tidak berisi teks.`);
}

export function getNumber(row: SqlRow, key: string): number {
  const value = row[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`Kolom ${key} tidak berisi angka.`);
}

export function getNullableNumber(row: SqlRow, key: string): number | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getBoolean(row: SqlRow, key: string): boolean {
  return getNumber(row, key) !== 0;
}

export function firstRow<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}
