import type { PageRenderer } from '@/app/router';
import type { BomItem, BomItemInput, BomItemType } from '@/types/bom';
import { BOM_ITEM_TYPES } from '@/types/bom';
import { BOM_ITEM_TYPE_LABELS, BOM_ITEM_TYPE_TONES } from '@/app/labels';
import { formatNumber, formatQuantity, formatRupiah } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
  badge,
  card,
  confirmDialog,
  dataTable,
  emptyState,
  formActions,
  formErrorBanner,
  formField,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
  readDecimal,
  readMoney,
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

function componentName(item: BomItem): string {
  if (item.type === 'material') {
    return item.materialName ?? 'Material tidak ditemukan';
  }
  return item.label ?? 'Komponen';
}

export const productBomPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const productId = context.params.id ?? '';
  root.innerHTML = loadingBlock('Memuat BOM produk…');

  try {
    const product = await services.productService.get(productId);
    const [summary, materials] = await Promise.all([
      services.bomService.getSummary(productId),
      services.materialService.list(),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(`BOM ${product.name}`);

    const editId = context.query.get('edit');
    const editing = editId ? (summary.items.find((item) => item.id === editId) ?? null) : null;
    if (editId && !editing) {
      showToast('Komponen BOM yang akan diubah tidak ditemukan.', 'error');
    }
    const itemType: BomItemType = editing?.type ?? 'material';
    const materialOptions = materials.map((material) => ({
      value: material.id,
      label: `${material.name} (${material.unit}) · ${formatRupiah(material.unitCost)}/${material.unit}${
        material.status === 'inactive' ? ' · nonaktif' : ''
      }`,
    }));

    const rows = summary.items.map((item) => [
      `<span class="table-strong">${escapeHtml(componentName(item))}</span>${
        item.notes ? `<span class="table-sub">${escapeHtml(item.notes)}</span>` : ''
      }`,
      badge(BOM_ITEM_TYPE_LABELS[item.type], BOM_ITEM_TYPE_TONES[item.type]),
      item.type === 'material'
        ? `${formatQuantity(item.quantity)} ${escapeHtml(item.materialUnit ?? '')}`
        : '<span class="muted">per unit</span>',
      item.type === 'material'
        ? formatRupiah(item.materialUnitCost)
        : formatRupiah(item.amount),
      `<strong>${formatRupiah(item.lineCost)}</strong>`,
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#${`/products/${productId}/bom`}?edit=${encodeURIComponent(item.id)}">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-bom-item="${escapeAttr(item.id)}" aria-label="Hapus ${escapeAttr(componentName(item))}" title="Hapus">${icon('trash')}</button>
      </div>`,
    ]);

    const usingBom = summary.usingBom;
    const totalHpp = usingBom ? summary.totalCost : summary.activeCost;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: `BOM ${product.name}`,
        subtitle: `${product.sku} · HPP per unit dihitung dari material, tenaga kerja, dan overhead.`,
        actions: `
          <a class="btn btn-secondary" href="#/products/${product.id}">${icon('arrow-left')}<span>Kembali ke produk</span></a>
          ${linkButton(`/products/${product.id}/edit`, 'Ubah produk', 'btn btn-secondary', 'pencil')}
        `,
      })}

      <div class="production-stage-note">
        ${icon('info')}
        <p>HPP dari BOM menjadi HPP aktif produk dan dipakai sebagai snapshot pada pesanan baru. Pesanan lama tidak berubah. BOM hanya menghitung biaya, tanpa pencatatan stok material.</p>
      </div>

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Biaya material',
          value: formatRupiah(summary.materialCost),
          iconName: 'boxes',
          hint: `${formatNumber(summary.items.filter((item) => item.type === 'material').length)} komponen material`,
        })}
        ${kpiCard({
          label: 'Tenaga kerja',
          value: formatRupiah(summary.laborCost),
          iconName: 'user-round',
          hint: 'Biaya per unit produk',
        })}
        ${kpiCard({
          label: 'Overhead',
          value: formatRupiah(summary.overheadCost),
          iconName: 'factory',
          hint: 'Biaya tidak langsung per unit',
        })}
        ${kpiCard({
          label: 'HPP per unit',
          value: formatRupiah(totalHpp),
          iconName: 'calculator',
          tone: usingBom ? 'positive' : 'default',
          hint: usingBom ? 'Dihitung dari BOM' : 'Masih HPP manual',
        })}
      </div>

      ${card({
        title: 'Komponen BOM',
        subtitle: usingBom
          ? `${formatNumber(summary.componentCount)} komponen · total ${formatRupiah(summary.totalCost)} per unit`
          : 'Belum ada komponen. HPP manual produk masih dipakai.',
        actions: usingBom
          ? badge('HPP dari BOM', 'success')
          : badge('HPP manual', 'neutral'),
        padded: summary.items.length > 0,
        body:
          summary.items.length > 0
            ? dataTable(
                ['Komponen', 'Jenis', 'Kuantitas', 'Biaya satuan', 'Subtotal', ''],
                rows,
              )
            : emptyState({
                compact: true,
                iconName: 'boxes',
                title: 'BOM masih kosong',
                description:
                  'Tambahkan material, tenaga kerja, dan overhead di bawah. Setelah komponen pertama ditambahkan, HPP produk otomatis mengikuti total BOM.',
              }),
      })}

      <form class="form-card" id="bom-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>${editing ? 'Ubah komponen' : 'Tambah komponen'}</h2>
            <p>${
              editing
                ? 'Perubahan komponen akan menghitung ulang HPP produk.'
                : 'Pilih jenis komponen. Material memakai kuantitas, tenaga kerja dan overhead memakai nominal per unit.'
            }</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'type',
              label: 'Jenis komponen',
              type: 'select',
              value: itemType,
              required: true,
              options: BOM_ITEM_TYPES.map((type) => ({
                value: type,
                label: BOM_ITEM_TYPE_LABELS[type],
              })),
              idPrefix: 'bom',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              value: editing?.notes ?? '',
              placeholder: 'Opsional. Misalnya merek kain atau detail proses.',
              idPrefix: 'bom',
              span: true,
            })}
          </div>
        </div>

        <div class="form-section" data-bom-material-fields ${itemType === 'material' ? '' : 'hidden'}>
          <div class="form-section-head">
            <h2>Material</h2>
            <p>Kuantitas adalah kebutuhan material untuk satu unit produk. Contoh: 1,25 meter kain per kaos.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'materialId',
              label: 'Material',
              type: 'select',
              value: editing?.materialId ?? '',
              required: true,
              options: [{ value: '', label: 'Pilih material' }, ...materialOptions],
              help:
                materials.length === 0
                  ? 'Belum ada material. Tambahkan material terlebih dahulu melalui menu Material.'
                  : 'Biaya material mengikuti biaya satuan aktif.',
              idPrefix: 'bom',
              span: true,
            })}
            ${formField({
              name: 'quantity',
              label: 'Kuantitas per unit produk',
              type: 'decimal',
              value: editing?.type === 'material' ? editing.quantity : 1,
              required: true,
              placeholder: '1,5',
              help: 'Boleh desimal hingga 4 angka di belakang koma.',
              idPrefix: 'bom',
            })}
          </div>
          ${
            materials.length === 0
              ? `<div class="form-info">${icon('triangle-alert')} <p>Material belum tersedia. <a class="table-link" href="#/materials/new">Tambah material</a> untuk memakai komponen berbasis material.</p></div>`
              : ''
          }
        </div>

        <div class="form-section" data-bom-cost-fields ${itemType === 'material' ? 'hidden' : ''}>
          <div class="form-section-head">
            <h2>Tenaga kerja / overhead</h2>
            <p>Nominal adalah biaya per unit produk. Isi komponen secara terpisah agar laporan HPP mudah ditelusuri.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'label',
              label: 'Nama komponen',
              value: editing?.type !== 'material' ? (editing?.label ?? '') : '',
              required: true,
              placeholder: 'Contoh: Jahit per kaos atau listrik per unit',
              idPrefix: 'bom',
            })}
            ${formField({
              name: 'amount',
              label: 'Biaya per unit',
              type: 'money',
              value:
                editing && editing.type !== 'material' && editing.amount > 0
                  ? String(editing.amount)
                  : '',
              required: true,
              placeholder: '0',
              idPrefix: 'bom',
            })}
          </div>
        </div>

        ${formActions(editing ? 'Simpan komponen' : 'Tambah komponen', {
          submitIcon: editing ? 'save' : 'plus',
          cancelHref: editing ? `#/products/${productId}/bom` : '#/products',
        })}
      </form>

      ${card({
        title: 'Kebijakan HPP',
        body: `
          <div class="security-banner">
            ${icon('shield-check')}
            <p>Setiap perubahan BOM atau biaya material mencatat HPP baru pada riwayat produk. HPP tersebut hanya berlaku untuk pesanan baru; snapshot pesanan lama tetap utuh.</p>
          </div>
        `,
      })}
    `;

    const form = root.querySelector<HTMLFormElement>('#bom-form');
    if (!form) throw new Error('Formulir BOM tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const typeSelect = form.querySelector<HTMLSelectElement>('select[name="type"]');
    const materialFields = form.querySelector<HTMLElement>('[data-bom-material-fields]');
    const costFields = form.querySelector<HTMLElement>('[data-bom-cost-fields]');
    const toggleFields = (): void => {
      const type = typeSelect?.value ?? 'material';
      if (materialFields) materialFields.hidden = type !== 'material';
      if (costFields) costFields.hidden = type === 'material';
    };
    typeSelect?.addEventListener('change', toggleFields);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const type = readText(form, 'type') as BomItemType;
        let input: BomItemInput;
        if (type === 'material') {
          input = {
            type,
            materialId: readText(form, 'materialId') || null,
            quantity: readDecimal(form, 'quantity', 'Kuantitas', {
              required: true,
              min: 0.0001,
              max: 1_000_000,
            }),
            notes: readText(form, 'notes') || null,
          };
        } else {
          input = {
            type,
            label: readText(form, 'label'),
            amount: readMoney(form, 'amount', 'Biaya per unit', { required: true }),
            notes: readText(form, 'notes') || null,
          };
        }
        if (editing) {
          await services.bomService.updateItem(product.id, editing.id, input);
          showToast('Komponen BOM diperbarui.', 'success');
        } else {
          await services.bomService.addItem(product.id, input);
          showToast('Komponen BOM ditambahkan.', 'success');
        }
        context.navigate(`/products/${product.id}/bom`);
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
      }
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-bom-item]').forEach((button) => {
      button.addEventListener('click', async () => {
        const itemId = button.dataset.deleteBomItem ?? '';
        const item = summary.items.find((candidate) => candidate.id === itemId);
        if (!item) return;
        const confirmed = await confirmDialog({
          title: 'Hapus komponen BOM?',
          message: `Komponen "${componentName(item)}" akan dihapus dari BOM ${product.name}.`,
          confirmLabel: 'Hapus komponen',
          tone: 'danger',
          details: [
            `Jenis: ${BOM_ITEM_TYPE_LABELS[item.type]}`,
            `Subtotal: ${formatRupiah(item.lineCost)} per unit`,
            'HPP produk akan dihitung ulang dari komponen yang tersisa.',
          ],
        });
        if (!confirmed) return;
        setButtonLoading(button, true, 'Menghapus…');
        try {
          await services.bomService.removeItem(product.id, item.id);
          showToast('Komponen BOM dihapus.', 'success');
          context.refresh();
        } catch (error) {
          setButtonLoading(button, false);
          showToast(
            error instanceof Error ? error.message : 'Komponen gagal dihapus.',
            'error',
          );
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
