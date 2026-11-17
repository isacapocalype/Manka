export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }
  return count;
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = countDelimiterOutsideQuotes(firstLine, candidate);
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter?: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, '');
  const separator = delimiter ?? detectDelimiter(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = (): void => {
    row.push(field);
    field = '';
  };
  const pushRow = (): void => {
    pushField();
    const hasData = row.some((value) => value.trim() !== '');
    if (hasData) rows.push(row);
    row = [];
  };

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (inQuotes) {
      if (char === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === separator) {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      if (clean[index + 1] === '\n') index += 1;
      pushRow();
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error('File CSV tidak valid: tanda kutip tidak ditutup.');
  }
  if (field !== '' || row.length > 0) {
    pushRow();
  }

  const headerRow = rows.shift();
  if (!headerRow) {
    throw new Error('File tidak memiliki baris judul kolom.');
  }
  const headers = headerRow.map((header) => header.trim());
  const dataRows = rows.map((values) => {
    const normalized = [...values];
    while (normalized.length < headers.length) normalized.push('');
    return normalized.slice(0, headers.length);
  });
  return { headers, rows: dataRows, delimiter: separator };
}

export function escapeCsvValue(value: string): string {
  if (/[",;\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: readonly (readonly string[])[]): string {
  const lines = [headers.map(escapeCsvValue).join(',')];
  for (const row of rows) {
    lines.push(row.map((value) => escapeCsvValue(value)).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
