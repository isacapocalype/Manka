import { describe, expect, it } from 'vitest';
import {
  createBackupEnvelope,
  decryptString,
  encryptString,
  generateEncryptionKey,
  openBackupEnvelope,
} from '@/core/crypto/encryption';
import { MemorySecretStore, EncryptionService } from '@/core/crypto/secretStore';

describe('app field encryption', () => {
  it('round-trips a value with AES-GCM', async () => {
    const key = generateEncryptionKey();
    const payload = await encryptString('rahasia-toko-123', key);
    expect(payload.startsWith('v1:')).toBe(true);
    expect(payload).not.toContain('rahasia-toko-123');
    await expect(decryptString(payload, key)).resolves.toBe('rahasia-toko-123');
  });

  it('uses a fresh IV for each encryption', async () => {
    const key = generateEncryptionKey();
    const first = await encryptString('sama', key);
    const second = await encryptString('sama', key);
    expect(first).not.toBe(second);
  });

  it('fails with the wrong key or malformed payload', async () => {
    const key = generateEncryptionKey();
    const payload = await encryptString('sama', key);
    await expect(decryptString(payload, generateEncryptionKey())).rejects.toThrow();
    await expect(decryptString('plaintext', key)).rejects.toThrow();
  });

  it('persists a generated key in the secret store, never in the database', async () => {
    const store = new MemorySecretStore();
    const first = new EncryptionService(store);
    const encrypted = await first.encrypt('nomor-rekening');
    expect(encrypted).not.toBeNull();

    const second = new EncryptionService(store);
    await expect(second.decrypt(encrypted)).resolves.toBe('nomor-rekening');
    await expect(second.exportKeyBase64()).resolves.toBe(
      await first.exportKeyBase64(),
    );
  });

  it('returns null for empty sensitive values', async () => {
    const service = new EncryptionService(new MemorySecretStore());
    await expect(service.encrypt('')).resolves.toBeNull();
    await expect(service.encrypt(null)).resolves.toBeNull();
    await expect(service.decrypt(null)).resolves.toBeNull();
  });
});

describe('backup envelope', () => {
  it('round-trips the payload with a password', async () => {
    const envelope = await createBackupEnvelope(
      JSON.stringify({ hello: 'dunia' }),
      'kata-sandi-kuat',
      '2026-01-01T00:00:00.000Z',
    );
    expect(envelope.format).toBe('manka-backup');
    expect(envelope.payload).not.toContain('dunia');
    await expect(openBackupEnvelope(envelope, 'kata-sandi-kuat')).resolves.toBe(
      JSON.stringify({ hello: 'dunia' }),
    );
  });

  it('rejects a wrong password and tampered ciphertext', async () => {
    const envelope = await createBackupEnvelope('data', 'kata-sandi-kuat', '2026-01-01T00:00:00.000Z');
    await expect(openBackupEnvelope(envelope, 'kata-sandi-salah')).rejects.toThrow(
      /Kata sandi backup salah/,
    );
    const tampered = { ...envelope, payload: `${envelope.payload.slice(0, -4)}AAAA` };
    await expect(openBackupEnvelope(tampered, 'kata-sandi-kuat')).rejects.toThrow();
  });

  it('rejects weak KDF parameters', async () => {
    const envelope = await createBackupEnvelope('data', 'kata-sandi-kuat', '2026-01-01T00:00:00.000Z');
    const weak = { ...envelope, kdf: { ...envelope.kdf, iterations: 1_000 } };
    await expect(openBackupEnvelope(weak, 'kata-sandi-kuat')).rejects.toThrow(
      /Parameter keamanan/,
    );
  });
});
