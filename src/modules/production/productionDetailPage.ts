import type { PageRenderer } from '@/app/router';
import type { ProductionPriority } from '@/types/production';
import { PRODUCTION_PRIORITIES, PRODUCTION_STAGES } from '@/types/production';
import {
  PRODUCTION_PRIORITY_LABELS,
  PRODUCTION_STAGE_LABELS,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_TONES,
} from '@/app/labels';
import { formatBusinessDate, formatDateTime, todayJakarta } from '@/core/utils/date';
import { formatNumber } from '@/core/utils/money';
import { escapeHtml } from '@/components/ui/dom';
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
  readInteger,
  readOptionalText,
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';
import { productionPipeline, stageBadge } from './productionUi';

export const productionDetailPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? '';
  root.innerHTML = loadingBlock('Memuat work order…');

  try {
    const workOrder = await services.productionService.get(id);
    if (context.signal.aborted) return;
    context.setTitle(workOrder.code);

    const active = workOrder.status === 'active' && workOrder.currentStage !== 'selesai';
    const currentIndex = PRODUCTION_STAGES.indexOf(workOrder.currentStage);
    const nextStage = PRODUCTION_STAGES[currentIndex + 1] ?? 'selesai';
    const qtyIn = workOrder.stages.length === 0 ? workOrder.qty : workOrder.qtyPassed;
    const currentLabel = PRODUCTION_STAGE_LABELS[workOrder.currentStage];
    const nextLabel = PRODUCTION_STAGE_LABELS[nextStage];
    const overdue =
      workOrder.status === 'active' &&
      workOrder.deadline !== null &&
      workOrder.deadline < todayJakarta();
    const progressPercent =
      workOrder.status === 'done' || workOrder.currentStage === 'selesai'
        ? 100
        : Math.round((currentIndex / (PRODUCTION_STAGES.length - 1)) * 100);

    const infoCard = card({
      title: 'Informasi work order',
      body: `
        <dl class="detail-list">
          <div><dt>Kode</dt><dd><code>${escapeHtml(workOrder.code)}</code></dd></div>
          <div><dt>Produk</dt><dd><strong>${escapeHtml(workOrder.productName)}</strong></dd></div>
          <div><dt>SKU</dt><dd><code>${escapeHtml(workOrder.sku || '-')}</code></dd></div>
          <div><dt>Pesanan</dt><dd>${
            workOrder.orderId
              ? `<a class="table-link" href="#/orders/${workOrder.orderId}">${escapeHtml(workOrder.orderMarketplaceId ?? 'Buka pesanan')}</a>`
              : '<span class="muted">Work order manual</span>'
          }</dd></div>
          <div><dt>Toko</dt><dd>${escapeHtml(workOrder.storeName ?? '-')}</dd></div>
          <div><dt>Prioritas</dt><dd>${badge(PRODUCTION_PRIORITY_LABELS[workOrder.priority], workOrder.priority === 'urgent' ? 'danger' : workOrder.priority === 'high' ? 'warning' : 'neutral')}</dd></div>
          <div><dt>PIC / vendor</dt><dd>${escapeHtml(workOrder.picName ?? '-')}</dd></div>
          <div><dt>Tenggat</dt><dd>${workOrder.deadline ? `${formatBusinessDate(workOrder.deadline, 'long')}${overdue ? ' · <span class="value-negative">lewat tenggat</span>' : ''}` : '<span class="muted">Tanpa tenggat</span>'}</dd></div>
          <div><dt>Dibuat</dt><dd>${formatDateTime(workOrder.createdAt)}</dd></div>
          <div><dt>Terakhir diubah</dt><dd>${formatDateTime(workOrder.updatedAt)}</dd></div>
        </dl>
        ${workOrder.notes ? `<div class="notes-block"><span class="sensitive-label">Catatan</span><p>${escapeHtml(workOrder.notes)}</p></div>` : ''}
      `,
    });

    const processCard = active
      ? card({
          title: `Selesaikan tahap ${currentLabel}`,
          subtitle:
            workOrder.currentStage === 'packing'
              ? 'Tahap terakhir. Setelah disimpan, work order ditandai selesai.'
              : `Setelah disimpan, work order berpindah ke tahap ${nextLabel}.`,
          body: `
            <div class="production-stage-note">
              ${icon('info')}
              <p>Kuantitas masuk tahap ini <strong>${formatNumber(qtyIn)} unit</strong>. Jumlah lolos dan cacat harus sama dengan kuantitas masuk. Untuk mengerjakan sebagian kuantitas, pecah menjadi work order terpisah.</p>
            </div>
            <form id="production-advance-form" data-qty-in="${qtyIn}" novalidate>
              ${formErrorBanner()}
              <div class="form-grid">
                ${formField({
                  name: 'qtyPassed',
                  label: 'Jumlah lolos',
                  type: 'integer',
                  value: qtyIn,
                  required: true,
                  min: 0,
                  max: qtyIn,
                  help: 'Unit yang lolos ke tahap berikutnya.',
                  idPrefix: 'advance',
                })}
                ${formField({
                  name: 'qtyDefect',
                  label: 'Jumlah cacat',
                  type: 'integer',
                  value: 0,
                  required: true,
                  min: 0,
                  max: qtyIn,
                  help: 'Unit cacat pada tahap ini. Cacat diakumulasikan.',
                  idPrefix: 'advance',
                })}
                ${formField({
                  name: 'picName',
                  label: 'PIC tahap ini',
                  value: workOrder.picName ?? '',
                  placeholder: 'Nama penanggung jawab',
                  idPrefix: 'advance',
                })}
                ${formField({
                  name: 'notes',
                  label: 'Catatan tahap',
                  type: 'textarea',
                  value: '',
                  rows: 3,
                  placeholder: 'Kendala, hasil pemeriksaan, atau instruksi…',
                  idPrefix: 'advance',
                  span: true,
                })}
              </div>
              ${formActions(
                workOrder.currentStage === 'packing' ? 'Selesaikan produksi' : `Selesaikan ${currentLabel}`,
                { submitIcon: 'check', cancelHref: '#/production' },
              )}
            </form>
          `,
        })
      : card({
          title: 'Produksi selesai',
          body: emptyState({
            compact: true,
            iconName: workOrder.status === 'cancelled' ? 'circle-x' : 'circle-check',
            title:
              workOrder.status === 'cancelled'
                ? 'Work order dibatalkan'
                : 'Work order sudah selesai',
            description:
              workOrder.status === 'cancelled'
                ? 'Work order ini tidak lagi dihitung sebagai jadwal produksi aktif.'
                : `Sebanyak ${formatNumber(workOrder.qtyPassed)} unit lolos dan ${formatNumber(workOrder.qtyDefect)} unit cacat tercatat.`,
          }),
        });

    const metadataCard = card({
      title: 'Ubah detail',
      subtitle: 'Tenggat, prioritas, PIC, dan catatan dapat diperbarui tanpa mengubah riwayat tahap.',
      body: `
        <form id="production-meta-form" novalidate>
          ${formErrorBanner()}
          <div class="form-grid">
            ${formField({
              name: 'deadline',
              label: 'Tenggat produksi',
              type: 'date',
              value: workOrder.deadline ?? '',
              idPrefix: 'meta',
            })}
            ${formField({
              name: 'priority',
              label: 'Prioritas',
              type: 'select',
              value: workOrder.priority,
              options: PRODUCTION_PRIORITIES.map((priority) => ({
                value: priority,
                label: PRODUCTION_PRIORITY_LABELS[priority],
              })),
              idPrefix: 'meta',
            })}
            ${formField({
              name: 'picName',
              label: 'PIC / vendor',
              value: workOrder.picName ?? '',
              placeholder: 'Nama penanggung jawab',
              idPrefix: 'meta',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: workOrder.notes ?? '',
              rows: 3,
              idPrefix: 'meta',
              span: true,
            })}
          </div>
          ${formActions('Simpan detail', { submitIcon: 'save', cancelHref: `#/production/${workOrder.id}` })}
        </form>
      `,
    });

    const cancelCard =
      workOrder.status === 'active'
        ? card({
            title: 'Batalkan work order',
            body: `
              <div class="danger-zone danger-row">
                <div>
                  <strong>Hentikan pekerjaan ini</strong>
                  <p>Work order dibatalkan dan kuantitasnya dilepas dari jadwal pesanan. Riwayat tahap tetap tersimpan.</p>
                </div>
                <button type="button" class="btn btn-danger btn-sm" data-cancel-work-order>${icon('x')}<span>Batalkan</span></button>
              </div>
            `,
          })
        : '';

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Produksi',
        title: workOrder.code,
        subtitle: `${workOrder.productName}${workOrder.sku ? ` · ${workOrder.sku}` : ''}`,
        actions: `
          <a class="btn btn-secondary" href="#/production">${icon('arrow-left')}<span>Kembali</span></a>
          ${
            workOrder.orderId
              ? linkButton(`/orders/${workOrder.orderId}`, 'Buka pesanan', 'btn btn-secondary', 'shopping-bag')
              : ''
          }
        `,
      })}

      <div class="detail-meta">
        ${stageBadge(workOrder.currentStage)}
        ${badge(WORK_ORDER_STATUS_LABELS[workOrder.status], WORK_ORDER_STATUS_TONES[workOrder.status])}
        ${overdue ? '<span class="inline-note note-warning">' + icon('triangle-alert') + ' Lewat tenggat</span>' : ''}
      </div>

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Kuantitas work order',
          value: `${formatNumber(workOrder.qty)} unit`,
          iconName: 'package',
          hint: workOrder.orderId ? 'Dari item pesanan' : 'Work order manual',
        })}
        ${kpiCard({
          label: 'Unit lolos',
          value: `${formatNumber(workOrder.qtyPassed)} unit`,
          iconName: 'circle-check',
          tone: workOrder.qtyPassed > 0 ? 'positive' : 'default',
          hint: 'Lolos dari tahap terakhir',
        })}
        ${kpiCard({
          label: 'Unit cacat',
          value: `${formatNumber(workOrder.qtyDefect)} unit`,
          iconName: workOrder.qtyDefect > 0 ? 'triangle-alert' : 'shield-check',
          tone: workOrder.qtyDefect > 0 ? 'warning' : 'positive',
          hint: 'Akumulasi seluruh tahap',
        })}
        ${kpiCard({
          label: 'Tenggat',
          value: workOrder.deadline ? formatBusinessDate(workOrder.deadline) : 'Tanpa tenggat',
          iconName: 'calendar',
          tone: overdue ? 'negative' : 'default',
          hint: overdue ? 'Sudah melewati tenggat' : 'Batas waktu produksi',
        })}
      </div>

      ${card({
        title: 'Progres tahap',
        subtitle: `${formatNumber(progressPercent)}% tahap selesai`,
        body: `
          <div class="production-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
            <span style="width: ${progressPercent}%"></span>
          </div>
          ${productionPipeline(workOrder.currentStage, workOrder.status)}
        `,
      })}

      <div class="detail-grid">
        ${infoCard}
        ${processCard}
      </div>

      <div class="detail-grid">
        ${metadataCard}
        ${cancelCard}
      </div>

      ${card({
        title: 'Riwayat tahap',
        subtitle:
          workOrder.stages.length > 0
            ? `${formatNumber(workOrder.stages.length)} tahap tercatat`
            : 'Belum ada tahap yang diselesaikan',
        padded: workOrder.stages.length === 0,
        body:
          workOrder.stages.length > 0
            ? dataTable(
                ['Tahap', 'Masuk', 'Lolos', 'Cacat', 'PIC', 'Selesai', 'Catatan'],
                workOrder.stages.map((stage) => [
                  PRODUCTION_STAGE_LABELS[stage.stage],
                  formatNumber(stage.qtyIn),
                  formatNumber(stage.qtyPassed),
                  stage.qtyDefect > 0
                    ? `<span class="value-negative">${formatNumber(stage.qtyDefect)}</span>`
                    : '0',
                  escapeHtml(stage.picName ?? '—'),
                  formatDateTime(stage.completedAt),
                  escapeHtml(stage.notes ?? ''),
                ]),
              )
            : emptyState({
                compact: true,
                iconName: 'clipboard-list',
                title: 'Belum ada riwayat',
                description: 'Selesaikan tahap pertama untuk mulai mencatat riwayat produksi.',
              }),
      })}
    `;

    const advanceForm = root.querySelector<HTMLFormElement>('#production-advance-form');
    if (advanceForm) {
      const qtyInForm = Number(advanceForm.dataset.qtyIn ?? '0');
      const passedInput = advanceForm.querySelector<HTMLInputElement>('input[name="qtyPassed"]');
      const defectInput = advanceForm.querySelector<HTMLInputElement>('input[name="qtyDefect"]');
      defectInput?.addEventListener('input', () => {
        if (!passedInput) return;
        const defect = Number(defectInput.value.replace(/[^0-9]/g, '')) || 0;
        passedInput.value = String(Math.max(0, qtyInForm - defect));
      });
      advanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = advanceForm.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (!submit) return;
        applyFormErrors(advanceForm, null);
        setButtonLoading(submit, true, 'Menyimpan…');
        try {
          await services.productionService.advance(workOrder.id, {
            qtyPassed: readInteger(advanceForm, 'qtyPassed', 'Jumlah lolos', {
              required: true,
              min: 0,
            }),
            qtyDefect: readInteger(advanceForm, 'qtyDefect', 'Jumlah cacat', {
              required: true,
              min: 0,
            }),
            picName: readOptionalText(advanceForm, 'picName'),
            notes: readOptionalText(advanceForm, 'notes'),
          });
          showToast(
            workOrder.currentStage === 'packing'
              ? 'Produksi selesai.'
              : `Tahap ${currentLabel} selesai. Work order masuk tahap ${nextLabel}.`,
            'success',
          );
          context.refresh();
        } catch (error) {
          applyFormErrors(advanceForm, error);
          setButtonLoading(submit, false);
        }
      });
    }

    const metaForm = root.querySelector<HTMLFormElement>('#production-meta-form');
    metaForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = metaForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (!submit) return;
      applyFormErrors(metaForm, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        await services.productionService.update(workOrder.id, {
          deadline: readText(metaForm, 'deadline') || null,
          priority: readText(metaForm, 'priority') as ProductionPriority,
          picName: readOptionalText(metaForm, 'picName'),
          notes: readOptionalText(metaForm, 'notes'),
        });
        showToast('Detail work order diperbarui.', 'success');
        context.refresh();
      } catch (error) {
        applyFormErrors(metaForm, error);
        setButtonLoading(submit, false);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-cancel-work-order]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const confirmed = await confirmDialog({
        title: 'Batalkan work order?',
        message: `Work order ${workOrder.code} akan dihentikan. Kuantitasnya dilepas dari jadwal pesanan.`,
        confirmLabel: 'Batalkan work order',
        tone: 'danger',
        details: [
          `Produk: ${workOrder.productName}`,
          `Kuantitas: ${formatNumber(workOrder.qty)} unit`,
          'Riwayat tahap yang sudah tercatat tetap tersimpan.',
        ],
      });
      if (!confirmed) return;
      setButtonLoading(button, true, 'Membatalkan…');
      try {
        await services.productionService.cancel(workOrder.id);
        showToast('Work order dibatalkan.', 'success');
        context.navigate('/production');
      } catch (error) {
        setButtonLoading(button, false);
        showToast(error instanceof Error ? error.message : 'Work order gagal dibatalkan.', 'error');
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
