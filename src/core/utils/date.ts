import type { BusinessDate, DateRange } from '@/types/entities';

export type PeriodPreset =
  | 'today'
  | 'thisWeek'
  | 'lastWeek'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export interface Period extends DateRange {
  preset: PeriodPreset;
  label: string;
}

export interface PeriodOption {
  value: PeriodPreset;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'today', label: 'Hari ini' },
  { value: 'thisWeek', label: 'Minggu ini' },
  { value: 'lastWeek', label: 'Minggu lalu' },
  { value: 'last7', label: '7 hari terakhir' },
  { value: 'last30', label: '30 hari terakhir' },
  { value: 'thisMonth', label: 'Bulan ini' },
  { value: 'lastMonth', label: 'Bulan lalu' },
  { value: 'thisYear', label: 'Tahun ini' },
  { value: 'custom', label: 'Rentang khusus' },
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const JAKARTA_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const SHORT_DATE = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const LONG_DATE = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const WEEKDAY_DATE = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATE_TIME = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toUtcDate(date: BusinessDate): Date {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    throw new Error(`Tanggal tidak valid: ${date}`);
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function fromUtcDate(date: Date): BusinessDate {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function todayJakarta(): BusinessDate {
  return JAKARTA_FORMATTER.format(new Date());
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isValidBusinessDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addDays(date: BusinessDate, amount: number): BusinessDate {
  const value = toUtcDate(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return fromUtcDate(value);
}

export function addMonths(date: BusinessDate, amount: number): BusinessDate {
  const value = toUtcDate(date);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + amount);
  const maxDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, maxDay));
  return fromUtcDate(value);
}

/** Senin sebagai awal minggu bisnis. */
export function startOfWeek(date: BusinessDate): BusinessDate {
  const value = toUtcDate(date);
  const day = value.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  return addDays(date, -offset);
}

export function endOfWeek(date: BusinessDate): BusinessDate {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: BusinessDate): BusinessDate {
  return `${date.slice(0, 7)}-01`;
}

export function endOfMonth(date: BusinessDate): BusinessDate {
  const value = toUtcDate(date);
  const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
  return fromUtcDate(end);
}

export function startOfYear(date: BusinessDate): BusinessDate {
  return `${date.slice(0, 4)}-01-01`;
}

export function endOfYear(date: BusinessDate): BusinessDate {
  return `${date.slice(0, 4)}-12-31`;
}

export function daysBetween(from: BusinessDate, to: BusinessDate): number {
  const start = toUtcDate(from).getTime();
  const end = toUtcDate(to).getTime();
  return Math.floor((end - start) / 86_400_000);
}

export function eachDate(from: BusinessDate, to: BusinessDate): BusinessDate[] {
  const total = daysBetween(from, to);
  const dates: BusinessDate[] = [];
  for (let index = 0; index <= total; index += 1) {
    dates.push(addDays(from, index));
  }
  return dates;
}

export function formatBusinessDate(date: BusinessDate, style: 'short' | 'long' | 'weekday' = 'short'): string {
  const value = toUtcDate(date);
  if (style === 'long') return LONG_DATE.format(value);
  if (style === 'weekday') return WEEKDAY_DATE.format(value);
  return SHORT_DATE.format(value);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME.format(date);
}

export function formatRangeLabel(from: BusinessDate, to: BusinessDate): string {
  if (from === to) return formatBusinessDate(from, 'long');
  return `${formatBusinessDate(from)} – ${formatBusinessDate(to)}`;
}

export function formatDateInput(date: BusinessDate): string {
  return date;
}

export function previousRange(range: DateRange): DateRange {
  const length = daysBetween(range.from, range.to) + 1;
  const previousTo = addDays(range.from, -1);
  const previousFrom = addDays(previousTo, -(length - 1));
  return { from: previousFrom, to: previousTo };
}

export function resolvePeriod(
  preset: PeriodPreset,
  custom?: Partial<DateRange>,
  referenceDate: BusinessDate = todayJakarta(),
): Period {
  let from: BusinessDate;
  let to: BusinessDate;

  switch (preset) {
    case 'today':
      from = referenceDate;
      to = referenceDate;
      break;
    case 'thisWeek':
      from = startOfWeek(referenceDate);
      to = referenceDate;
      break;
    case 'lastWeek': {
      const previousWeek = addDays(startOfWeek(referenceDate), -7);
      from = previousWeek;
      to = addDays(previousWeek, 6);
      break;
    }
    case 'last7':
      from = addDays(referenceDate, -6);
      to = referenceDate;
      break;
    case 'last30':
      from = addDays(referenceDate, -29);
      to = referenceDate;
      break;
    case 'thisMonth':
      from = startOfMonth(referenceDate);
      to = referenceDate;
      break;
    case 'lastMonth': {
      const previousMonth = addMonths(startOfMonth(referenceDate), -1);
      from = startOfMonth(previousMonth);
      to = endOfMonth(previousMonth);
      break;
    }
    case 'thisYear':
      from = startOfYear(referenceDate);
      to = referenceDate;
      break;
    case 'custom': {
      from = custom?.from ?? addDays(referenceDate, -29);
      to = custom?.to ?? referenceDate;
      if (!isValidBusinessDate(from) || !isValidBusinessDate(to)) {
        throw new Error('Rentang tanggal tidak valid.');
      }
      if (from > to) {
        [from, to] = [to, from];
      }
      break;
    }
    default: {
      const exhaustive: never = preset;
      throw new Error(`Periode tidak dikenal: ${String(exhaustive)}`);
    }
  }

  return { preset, from, to, label: formatRangeLabel(from, to) };
}

export function isWithin(date: BusinessDate, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

export function monthKey(date: BusinessDate): string {
  return date.slice(0, 7);
}
