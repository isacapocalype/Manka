import type {
  Store,
  StoreFilters,
  StoreInput,
  StorePlatform,
  StoreSensitiveData,
  StoreStatus,
} from '@/types/entities';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import type { EncryptionService } from '@/core/crypto/secretStore';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
} from '@/core/utils/validation';
import { STORE_PLATFORMS } from '@/types/entities';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePlatform(value: string): StorePlatform {
  if (!STORE_PLATFORMS.includes(value as StorePlatform)) {
    throw new ValidationError('Platform toko tidak valid.', { platform: 'Pilih platform toko.' });
  }
  return value as StorePlatform;
}

function validateStatus(value: StoreStatus | undefined): StoreStatus {
  return value === 'archived' ? 'archived' : 'active';
}

function validateEmail(value: string | null | undefined): string | null {
  const email = optionalText(value, 254);
  if (email === null) return null;
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError('Format email tidak valid.', {
      email: 'Masukkan email yang valid, misalnya nama@toko.com.',
    });
  }
  return email;
}

function validatePhone(value: string | null | undefined): string | null {
  const phone = optionalText(value, 40);
  if (phone === null) return null;
  if (!/^[0-9+()\-\s]+$/.test(phone)) {
    throw new ValidationError('Nomor HP tidak valid.', {
      phone: 'Nomor HP hanya boleh berisi angka, spasi, +, -, atau tanda kurung.',
    });
  }
  return phone;
}

export class StoreService {
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;
  private readonly encryption: EncryptionService;

  constructor(
    stores: StoreRepository,
    audit: AuditRepository,
    encryption: EncryptionService,
  ) {
    this.stores = stores;
    this.audit = audit;
    this.encryption = encryption;
  }

  list(filters: StoreFilters = {}): Promise<Store[]> {
    return this.stores.list(filters);
  }

  listAll(): Promise<Store[]> {
    return this.stores.listAll();
  }

  async get(id: string): Promise<Store> {
    const store = await this.stores.getPublic(id);
    if (!store) throw new NotFoundError('Toko tidak ditemukan.');
    return store;
  }

  async create(input: StoreInput): Promise<Store> {
    const name = requiredText(input.name, 'Nama toko', 'name');
    if (name.length > 120) {
      throw new ValidationError('Nama toko terlalu panjang.', {
        name: 'Nama toko maksimal 120 karakter.',
      });
    }
    const platform = validatePlatform(input.platform);
    const email = validateEmail(input.email);
    const phone = validatePhone(input.phone);
    const ktpName = optionalText(input.ktpName, 150);
    const passwordEnc = await this.encryption.encrypt(input.password ?? null);
    const bankAccountEnc = await this.encryption.encrypt(input.bankAccount ?? null);
    const status = validateStatus(input.status);

    const store = await this.stores.create({
      name,
      platform,
      email,
      phone,
      ktpName,
      passwordEnc,
      bankAccountEnc,
      status,
    });
    await this.audit.log('create', 'store', store.id, { name, platform });
    return store;
  }

  async update(id: string, input: StoreInput): Promise<Store> {
    const existing = await this.stores.getRecord(id);
    if (!existing) throw new NotFoundError('Toko tidak ditemukan.');

    const name = requiredText(input.name, 'Nama toko', 'name');
    if (name.length > 120) {
      throw new ValidationError('Nama toko terlalu panjang.', {
        name: 'Nama toko maksimal 120 karakter.',
      });
    }
    const platform = validatePlatform(input.platform);
    const email = validateEmail(input.email);
    const phone = validatePhone(input.phone);
    const ktpName = optionalText(input.ktpName, 150);
    const status = validateStatus(input.status);

    let passwordEnc = existing.passwordEnc;
    if (input.password !== undefined) {
      passwordEnc = await this.encryption.encrypt(input.password);
    }
    let bankAccountEnc = existing.bankAccountEnc;
    if (input.bankAccount !== undefined) {
      bankAccountEnc = await this.encryption.encrypt(input.bankAccount);
    }

    const store = await this.stores.update(id, {
      name,
      platform,
      email,
      phone,
      ktpName,
      passwordEnc,
      bankAccountEnc,
      status,
    });
    await this.audit.log('update', 'store', id, { name, platform, status });
    return store;
  }

  async getSensitiveData(id: string): Promise<StoreSensitiveData> {
    const record = await this.stores.getRecord(id);
    if (!record) throw new NotFoundError('Toko tidak ditemukan.');
    try {
      const password = await this.encryption.decrypt(record.passwordEnc);
      const bankAccount = await this.encryption.decrypt(record.bankAccountEnc);
      await this.audit.log('reveal_sensitive', 'store', id, { fields: 'password,bank_account' });
      return { password, bankAccount };
    } catch {
      throw new Error(
        'Data sensitif tidak dapat dibuka. Kunci enkripsi perangkat mungkin berbeda dengan saat data disimpan.',
      );
    }
  }

  async archive(id: string): Promise<void> {
    await this.get(id);
    await this.stores.setStatus(id, 'archived');
    await this.audit.log('archive', 'store', id);
  }

  async restore(id: string): Promise<void> {
    await this.get(id);
    await this.stores.setStatus(id, 'active');
    await this.audit.log('restore', 'store', id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    const count = await this.stores.countTransactions(id);
    if (count > 0) {
      throw new ConflictError(
        'Toko ini memiliki transaksi terkait dan tidak dapat dihapus. Arsipkan toko untuk menyembunyikannya tanpa menghilangkan data.',
      );
    }
    await this.stores.delete(id);
    await this.audit.log('delete', 'store', id);
  }
}
