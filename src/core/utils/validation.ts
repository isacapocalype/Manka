export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Data tidak ditemukan.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export function requiredText(value: string | null | undefined, label: string, field: string): string {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') {
    throw new ValidationError(`${label} wajib diisi.`, { [field]: `${label} wajib diisi.` });
  }
  return trimmed;
}

export function optionalText(value: string | null | undefined, maxLength = 2000): string | null {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return null;
  return trimmed.slice(0, maxLength);
}

export function requireMaxLength(
  value: string,
  label: string,
  maxLength: number,
  field: string,
): string {
  if (value.length > maxLength) {
    throw new ValidationError(`${label} maksimal ${maxLength} karakter.`, {
      [field]: `${label} maksimal ${maxLength} karakter.`,
    });
  }
  return value;
}

export function validateMoney(
  value: number | null | undefined,
  label: string,
  field: string,
  options: { min?: number; required?: boolean } = {},
): number {
  const { min = 0, required = true } = options;
  if (value === null || value === undefined) {
    if (!required) return 0;
    throw new ValidationError(`${label} wajib diisi.`, { [field]: `${label} wajib diisi.` });
  }
  if (!Number.isSafeInteger(value) || value < min) {
    throw new ValidationError(`${label} tidak valid.`, {
      [field]: `${label} harus berupa angka bulat minimal ${min}.`,
    });
  }
  return value;
}

export function validateQuantity(value: number | null | undefined, label: string, field: string): number {
  if (value === null || value === undefined || !Number.isSafeInteger(value) || value <= 0) {
    throw new ValidationError(`${label} tidak valid.`, {
      [field]: `${label} harus berupa bilangan bulat lebih dari 0.`,
    });
  }
  return value;
}

export function validateOptionalNonNegative(
  value: number | null | undefined,
  label: string,
  field: string,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ValidationError(`${label} tidak valid.`, {
      [field]: `${label} harus berupa angka bulat minimal 0.`,
    });
  }
  return value;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /UNIQUE constraint failed/i.test(error.message);
}

export function isForeignKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /FOREIGN KEY constraint failed/i.test(error.message);
}

export function isCheckConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /CHECK constraint failed/i.test(error.message);
}

export function errorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof ConflictError) return error.message;
  if (error instanceof NotFoundError) return error.message;
  if (error instanceof Error) {
    if (/UNIQUE constraint failed/i.test(error.message)) {
      return 'Data dengan nilai unik tersebut sudah ada.';
    }
    if (/FOREIGN KEY constraint failed/i.test(error.message)) {
      return 'Data ini masih terkait dengan data lain.';
    }
    if (/CHECK constraint failed/i.test(error.message)) {
      return 'Data tidak memenuhi aturan yang disyaratkan.';
    }
  }
  return fallback;
}

export function assertCondition(
  condition: boolean,
  message: string,
  field?: string,
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, field ? { [field]: message } : {});
  }
}
