const RUPIAH_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const COMPACT_FORMATTER = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PERCENT_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format integer Rupiah. Nilai negatif tetap mudah dikenali. */
export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  const rounded = Math.round(value);
  if (rounded < 0) {
    return `-${RUPIAH_FORMATTER.format(Math.abs(rounded))}`;
  }
  return RUPIAH_FORMATTER.format(rounded);
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  return NUMBER_FORMATTER.format(value);
}

export function formatCompactRupiah(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  const sign = value < 0 ? '-' : '';
  return `${sign}Rp ${COMPACT_FORMATTER.format(Math.abs(value))}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return `${PERCENT_FORMATTER.format(value)}%`;
}

export function formatDecimal(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return PERCENT_FORMATTER.format(value);
}

/**
 * Parse input nominal Rupiah menjadi integer.
 * Menerima "Rp 1.234.567", "1234567", "1.234.567".
 * Desimal non-nol ditolak agar tidak ada pembulatan diam-diam.
 */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/^rp/i, '')
    .replace(/\s+/g, '')
    .replace(/\u00a0/g, '');
  if (cleaned === '') return null;

  const sign = cleaned.startsWith('-') ? -1 : 1;
  const unsigned = cleaned.replace(/^[+-]/, '');

  if (!/^[0-9.,]+$/.test(unsigned)) return null;

  let normalized: string;
  const lastDot = unsigned.lastIndexOf('.');
  const lastComma = unsigned.lastIndexOf(',');

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSeparator = lastDot > lastComma ? '.' : ',';
    const thousandSeparator = decimalSeparator === '.' ? ',' : '.';
    normalized = unsigned.split(thousandSeparator).join('');
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    if (decimalIndex >= 0) {
      const decimals = normalized.slice(decimalIndex + 1);
      if (/[1-9]/.test(decimals)) return null;
      normalized = normalized.slice(0, decimalIndex);
    }
  } else if (lastComma >= 0) {
    const decimals = unsigned.slice(lastComma + 1);
    const hasMultipleCommas = unsigned.indexOf(',') !== lastComma;
    if (!hasMultipleCommas && decimals.length > 0 && decimals.length <= 2) {
      if (/[1-9]/.test(decimals)) return null;
      normalized = unsigned.slice(0, lastComma);
    } else {
      normalized = unsigned.split(',').join('');
    }
  } else if (lastDot >= 0) {
    const decimals = unsigned.slice(lastDot + 1);
    const hasMultipleDots = unsigned.indexOf('.') !== lastDot;
    if (!hasMultipleDots && decimals.length > 0 && decimals.length <= 2) {
      // "12.5" pada input Indonesia lebih mungkin desimal daripada ribuan.
      if (/[1-9]/.test(decimals)) return null;
      normalized = unsigned.slice(0, lastDot);
    } else {
      normalized = unsigned.split('.').join('');
    }
  } else {
    normalized = unsigned;
  }

  normalized = normalized.replace(/[.,]/g, '');
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isSafeInteger(value)) return null;
  return sign * value;
}

/**
 * Parse kuantitas desimal (maksimal 4 angka desimal).
 * Menerima titik atau koma sebagai pemisah desimal, mis. "1,25" atau "1.25".
 */
export function parseDecimalInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,4})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const QUANTITY_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

/** Format kuantitas desimal tanpa menghilangkan pecahan penting. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return QUANTITY_FORMATTER.format(value);
}

export function parseIntegerInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!/^-?\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export function parseOptionalMoney(raw: string): number | null | undefined {
  if (raw.trim() === '') return null;
  const value = parseMoneyInput(raw);
  return value === null ? undefined : value;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
