import type { PageRenderer } from '@/app/router';
import type {
  ProductionPriority,
  ProductionStage,
  WorkOrderStatus,
} from '@/types/production';
import {
  PRODUCTION_PRIORITIES,
  PRODUCTION_STAGES,
  WORK_ORDER_STATUSES,
} from '@/types/production';
import {
  PRODUCTION_PRIORITY_LABELS,
  PRODUCTION_STAGE_LABELS,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_TONES,
} from '@/app/labels';
import { formatNumber } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
} from '@/components/ui/ui';
import { buildRoute } from '@/components/ui/filters';
import { navigateQuery, renderPageError } from '@/app/pageUtils';
import { deadlineCell, priorityBadge, stageBadge } from './productionUi';

function parseStatus(value: string | null): WorkOrderStatus | 'all' {
  if (value === 'all') return 'all';
  return WORK_ORDER_STATUSES.includes(value as WorkOrderStatus)
    ? (value as WorkOrderStatus)
    : 'active';
}

function parseStage(value: string | null): ProductionStage | 'all' {
  return PRODUCTION_STAGES.includes(value as ProductionStage)
    ? (value as ProductionStage)
    : 'all';
}

function parsePriority(value: string | null): ProductionPriority | 'all' {
  return PRODUCTION_PRIORITIES.includes(value as ProductionPriority)
    ? (value as ProductionPriority)
    : 'all';
}

export const productionListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat produksi…');

  try {
    const status = parseStatus(context.query.get('status'));
    const stage = parseStage(context.query.get('stage'));
    const priority = parsePriority(context.query.get('priority'));
    const overdueOnly = context.query.get('overdue') === '1';
    const search = context.query.get('search')?.trim() ?? '';

    const result = await services.productionService.list({
      status,
      stage,
      priority,
      overdueOnly,
      search,
    });
    if (context.signal.aborted) return;
    context.setTitle('Produksi');

    const activeTotal = result.stageCounts.reduce((total, item) => total + item.count, 0);
    const overdueTotal = result.stageCounts.reduce((total, item) => total + item.overdue, 0);
    const queueTotal =
      result.stageCounts.find((item) => item.stage === 'antrian')?.count ?? 0;
    const hasFilters =
      status !== 'active' ||
      stage !== 'all' ||
      priority !== 'all' ||
      overdueOnly ||
      search !== '';

    const stageCards = result.stageCounts
      .map((item) => {
        const active = item.stage === stage;
        return `
          <a class="production-stage-card ${active ? 'is-active' : ''} ${item.overdue > 0 ? 'has-overdue' : ''}"
             href="#${buildRoute('/production', context.query, { stage: active ? null : item.stage, page: null })}">
            <span class="production-stage-name">${PRODUCTION_STAGE_LABELS[item.stage]}</span>
            <strong>${formatNumber(item.count)}</strong>
            <span class="production-stage-meta">${
              item.overdue > 0
                ? `<span class="value-negative">${formatNumber(item.overdue)} lewat tenggat</span>`
                : 'work order'
            }</span>
          </a>
        `;
      })
      .join('');

    const rows = result.items.map((workOrder) => [
      `<a class="table-link" href="#/production/${workOrder.id}"><code>${escapeHtml(workOrder.code)}</code></a>`,
      `<span class="table-strong">${escapeHtml(workOrder.productName)}</span>${workOrder.sku ? `<span class="table-sub">${escapeHtml(workOrder.sku)}</span>` : ''}`,
      workOrder.orderId
        ? `<a class="table-link" href="#/orders/${workOrder.orderId}">${escapeHtml(workOrder.orderMarketplaceId ?? 'Pesanan')}</a>${
            workOrder.storeName ? `<span class="table-sub">${escapeHtml(workOrder.storeName)}</span>` : ''
          }`
        : '<span class="muted">Manual</span>',
      `<span class="table-strong">${formatNumber(workOrder.qty)} unit</span>${
        workOrder.qtyPassed > 0 || workOrder.qtyDefect > 0
          ? `<span class="table-sub">Lolos ${formatNumber(workOrder.qtyPassed)} · Cacat ${formatNumber(workOrder.qtyDefect)}</span>`
          : ''
      }`,
      stageBadge(workOrder.currentStage),
      priorityBadge(workOrder.priority),
      deadlineCell(workOrder.deadline, workOrder.status),
      escapeHtml(workOrder.picName ?? '—'),
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/production/${workOrder.id}">Buka ${icon('arrow-right')}</a>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Operasional',
        title: 'Produksi',
        subtitle: `${formatNumber(activeTotal)} work order aktif · ${formatNumber(overdueTotal)} lewat tenggat. Progres produksi tidak mengubah status pesanan marketplace.`,
        actions: linkButton('/production/new', 'Work order baru', 'btn btn-primary', 'plus'),
      })}

      <div class="production-stage-grid">${stageCards}</div>

      <div class="kpi-grid kpi-grid-3">
        ${kpiCard({
          label: 'Work order aktif',
          value: formatNumber(activeTotal),
          iconName: 'factory',
          hint: 'Belum selesai atau dibatalkan',
        })}
        ${kpiCard({
          label: 'Lewat tenggat',
          value: formatNumber(overdueTotal),
          iconName: overdueTotal > 0 ? 'triangle-alert' : 'calendar',
          tone: overdueTotal > 0 ? 'negative' : 'positive',
          hint: overdueTotal > 0 ? 'Prioritaskan work order ini' : 'Semua sesuai tenggat',
        })}
        ${kpiCard({
          label: 'Menunggu antrian',
          value: formatNumber(queueTotal),
          iconName: 'clock',
          tone: queueTotal > 0 ? 'warning' : 'positive',
          hint: 'Belum masuk tahap potong',
        })}
      </div>

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="production-status">Status</label>
          <select class="input select" id="production-status" data-production-status>
            ${(['active', 'done', 'cancelled', 'all'] as const)
              .map(
                (value) =>
                  `<option value="${value}" ${status === value ? 'selected' : ''}>${
                    value === 'all' ? 'Semua status' : WORK_ORDER_STATUS_LABELS[value]
                  }</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="production-priority">Prioritas</label>
          <select class="input select" id="production-priority" data-production-priority>
            <option value="all" ${priority === 'all' ? 'selected' : ''}>Semua prioritas</option>
            ${PRODUCTION_PRIORITIES.map(
              (value) =>
                `<option value="${value}" ${priority === value ? 'selected' : ''}>${PRODUCTION_PRIORITY_LABELS[value]}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="production-overdue">Tenggat</label>
          <select class="input select" id="production-overdue" data-production-overdue>
            <option value="0" ${overdueOnly ? '' : 'selected'}>Semua tenggat</option>
            <option value="1" ${overdueOnly ? 'selected' : ''}>Hanya lewat tenggat</option>
          </select>
        </div>
        <form class="filter-search" data-production-search role="search">
          <label class="filter-label" for="production-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="production-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Kode, produk, SKU, PIC, pesanan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/production">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        result.items.length > 0
          ? card({
              title:
                stage === 'all'
                  ? 'Daftar work order'
                  : `Tahap ${PRODUCTION_STAGE_LABELS[stage]}`,
              subtitle: `${formatNumber(result.total)} work order pada filter aktif`,
              padded: false,
              actions:
                status !== 'all'
                  ? badge(WORK_ORDER_STATUS_LABELS[status], WORK_ORDER_STATUS_TONES[status])
                  : '',
              body: dataTable(
                ['Kode', 'Produk', 'Pesanan', 'Kuantitas', 'Tahap', 'Prioritas', 'Tenggat', 'PIC', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'factory',
                title: hasFilters ? 'Work order tidak ditemukan' : 'Belum ada work order',
                description: hasFilters
                  ? 'Tidak ada work order yang sesuai filter. Ubah status, tahap, prioritas, tenggat, atau kata kunci.'
                  : 'Buat work order dari item pesanan atau secara manual untuk mulai memantau tahap potong, jahit, finishing, QC, dan packing.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/production">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : `${linkButton('/production/new', 'Work order baru', 'btn btn-primary', 'plus')}
                     ${linkButton('/orders', 'Buat dari pesanan', 'btn btn-secondary', 'shopping-bag')}`,
              }),
            })
      }
    `;

    root
      .querySelector<HTMLSelectElement>('[data-production-status]')
      ?.addEventListener('change', (event) => {
        const target = event.currentTarget as HTMLSelectElement;
        navigateQuery(context, { status: target.value === 'active' ? null : target.value });
      });
    root
      .querySelector<HTMLSelectElement>('[data-production-priority]')
      ?.addEventListener('change', (event) => {
        const target = event.currentTarget as HTMLSelectElement;
        navigateQuery(context, { priority: target.value === 'all' ? null : target.value });
      });
    root
      .querySelector<HTMLSelectElement>('[data-production-overdue]')
      ?.addEventListener('change', (event) => {
        const target = event.currentTarget as HTMLSelectElement;
        navigateQuery(context, { overdue: target.value === '1' ? '1' : null });
      });
    const searchForm = root.querySelector<HTMLFormElement>('[data-production-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
