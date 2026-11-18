import type { PageRenderer } from '@/app/router';
import type { Material, MaterialInput, MaterialStatus } from '@/types/bom';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { formatDateTime } from '@/core/utils/date';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
  card,
  confirmDialog,
  formActions,
  formErrorBanner,
  formField,
  loadingBlock,
  pageHeader,
  readMoney,
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

export const materialFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat material…' : 'Menyiapkan formulir…');

  try {
    let material: Material | null = null;
    let usageCount = 0;
    if (id) {
      material = await services.materialService.get(id);
      usageCount = await services.materialService.usageCount(id);
    }
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah material' : 'Material baru');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: isEdit ? 'Ubah material' : 'Tambah material',
        subtitle: isEdit
          ? 'Perubahan biaya satuan otomatis menghitung ulang HPP produk yang memakai material ini melalui BOM.'
          : 'Material adalah bahan baku berbiaya. Tidak ada pencatatan stok; biaya satuan langsung dipakai pada BOM produk.',
        actions: `<a class="btn btn-secondary" href="#/materials">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="material-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail material</h2>
            <p>Nama material harus unik. Satuan menjelaskan basis biaya, misalnya meter, kg, atau pcs.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama material',
              value: material?.name ?? '',
              required: true,
              placeholder: 'Contoh: Kain katun combed 30s',
              idPrefix: 'material',
              span: true,
            })}
            ${formField({
              name: 'unit',
              label: 'Satuan',
              value: material?.unit ?? '',
              required: true,
              placeholder: 'meter, kg, pcs…',
              help: 'Biaya satuan dihitung per satuan ini.',
              idPrefix: 'material',
            })}
            ${formField({
              name: 'unitCost',
              label: 'Biaya satuan',
              type: 'money',
              value: material ? String(material.unitCost) : '',
              required: true,
              placeholder: '0',
              help: 'Nominal Rupiah bulat per satuan material.',
              idPrefix: 'material',
            })}
            ${formField({
              name: 'status',
              label: 'Status',
              type: 'select',
              value: material?.status ?? 'active',
              required: true,
              options: [
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Nonaktif' },
              ],
              help: 'Material nonaktif tetap muncul pada BOM lama, tetapi sebaiknya tidak dipakai untuk komponen baru.',
              idPrefix: 'material',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: material?.notes ?? '',
              rows: 3,
              placeholder: 'Spesifikasi, pemasok, atau catatan pembelian…',
              idPrefix: 'material',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Perubahan biaya material memengaruhi HPP produk pada BOM. HPP pada pesanan lama tidak berubah karena setiap item menyimpan snapshot HPP.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan material', {
          submitIcon: 'save',
          cancelHref: '#/materials',
        })}
      </form>

      ${
        isEdit && material
          ? `
            ${card({
              title: 'Penggunaan material',
              body: `
                <dl class="detail-list detail-list-compact">
                  <div><dt>Dipakai pada BOM</dt><dd>${formatNumber(usageCount)} komponen</dd></div>
                  <div><dt>Biaya satuan aktif</dt><dd>${formatRupiah(material.unitCost)} per ${escapeHtml(material.unit)}</dd></div>
                  <div><dt>Terakhir diubah</dt><dd>${formatDateTime(material.updatedAt)}</dd></div>
                </dl>
                ${
                  usageCount > 0
                    ? '<p class="inline-note note-warning">' +
                      icon('triangle-alert') +
                      ' Material yang masih dipakai pada BOM tidak dapat dihapus. Hapus komponennya dari BOM produk terlebih dahulu.</p>'
                    : '<p class="inline-note">' +
                      icon('circle-check') +
                      ' Material ini belum dipakai pada BOM dan dapat dihapus.</p>'
                }
              `,
            })}
            ${card({
              title: 'Hapus material',
              body: `
                <div class="danger-zone danger-row">
                  <div>
                    <strong>Hapus material secara permanen</strong>
                    <p>${
                      usageCount > 0
                        ? 'Material sedang dipakai pada BOM sehingga penghapusan akan ditolak.'
                        : 'Material akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'
                    }</p>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" data-delete-material>${icon('trash')}<span>Hapus material</span></button>
                </div>
              `,
            })}
          `
          : ''
      }
    `;

    const form = root.querySelector<HTMLFormElement>('#material-form');
    if (!form) throw new Error('Formulir material tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: MaterialInput = {
          name: readText(form, 'name'),
          unit: readText(form, 'unit'),
          unitCost: readMoney(form, 'unitCost', 'Biaya satuan', { required: true }),
          status: readText(form, 'status') as MaterialStatus,
          notes: readText(form, 'notes') || null,
        };
        if (isEdit && id) {
          await services.materialService.update(id, input);
          showToast('Material diperbarui.', 'success');
        } else {
          await services.materialService.create(input);
          showToast('Material dibuat.', 'success');
        }
        context.navigate('/materials');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
      }
    });

    root
      .querySelector<HTMLButtonElement>('[data-delete-material]')
      ?.addEventListener('click', async (event) => {
        if (!material) return;
        if (usageCount > 0) {
          showToast('Material masih dipakai pada BOM dan tidak dapat dihapus.', 'error');
          return;
        }
        const button = event.currentTarget as HTMLButtonElement;
        const confirmed = await confirmDialog({
          title: 'Hapus material?',
          message: `Material "${material.name}" akan dihapus permanen.`,
          confirmLabel: 'Hapus material',
          tone: 'danger',
          requireText: material.name,
        });
        if (!confirmed) return;
        setButtonLoading(button, true, 'Menghapus…');
        try {
          await services.materialService.delete(material.id);
          showToast('Material dihapus.', 'success');
          context.navigate('/materials');
        } catch (error) {
          setButtonLoading(button, false);
          showToast(
            error instanceof Error ? error.message : 'Material gagal dihapus.',
            'error',
          );
        }
      });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
