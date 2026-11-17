const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export interface BackupEnvelope {
  format: 'manka-backup';
  version: 1;
  createdAt: string;
  kdf: {
    name: 'PBKDF2-SHA256';
    iterations: number;
    salt: string;
  };
  cipher: {
    name: 'AES-GCM';
    iv: string;
  };
  payload: string;
}

const APP_CIPHER_PREFIX = 'v1';
const PBKDF2_ITERATIONS = 210_000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function generateEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', toArrayBuffer(raw), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Format payload: v1:<iv base64>:<ciphertext base64>. */
export async function encryptString(plainText: string, rawKey: Uint8Array): Promise<string> {
  const key = await importAesKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    TEXT_ENCODER.encode(plainText),
  );
  return `${APP_CIPHER_PREFIX}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptString(payload: string, rawKey: Uint8Array): Promise<string> {
  const parts = payload.split(':');
  if (parts.length !== 3 || parts[0] !== APP_CIPHER_PREFIX) {
    throw new Error('Format data terenkripsi tidak dikenali.');
  }
  const ivPart = parts[1];
  const cipherPart = parts[2];
  if (!ivPart || !cipherPart) throw new Error('Data terenkripsi tidak lengkap.');
  const key = await importAesKey(rawKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(ivPart)) },
    key,
    toArrayBuffer(base64ToBytes(cipherPart)),
  );
  return TEXT_DECODER.decode(decrypted);
}

async function deriveBackupKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function createBackupEnvelope(
  plainText: string,
  password: string,
  createdAt: string,
): Promise<BackupEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(password, salt, PBKDF2_ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    TEXT_ENCODER.encode(plainText),
  );
  return {
    format: 'manka-backup',
    version: 1,
    createdAt,
    kdf: {
      name: 'PBKDF2-SHA256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: {
      name: 'AES-GCM',
      iv: bytesToBase64(iv),
    },
    payload: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function openBackupEnvelope(
  envelope: BackupEnvelope,
  password: string,
): Promise<string> {
  if (
    envelope.format !== 'manka-backup' ||
    envelope.version !== 1 ||
    envelope.kdf?.name !== 'PBKDF2-SHA256' ||
    envelope.cipher?.name !== 'AES-GCM'
  ) {
    throw new Error('Format backup tidak didukung.');
  }
  if (
    !Number.isSafeInteger(envelope.kdf.iterations) ||
    envelope.kdf.iterations < 100_000 ||
    envelope.kdf.iterations > 1_000_000
  ) {
    throw new Error('Parameter keamanan backup tidak valid.');
  }
  const salt = base64ToBytes(envelope.kdf.salt);
  const iv = base64ToBytes(envelope.cipher.iv);
  const key = await deriveBackupKey(password, salt, envelope.kdf.iterations);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(base64ToBytes(envelope.payload)),
    );
    return TEXT_DECODER.decode(decrypted);
  } catch {
    throw new Error('Kata sandi backup salah atau file backup rusak.');
  }
}
