import type {
  ImportMappingValues,
  ImportTemplate,
  ImportType,
  StorePlatform,
} from '@/types/entities';
import { IMPORT_TYPES, STORE_PLATFORMS } from '@/types/entities';
import type { ImportTemplateWriteData, ImportTemplateRepository } from '@/core/repositories/importTemplateRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import { importFieldsFor, type ImportMapping } from '@/core/import-export/importFields';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  requiredText,
} from '@/core/utils/validation';

function validateImportType(value: string): ImportType {
  if (!IMPORT_TYPES.includes(value as ImportType)) {
    throw new ValidationError('Jenis import tidak valid.', {
      importType: 'Pilih jenis import.',
    });
  }
  return value as ImportType;
}

function validateMarketplace(value: string): StorePlatform {
  if (!STORE_PLATFORMS.includes(value as StorePlatform)) {
    throw new ValidationError('Marketplace tidak valid.', {
      marketplace: 'Pilih marketplace.',
    });
  }
  return value as StorePlatform;
}

export class ImportTemplateService {
  private readonly templates: ImportTemplateRepository;
  private readonly audit: AuditRepository;

  constructor(templates: ImportTemplateRepository, audit: AuditRepository) {
    this.templates = templates;
    this.audit = audit;
  }

  list(importType?: ImportType, marketplace?: StorePlatform): Promise<ImportTemplate[]> {
    return this.templates.list(importType, marketplace);
  }

  async get(id: string): Promise<ImportTemplate> {
    const template = await this.templates.get(id);
    if (!template) throw new NotFoundError('Template import tidak ditemukan.');
    return template;
  }

  private normalize(input: ImportTemplateWriteData): ImportTemplateWriteData {
    const name = requiredText(input.name, 'Nama template', 'name');
    if (name.length > 100) {
      throw new ValidationError('Nama template terlalu panjang.', {
        name: 'Nama template maksimal 100 karakter.',
      });
    }
    const marketplace = validateMarketplace(input.marketplace);
    const importType = validateImportType(input.importType);
    const fields = importFieldsFor(importType);
    const allowed = new Set<string>(fields.map((field) => field.key));
    const mapping: ImportMappingValues = {};
    for (const field of fields) mapping[field.key] = null;
    for (const [key, value] of Object.entries(input.mapping ?? {})) {
      if (!allowed.has(key)) continue;
      if (typeof value === 'string' && value.trim() !== '') {
        mapping[key] = value.trim().slice(0, 200);
      }
    }
    return { name, marketplace, importType, mapping };
  }

  private async assertUnique(data: ImportTemplateWriteData, excludeId?: string): Promise<void> {
    const existing = await this.templates.findByName(data.marketplace, data.importType, data.name);
    if (existing && existing.id !== excludeId) {
      throw new ConflictError(
        `Template "${data.name}" sudah ada untuk ${data.marketplace} dan jenis import ini.`,
      );
    }
  }

  async create(input: ImportTemplateWriteData): Promise<ImportTemplate> {
    const data = this.normalize(input);
    await this.assertUnique(data);
    try {
      const id = await this.templates.create(data);
      await this.audit.log('create', 'import_template', id, {
        name: data.name,
        marketplace: data.marketplace,
        importType: data.importType,
        mappedFields: Object.values(data.mapping).filter(Boolean).length,
      });
      return this.get(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          `Template "${data.name}" sudah ada untuk ${data.marketplace} dan jenis import ini.`,
        );
      }
      throw error;
    }
  }

  async update(id: string, input: ImportTemplateWriteData): Promise<ImportTemplate> {
    const existing = await this.get(id);
    const data = this.normalize(input);
    await this.assertUnique(data, existing.id);
    try {
      await this.templates.update(id, data);
      await this.audit.log('update', 'import_template', id, {
        name: data.name,
        marketplace: data.marketplace,
        importType: data.importType,
        mappedFields: Object.values(data.mapping).filter(Boolean).length,
      });
      return this.get(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          `Template "${data.name}" sudah ada untuk ${data.marketplace} dan jenis import ini.`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.get(id);
    await this.templates.delete(id);
    await this.audit.log('delete', 'import_template', id, {
      name: existing.name,
      importType: existing.importType,
    });
  }

  /** Pakai template pada header file: kolom yang tidak ada di file dikosongkan. */
  apply(template: ImportTemplate, headers: string[]): ImportMapping {
    const headerSet = new Set(headers);
    const mapping: ImportMapping = {};
    for (const field of importFieldsFor(template.importType)) {
      const column = template.mapping[field.key];
      mapping[field.key] = column && headerSet.has(column) ? column : null;
    }
    return mapping;
  }
}
