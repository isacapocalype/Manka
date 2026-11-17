import { Preferences } from '@capacitor/preferences';
import {
  bytesToBase64,
  base64ToBytes,
  decryptString,
  encryptString,
  generateEncryptionKey,
} from './encryption';

export interface SecretStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const KEY_SETTING = 'manka.encryption.key.v1';

export class PreferencesSecretStore implements SecretStore {
  async get(key: string): Promise<string | null> {
    const result = await Preferences.get({ key });
    return result.value;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }
}

export class MemorySecretStore implements SecretStore {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

/**
 * Kunci enkripsi dibuat acak di perangkat dan tidak pernah ditulis di source code.
 * Kunci disimpan terpisah dari database utama.
 */
export class EncryptionService {
  private readonly store: SecretStore;
  private keyPromise: Promise<Uint8Array> | null = null;

  constructor(store: SecretStore = new PreferencesSecretStore()) {
    this.store = store;
  }

  private async loadKey(): Promise<Uint8Array> {
    if (!this.keyPromise) {
      this.keyPromise = (async () => {
        const stored = await this.store.get(KEY_SETTING);
        if (stored) {
          return base64ToBytes(stored);
        }
        const key = generateEncryptionKey();
        await this.store.set(KEY_SETTING, bytesToBase64(key));
        return key;
      })();
    }
    return this.keyPromise;
  }

  async encrypt(value: string | null | undefined): Promise<string | null> {
    if (value === null || value === undefined || value.trim() === '') return null;
    const key = await this.loadKey();
    return encryptString(value, key);
  }

  async decrypt(value: string | null | undefined): Promise<string | null> {
    if (!value) return null;
    const key = await this.loadKey();
    return decryptString(value, key);
  }

  async exportKeyBase64(): Promise<string> {
    return bytesToBase64(await this.loadKey());
  }

  /** Dipakai setelah restore backup yang valid. */
  async replaceKey(base64: string): Promise<void> {
    const key = base64ToBytes(base64);
    if (key.length !== 32) {
      throw new Error('Kunci enkripsi backup tidak valid.');
    }
    await this.store.set(KEY_SETTING, base64);
    this.keyPromise = Promise.resolve(key);
  }
}
