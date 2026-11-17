import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, toCsv } from '@/core/import-export/csv';

describe('CSV parser', () => {
  it('parses quoted values, escaped quotes, and CRLF', () => {
    const parsed = parseCsv('\uFEFFOrder ID,Nama Produk,Qty\r\nMP-1,"Kaos ""Premium"", L",2\r\n');
    expect(parsed.headers).toEqual(['Order ID', 'Nama Produk', 'Qty']);
    expect(parsed.rows).toEqual([['MP-1', 'Kaos "Premium", L', '2']]);
  });

  it('detects semicolon and tab delimiters', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
    expect(parseCsv('a;b\n1;2').rows).toEqual([['1', '2']]);
  });

  it('handles newlines inside quoted fields', () => {
    const parsed = parseCsv('name,notes\n"Kaos","baris satu\nbaris dua"');
    expect(parsed.rows).toEqual([['Kaos', 'baris satu\nbaris dua']]);
  });

  it('normalizes short rows and drops empty lines', () => {
    const parsed = parseCsv('a,b,c\n1,2\n\n3,4,5\n');
    expect(parsed.rows).toEqual([
      ['1', '2', ''],
      ['3', '4', '5'],
    ]);
  });

  it('rejects unclosed quotes and missing headers', () => {
    expect(() => parseCsv('a,b\n"1,2')).toThrow(/tanda kutip/);
    expect(() => parseCsv('')).toThrow(/judul kolom/);
  });

  it('round-trips through toCsv', () => {
    const text = toCsv(['Nama', 'Catatan'], [['Kaos, L', 'baris "satu"']]);
    const parsed = parseCsv(text);
    expect(parsed.headers).toEqual(['Nama', 'Catatan']);
    expect(parsed.rows).toEqual([['Kaos, L', 'baris "satu"']]);
  });
});
