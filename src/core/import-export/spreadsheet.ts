import { parseCsv } from './csv';

export interface TabularRow {
  /** Nomor baris pada file (baris judul = 1). */
  rowNumber: number;
  values: string[];
}

export interface TabularData {
  headers: string[];
  rows: TabularRow[];
  fileName: string;
}

export class ImportFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportFileError';
  }
}

const MAX_FILE_BYTES = 12 * 1024 * 1024;

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'object') {
    const objectValue = value as {
      text?: unknown;
      result?: unknown;
      richText?: { text?: string }[];
      hyperlink?: string;
      formula?: string;
    };
    if (typeof objectValue.text === 'string') return objectValue.text.trim();
    if (objectValue.result !== undefined) return cellToString(objectValue.result);
    if (Array.isArray(objectValue.richText)) {
      return objectValue.richText.map((part) => part.text ?? '').join('').trim();
    }
    if (typeof objectValue.hyperlink === 'string') return objectValue.hyperlink;
  }
  return String(value).trim();
}

function validateHeaders(rawHeaders: string[]): string[] {
  const headers = rawHeaders.map((header, index) => {
    const trimmed = header.trim();
    return trimmed === '' ? `Kolom ${index + 1}` : trimmed;
  });
  const seen = new Map<string, number>();
  for (const header of headers) {
    const key = header.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) > 1) {
      throw new ImportFileError(`Nama kolom "${header}" muncul lebih dari sekali.`);
    }
  }
  return headers;
}

function buildTabularData(
  rawRows: string[][],
  fileName: string,
): TabularData {
  if (rawRows.length === 0) {
    throw new ImportFileError('File tidak memiliki data.');
  }
  const headerRow = rawRows[0];
  if (!headerRow) throw new ImportFileError('File tidak memiliki baris judul kolom.');
  const headers = validateHeaders(headerRow);
  const rows: TabularRow[] = [];
  for (let index = 1; index < rawRows.length; index += 1) {
    const raw = rawRows[index] ?? [];
    const values = headers.map((_header, columnIndex) => (raw[columnIndex] ?? '').trim());
    if (values.every((value) => value === '')) continue;
    rows.push({ rowNumber: index + 1, values });
  }
  if (rows.length === 0) {
    throw new ImportFileError('File hanya berisi judul kolom tanpa data.');
  }
  return { headers, rows, fileName };
}

async function readCsvFile(file: File): Promise<TabularData> {
  const text = await file.text();
  const parsed = parseCsv(text);
  return buildTabularData([parsed.headers, ...parsed.rows], file.name);
}

async function readXlsxFile(file: File): Promise<TabularData> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ImportFileError('File Excel tidak dapat dibaca. Pastikan formatnya .xlsx yang valid.');
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ImportFileError('File Excel tidak memiliki lembar kerja.');
  }
  const rawRows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values: string[] = [];
    const columnCount = Math.max(worksheet.columnCount, 1);
    for (let column = 1; column <= columnCount; column += 1) {
      values.push(cellToString(row.getCell(column).value));
    }
    if (values.some((value) => value !== '')) {
      rawRows[rowNumber - 1] = values;
    }
  });
  const compact = rawRows.filter((row): row is string[] => Array.isArray(row));
  return buildTabularData(compact, file.name);
}

export async function readTabularFile(file: File): Promise<TabularData> {
  if (file.size === 0) throw new ImportFileError('File kosong.');
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportFileError('Ukuran file maksimal 12 MB.');
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return readCsvFile(file);
  }
  if (name.endsWith('.xlsx')) {
    return readXlsxFile(file);
  }
  throw new ImportFileError('Format file harus CSV atau XLSX.');
}
