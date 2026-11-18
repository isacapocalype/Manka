import type { PageRenderer } from '@/app/router';
import type { OrderStatus } from '@/types/entities';
import { ORDER_STATUSES } from '@/types/entities';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/app/labels';
import { isRevenueOrderStatus } from '@/core/calculations/orderMath';
import { formatBusinessDate, formatDateTime, todayJakarta } from '@/core/utils/date';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  confirmDialog,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';
import { stageBadge } from '@/modules/production/productionUi';

export const orderDetailPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? '';
  root.innerHTML = loadingBlock('Memuat pesanan…');

  try {
    const [order, workOrders] = await Promise.all([
      services.orderService.getDetail(id),
      services.productionService.listByOrder(id),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(order.marketplaceOrderId);

    const revenue = isRevenueOrderStatus(order.status);
    const productionBlocked = !revenue;
    const activeRefundQuantity = order.refunds
      .filter((refund) => refund.status !== 'rejected')
      .reduce((total, refund) => total + refund.quantity, 0);
    const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
    const canDelete = order.refunds.length === 0;

    const scheduledByItem = new Map<string, number>();
    for (const workOrder of workOrders) {
      if (!workOrder.orderItemId || workOrder.status === 'cancelled') continue;
      scheduledByItem.set(
        workOrder.orderItemId,
        (scheduledByItem.get(workOrder.orderItemId) ?? 0) + workOrder.qty,
      );
    }
    const workOrdersByItem = new Map<string, typeof workOrders>();
    for (const workOrder of workOrders) {
      if (!workOrder.orderItemId) continue;
      const existing = workOrdersByItem.get(workOrder.orderItemId) ?? [];
      existing.push(workOrder);
      workOrdersByItem.set(workOrder.orderItemId, existing);
    }
    const productionRows = order.items.map((item) => {
      const itemWorkOrders = workOrdersByItem.get(item.id) ?? [];
      const scheduled = scheduledByItem.get(item.id) ?? 0;
      const remaining = Math.max(0, item.quantity - scheduled);
      const workOrderLinks =
        itemWorkOrders.length > 0
          ? `<div class="production-links">${itemWorkOrders
              .map(
                (workOrder) =>
                  `<a class="table-link" href="#/production/${workOrder.id}"><code>${escapeHtml(workOrder.code)}</code></a>${stageBadge(workOrder.currentStage)}`,
              )
              .join('')}</div>`
          : '<span class="muted">Belum ada</span>';
      const action =
        remaining <= 0
          ? badge('Terjadwal penuh', 'success')
          : productionBlocked
            ? '<span class="muted">Tidak tersedia</span>'
            : `<a class="btn btn-secondary btn-sm" href="#/production/new?orderId=${encodeURIComponent(order.id)}&orderItemId=${encodeURIComponent(item.id)}">${icon('plus')}<span>Buat WO</span></a>`;
      return [
        `<span class="table-strong">${escapeHtml(item.productName)}</span>${
          item.sku ? `<span class="table-sub">${escapeHtml(item.sku)}</span>` : ''
        }`,
        formatNumber(item.quantity),
        formatNumber(scheduled),
        remaining > 0
          ? `<strong class="${productionBlocked ? '' : 'value-negative'}">${formatNumber(remaining)}</strong>`
          : '0',
        workOrderLinks,
        action,
      ];
    });

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Transaksi penjualan',
        title: order.marketplaceOrderId,
        subtitle: `${order.storeName} · ${formatBusinessDate(order.orderDate, 'long')}`,
        actions: `
          <a class="btn btn-secondary" href="#/orders">${icon('arrow-left')}<span>Kembali</span></a>
          ${linkButton(`/orders/${order.id}/edit`, 'Ubah pesanan', 'btn btn-primary', 'pencil')}
        `,
      })}

      <div class="detail-meta">
        ${badge(ORDER_STATUS_LABELS[order.status], ORDER_STATUS_TONES[order.status])}
        <a class="detail-meta-link" href="#/stores/${order.storeId}">${icon('store')} ${escapeHtml(order.storeName)}</a>
        ${revenue ? '' : `<span class="inline-note note-warning">${icon('triangle-alert')} Status ini tidak dihitung sebagai penjualan.</span>`}
      </div>

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Omzet kotor',
          value: formatRupiah(order.grossSales),
          iconName: 'coins',
          hint: `${formatNumber(totalQuantity)} unit · ${formatNumber(order.items.length)} item`,
        })}
        ${kpiCard({
          label: 'Penjualan bersih',
          value: revenue ? formatRupiah(order.netSales) : 'Tidak dihitung',
          iconName: 'banknote',
          hint: order.refundTotal > 0 ? `Setelah refund ${formatRupiah(order.refundTotal)}` : 'Sebelum biaya marketplace',
        })}
        ${kpiCard({
          label: 'HPP snapshot',
          value: formatRupiah(order.cogs),
          iconName: 'package',
          hint: 'Memakai HPP saat pesanan dibuat',
        })}
        ${kpiCard({
          label: 'Laba kotor estimasi',
          value: revenue ? formatRupiah(order.netSales - order.cogs) : '—',
          iconName: 'trending-up',
          tone: revenue && order.netSales - order.cogs >= 0 ? 'positive' : revenue ? 'negative' : 'default',
          hint: `Sebelum biaya marketplace ${formatRupiah(order.marketplaceFees)}`,
        })}
      </div>

      <div class="detail-grid">
        ${card({
          title: 'Informasi pesanan',
          body: `
            <dl class="detail-list">
              <div><dt>Toko</dt><dd><a class="table-link" href="#/stores/${order.storeId}">${escapeHtml(order.storeName)}</a></dd></div>
              <div><dt>Nomor marketplace</dt><dd><code>${escapeHtml(order.marketplaceOrderId)}</code></dd></div>
              <div><dt>Tanggal pesanan</dt><dd>${formatBusinessDate(order.orderDate, 'long')}</dd></div>
              <div><dt>Status</dt><dd>${badge(ORDER_STATUS_LABELS[order.status], ORDER_STATUS_TONES[order.status])}</dd></div>
              <div><dt>Diskon penjual</dt><dd>${formatRupiah(order.sellerDiscount)}</dd></div>
              <div><dt>Diskon marketplace</dt><dd>${formatRupiah(order.marketplaceDiscount)} <span class="muted">(tidak mengurangi pendapatan)</span></dd></div>
              <div><dt>Ongkir dibayar pembeli</dt><dd>${formatRupiah(order.shippingPaid)}</dd></div>
              <div><dt>Nilai pencairan</dt><dd>${order.settlementValue === null ? '<span class="muted">Belum diisi</span>' : formatRupiah(order.settlementValue)}</dd></div>
              <div><dt>Dibuat</dt><dd>${formatDateTime(order.createdAt)}</dd></div>
              <div><dt>Terakhir diubah</dt><dd>${formatDateTime(order.updatedAt)}</dd></div>
            </dl>
            ${order.notes ? `<div class="notes-block"><span class="sensitive-label">Catatan</span><p>${escapeHtml(order.notes)}</p></div>` : ''}
          `,
        })}
        ${card({
          title: 'Rincian keuangan pesanan',
          body: `
            <dl class="finance-breakdown">
              <div class="finance-row"><dt>Omzet item</dt><dd>${formatRupiah(order.grossSales)}</dd></div>
              <div class="finance-row"><dt>Diskon penjual</dt><dd class="value-negative">${formatRupiah(-order.sellerDiscount)}</dd></div>
              <div class="finance-row"><dt>Refund selesai</dt><dd class="value-negative">${formatRupiah(-order.refundTotal)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Penjualan bersih</dt><dd>${revenue ? formatRupiah(order.netSales) : 'Tidak dihitung'}</dd></div>
              <div class="finance-row"><dt>HPP snapshot</dt><dd class="value-negative">${formatRupiah(-order.cogs)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Laba kotor</dt><dd class="${revenue && order.netSales - order.cogs >= 0 ? 'value-positive' : revenue ? 'value-negative' : ''}">${revenue ? formatRupiah(order.netSales - order.cogs) : '—'}</dd></div>
              <div class="finance-row"><dt>Biaya marketplace tercatat</dt><dd class="value-negative">${formatRupiah(-order.marketplaceFees)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Estimasi laba sebelum iklan & operasional</dt><dd class="${revenue && order.estimatedProfit >= 0 ? 'value-positive' : revenue ? 'value-negative' : ''}">${revenue ? formatRupiah(order.estimatedProfit) : '—'}</dd></div>
            </dl>
            <p class="inline-note">${icon('info')} Biaya iklan dan operasional tidak dialokasikan per pesanan; keduanya dihitung pada laporan periode.</p>
          `,
        })}
      </div>

      ${card({
        title: 'Item pesanan',
        subtitle: 'HPP snapshot tersimpan permanen pada setiap item',
        padded: false,
        body: dataTable(
          ['Produk', 'SKU', 'Kuantitas', 'Harga satuan', 'HPP snapshot', 'Subtotal omzet', 'Subtotal HPP'],
          order.items.map((item) => [
            item.productId
              ? `<a class="table-link" href="#/products/${item.productId}">${escapeHtml(item.productName)}</a>`
              : `${escapeHtml(item.productName)}<span class="table-sub">Item manual</span>`,
            `<code>${escapeHtml(item.sku)}</code>`,
            formatNumber(item.quantity),
            formatRupiah(item.unitPrice),
            formatRupiah(item.hppSnapshot),
            formatRupiah(item.quantity * item.unitPrice),
            formatRupiah(item.quantity * item.hppSnapshot),
          ]),
        ),
      })}

      ${card({
        title: 'Produksi',
        subtitle:
          workOrders.length > 0
            ? `${formatNumber(workOrders.length)} work order terhubung ke pesanan ini. Perubahan status pesanan tidak mengubah progres produksi.`
            : 'Buat work order per item untuk memantau tahap produksi, PIC, tenggat, lolos, dan cacat.',
        actions: linkButton('/production', 'Semua produksi', 'btn btn-ghost btn-sm', 'factory'),
        padded: false,
        body: `
          ${
            productionBlocked
              ? `<p class="inline-note note-warning production-inline-note">${icon('triangle-alert')} Pesanan berstatus batal, retur, atau refund tidak dapat dibuatkan work order baru. Work order lama tetap dapat dilihat.</p>`
              : ''
          }
          ${dataTable(
            ['Produk', 'Dipesan', 'Terjadwal', 'Sisa', 'Work order', ''],
            productionRows,
          )}
        `,
      })}

      <div class="detail-grid">
        ${card({
          title: 'Biaya marketplace',
          subtitle: order.fees.length ? `${order.fees.length} biaya tercatat` : 'Belum ada biaya',
          actions: linkButton(
            `/finance/fees/new?storeId=${encodeURIComponent(order.storeId)}&orderId=${encodeURIComponent(order.id)}&feeDate=${order.orderDate}`,
            'Catat biaya',
            'btn btn-ghost btn-sm',
            'plus',
          ),
          padded: false,
          body: order.fees.length
            ? dataTable(
                ['Tanggal', 'Jenis', 'Sumber', 'Nominal', ''],
                order.fees.map((fee) => [
                  formatBusinessDate(fee.feeDate),
                  escapeHtml(fee.feeType),
                  badge(fee.source === 'actual' ? 'Aktual' : 'Estimasi', fee.source === 'actual' ? 'neutral' : 'warning'),
                  formatRupiah(fee.amount),
                  `<div class="table-actions">
                    <a class="btn btn-ghost btn-sm" href="#/finance/fees/${fee.id}/edit">Ubah</a>
                    <button type="button" class="btn btn-ghost btn-icon" data-delete-fee="${escapeAttr(fee.id)}" aria-label="Hapus biaya" title="Hapus biaya">${icon('trash')}</button>
                  </div>`,
                ]),
              )
            : emptyState({
                compact: true,
                iconName: 'credit-card',
                title: 'Belum ada biaya marketplace',
                description: 'Catat potongan aktual agar laba pesanan lebih akurat.',
                action: linkButton(
                  `/finance/fees/new?storeId=${encodeURIComponent(order.storeId)}&orderId=${encodeURIComponent(order.id)}&feeDate=${order.orderDate}`,
                  'Catat biaya',
                  'btn btn-secondary btn-sm',
                  'plus',
                ),
              }),
        })}

        ${card({
          title: 'Refund',
          subtitle:
            order.refunds.length > 0
              ? `${formatNumber(activeRefundQuantity)} dari ${formatNumber(totalQuantity)} barang direfund`
              : 'Belum ada refund',
          actions: linkButton(
            `/finance/refunds/new?orderId=${encodeURIComponent(order.id)}&refundDate=${todayJakarta()}`,
            'Catat refund',
            'btn btn-ghost btn-sm',
            'plus',
          ),
          padded: false,
          body: order.refunds.length
            ? dataTable(
                ['Tanggal', 'Nilai', 'Jumlah', 'Alasan', 'Status', ''],
                order.refunds.map((refund) => [
                  formatBusinessDate(refund.refundDate),
                  formatRupiah(refund.amount),
                  `${formatNumber(refund.quantity)} barang`,
                  escapeHtml(refund.reason),
                  badge(
                    refund.status === 'completed' ? 'Selesai' : refund.status === 'pending' ? 'Menunggu' : 'Ditolak',
                    refund.status === 'completed' ? 'success' : refund.status === 'pending' ? 'warning' : 'neutral',
                  ),
                  `<div class="table-actions">
                    <a class="btn btn-ghost btn-sm" href="#/finance/refunds/${refund.id}/edit">Ubah</a>
                    <button type="button" class="btn btn-ghost btn-icon" data-delete-refund="${escapeAttr(refund.id)}" aria-label="Hapus refund" title="Hapus refund">${icon('trash')}</button>
                  </div>`,
                ]),
              )
            : emptyState({
                compact: true,
                iconName: 'refresh-cw',
                title: 'Tidak ada refund',
                description: 'Refund hanya mengurangi penjualan bila pesanan masih dihitung sebagai penjualan.',
              }),
        })}
      </div>

      <div class="detail-grid">
        ${card({
          title: 'Perbarui status',
          body: `
            <form data-status-form class="inline-form">
              <div class="field">
                <label class="field-label" for="order-status-select">Status pesanan</label>
                <select class="input select" id="order-status-select" name="status">
                  ${ORDER_STATUSES.map(
                    (status) =>
                      `<option value="${status}" ${status === order.status ? 'selected' : ''}>${ORDER_STATUS_LABELS[status]}</option>`,
                  ).join('')}
                </select>
              </div>
              <button type="submit" class="btn btn-secondary">Simpan status</button>
            </form>
            <p class="inline-note">${icon('info')} Mengubah status memengaruhi perhitungan penjualan periode. Status batal, retur, dan refund tidak dihitung sebagai penjualan.</p>
          `,
        })}

        ${card({
          title: 'Hapus pesanan',
          body: `
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus pesanan permanen</strong>
                <p>${
                  canDelete
                    ? 'Biaya marketplace terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.'
                    : 'Pesanan memiliki refund dan tidak dapat dihapus. Hapus data refund terlebih dahulu.'
                }</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-delete-order ${canDelete ? '' : 'disabled'}>${icon('trash')}<span>Hapus pesanan</span></button>
            </div>
          `,
        })}
      </div>
    `;

    const statusForm = root.querySelector<HTMLFormElement>('[data-status-form]');
    statusForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const select = statusForm.querySelector<HTMLSelectElement>('select[name="status"]');
      const button = statusForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (!select || !button) return;
      if (select.value === order.status) {
        showToast('Status pesanan tidak berubah.', 'info');
        return;
      }
      const nextStatus = select.value as OrderStatus;
      setButtonLoading(button, true, 'Menyimpan…');
      try {
        await services.orderService.updateStatus(order.id, nextStatus);
        showToast('Status pesanan diperbarui.', 'success');
        context.refresh();
      } catch (error) {
        setButtonLoading(button, false);
        showToast(error instanceof Error ? error.message : 'Status gagal diperbarui.', 'error');
      }
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-fee]').forEach((button) => {
      button.addEventListener('click', async () => {
        const feeId = button.dataset.deleteFee ?? '';
        const fee = order.fees.find((item) => item.id === feeId);
        if (!fee) return;
        const confirmed = await confirmDialog({
          title: 'Hapus biaya marketplace?',
          message: `Biaya ${formatRupiah(fee.amount)} akan dihapus dari pesanan dan laporan.`,
          confirmLabel: 'Hapus biaya',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.feeService.delete(feeId);
          showToast('Biaya marketplace dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Biaya gagal dihapus.', 'error');
        }
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-refund]').forEach((button) => {
      button.addEventListener('click', async () => {
        const refundId = button.dataset.deleteRefund ?? '';
        const refund = order.refunds.find((item) => item.id === refundId);
        if (!refund) return;
        const confirmed = await confirmDialog({
          title: 'Hapus refund?',
          message: `Refund ${formatRupiah(refund.amount)} akan dihapus. Penjualan bersih pesanan akan dihitung ulang.`,
          confirmLabel: 'Hapus refund',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.refundService.delete(refundId);
          showToast('Refund dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Refund gagal dihapus.', 'error');
        }
      });
    });

    root.querySelector<HTMLButtonElement>('[data-delete-order]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const confirmed = await confirmDialog({
        title: 'Hapus pesanan?',
        message: `Pesanan "${order.marketplaceOrderId}" beserta item dan biaya marketplace-nya akan dihapus permanen.`,
        confirmLabel: 'Hapus pesanan',
        tone: 'danger',
        requireText: order.marketplaceOrderId,
        details: [
          `Toko: ${order.storeName}`,
          `Omzet: ${formatRupiah(order.grossSales)}`,
          'Refund harus dihapus terlebih dahulu.',
        ],
      });
      if (!confirmed) return;
      setButtonLoading(button, true, 'Menghapus…');
      try {
        await services.orderService.delete(order.id);
        showToast('Pesanan dihapus.', 'success');
        context.navigate('/orders');
      } catch (error) {
        setButtonLoading(button, false);
        showToast(error instanceof Error ? error.message : 'Pesanan gagal dihapus.', 'error');
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
