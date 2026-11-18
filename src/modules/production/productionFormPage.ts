import type { PageRenderer } from '@/app/router';
import type { OrderDetail } from '@/types/entities';
import type { ProductionPriority, WorkOrderInput } from '@/types/production';
import { PRODUCTION_PRIORITIES } from '@/types/production';
import { PRODUCTION_PRIORITY_LABELS } from '@/app/labels';
import { formatBusinessDate } from '@/core/utils/date';
import { formatNumber } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
  card,
  emptyState,
  formActions,
  formErrorBanner,
  formField,
  linkButton,
  loadingBlock,
  pageHeader,
  readInteger,
  readOptionalText,
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

export const productionFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyiapkan formulir produksi…');

  try {
    const orderId = context.query.get('orderId');
    const orderItemId = context.query.get('orderItemId');
    let order: OrderDetail | null = null;
    let linkedItem: {
      id: string;
      productName: string;
      sku: string;
      quantity: number;
      remainingQty: number;
    } | null = null;

    if (orderId && orderItemId) {
      order = await services.orderService.getDetail(orderId);
      const remaining = await services.productionService.remainingItems(orderId);
      const item = remaining.find((candidate) => candidate.orderItemId === orderItemId);
      if (item) {
        linkedItem = {
          id: item.orderItemId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.orderedQty,
          remainingQty: item.remainingQty,
        };
      }
    }
    if (context.signal.aborted) return;
    context.setTitle(linkedItem ? 'Work order dari pesanan' : 'Work order baru');

    if (orderId && orderItemId && !linkedItem) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Produksi',
          title: 'Work order dari pesanan',
          actions: `<a class="btn btn-secondary" href="#/orders/${orderId}">${icon('arrow-left')}<span>Kembali ke pesanan</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'triangle-alert',
            title: 'Item pesanan tidak ditemukan',
            description:
              'Item yang dipilih tidak ada pada pesanan ini. Buka detail pesanan dan pilih item yang masih memiliki sisa kuantitas.',
            action: linkButton(`/orders/${orderId}`, 'Buka pesanan', 'btn btn-primary', 'shopping-bag'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    if (linkedItem && linkedItem.remainingQty <= 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Produksi',
          title: 'Work order dari pesanan',
          actions: `<a class="btn btn-secondary" href="#/orders/${order?.id ?? ''}">${icon('arrow-left')}<span>Kembali ke pesanan</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'circle-check',
            title: 'Semua kuantitas item sudah terjadwal',
            description:
              'Item pesanan ini sudah memiliki work order aktif untuk seluruh kuantitasnya. Buka work order yang ada atau batalkan salah satunya untuk membuat jadwal baru.',
            action: linkButton('/production', 'Lihat daftar produksi', 'btn btn-primary', 'factory'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const selectedPriority: ProductionPriority = 'normal';
    const quantityValue = linkedItem ? linkedItem.remainingQty : 1;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Produksi',
        title: linkedItem ? 'Work order dari pesanan' : 'Work order baru',
        subtitle: linkedItem
          ? 'Kuantitas dibatasi sisa item pesanan. Pecah pekerjaan menjadi beberapa work order bila perlu.'
          : 'Work order manual tidak terhubung ke pesanan, cocok untuk produksi stok atau pesanan khusus.',
        actions: `<a class="btn btn-secondary" href="#${linkedItem && order ? `/orders/${order.id}` : '/production'}">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      ${
        linkedItem && order
          ? card({
              title: 'Item pesanan',
              subtitle: `${order.storeName} · ${order.marketplaceOrderId} · ${formatBusinessDate(order.orderDate, 'long')}`,
              actions: linkButton(
                `/orders/${order.id}`,
                'Buka pesanan',
                'btn btn-ghost btn-sm',
                'external-link',
              ),
              body: `
                <dl class="detail-list detail-list-compact">
                  <div><dt>Produk</dt><dd><strong>${escapeHtml(linkedItem.productName)}</strong></dd></div>
                  <div><dt>SKU</dt><dd><code>${escapeHtml(linkedItem.sku || '-')}</code></dd></div>
                  <div><dt>Kuantitas pesanan</dt><dd>${formatNumber(linkedItem.quantity)} unit</dd></div>
                  <div><dt>Sisa belum terjadwal</dt><dd><strong>${formatNumber(linkedItem.remainingQty)} unit</strong></dd></div>
                </dl>
              `,
            })
          : ''
      }

      <form class="form-card" id="production-form" novalidate>
        ${formErrorBanner()}
        <input type="hidden" name="orderId" value="${escapeAttr(linkedItem && order ? order.id : '')}" />
        <input type="hidden" name="orderItemId" value="${escapeAttr(linkedItem?.id ?? '')}" />

        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail pekerjaan</h2>
            <p>${
              linkedItem
                ? 'Produk dan SKU mengikuti item pesanan. Isi kuantitas yang akan dikerjakan pada work order ini.'
                : 'Isi nama produk dan SKU secara manual. Work order manual tetap muncul pada daftar produksi.'
            }</p>
          </div>
          <div class="form-grid">
            ${
              linkedItem
                ? `
                  <div class="field">
                    <span class="field-label">Produk</span>
                    <p class="form-static-value">${escapeHtml(linkedItem.productName)}</p>
                  </div>
                  <div class="field">
                    <span class="field-label">SKU</span>
                    <p class="form-static-value"><code>${escapeHtml(linkedItem.sku || '-')}</code></p>
                  </div>
                `
                : `
                  ${formField({
                    name: 'productName',
                    label: 'Nama produk',
                    value: context.query.get('productName') ?? '',
                    required: true,
                    placeholder: 'Contoh: Kaos sablon lengan pendek',
                    idPrefix: 'production',
                  })}
                  ${formField({
                    name: 'sku',
                    label: 'SKU',
                    value: context.query.get('sku') ?? '',
                    placeholder: 'Contoh: KAOS-01',
                    idPrefix: 'production',
                  })}
                `
            }
            ${formField({
              name: 'qty',
              label: 'Kuantitas work order',
              type: 'integer',
              value: quantityValue,
              required: true,
              min: 1,
              max: linkedItem ? linkedItem.remainingQty : undefined,
              help: linkedItem
                ? `Maksimal ${formatNumber(linkedItem.remainingQty)} unit sesuai sisa item pesanan.`
                : 'Jumlah unit yang diproduksi dalam satu batch.',
              idPrefix: 'production',
            })}
            ${formField({
              name: 'deadline',
              label: 'Tenggat produksi',
              type: 'date',
              value: context.query.get('deadline') ?? '',
              help: 'Opsional. Work order yang melewati tenggat akan ditandai.',
              idPrefix: 'production',
            })}
            ${formField({
              name: 'priority',
              label: 'Prioritas',
              type: 'select',
              value: selectedPriority,
              required: true,
              options: PRODUCTION_PRIORITIES.map((priority) => ({
                value: priority,
                label: PRODUCTION_PRIORITY_LABELS[priority],
              })),
              idPrefix: 'production',
            })}
            ${formField({
              name: 'picName',
              label: 'PIC / vendor',
              value: '',
              placeholder: 'Contoh: Bu Sari atau CV Jahit Barokah',
              help: 'Penanggung jawab tahap saat ini. Dapat diubah nanti.',
              idPrefix: 'production',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: '',
              rows: 3,
              placeholder: 'Bahan, warna, ukuran, instruksi khusus…',
              idPrefix: 'production',
              span: true,
            })}
          </div>
        </div>

        ${formActions('Buat work order', {
          submitIcon: 'plus',
          cancelHref: linkedItem && order ? `#/orders/${order.id}` : '#/production',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#production-form');
    if (!form) throw new Error('Formulir produksi tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: WorkOrderInput = {
          orderId: readText(form, 'orderId') || null,
          orderItemId: readText(form, 'orderItemId') || null,
          productName: readText(form, 'productName'),
          sku: readText(form, 'sku'),
          qty: readInteger(form, 'qty', 'Kuantitas', { required: true, min: 1 }),
          deadline: readText(form, 'deadline') || null,
          priority: readText(form, 'priority') as ProductionPriority,
          picName: readOptionalText(form, 'picName'),
          notes: readOptionalText(form, 'notes'),
        };
        const workOrder = await services.productionService.create(input);
        showToast(`Work order ${workOrder.code} dibuat.`, 'success');
        context.navigate(`/production/${workOrder.id}`);
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
