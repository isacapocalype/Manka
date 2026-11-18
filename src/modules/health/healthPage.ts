import type { PageRenderer } from '@/app/router';
import type { DataHealthCheck, DataHealthSeverity } from '@/types/health';
import { formatDateTime } from '@/core/utils/date';
import { formatNumber } from '@/core/utils/money';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  dataTable,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

const SEVERITY_TONES: Record<DataHealthSeverity, 'danger' | 'warning' | 'info'> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

function checkCard(check: DataHealthCheck): string {
  const healthy = check.count === 0;
  const status = healthy
    ? badge('Aman', 'success', true)
    : badge(`${formatNumber(check.count)} temuan`, SEVERITY_TONES[check.severity], true);
  const rows = check.items.map((item) => [
    `<a class="table-link" href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a>`,
    escapeHtml(item.description),
  ]);

  return card({
    title: check.title,
    subtitle: check.description,
    actions: healthy
      ? status
      : `<div class="health-card-actions">${status}${linkButton(check.actionHref, check.actionLabel, 'btn btn-secondary btn-sm', 'arrow-right')}</div>`,
    padded: check.items.length === 0,
    body:
      check.items.length === 0
        ? `<p class="inline-note note-success">${icon('circle-check')} Tidak ada masalah pada pemeriksaan ini.</p>`
        : `
          ${dataTable(['Item', 'Keterangan'], rows)}
          ${
            check.count > check.items.length
              ? `<p class="inline-note health-more">${icon('info')} Menampilkan ${formatNumber(check.items.length)} dari ${formatNumber(check.count)} temuan.</p>`
              : ''
          }
        `,
  });
}

export const healthPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memeriksa kesehatan data…');

  try {
    const report = await services.dataHealthService.check();
    if (context.signal.aborted) return;

    context.setTitle('Kesehatan data');
    const healthy = report.totalIssues === 0;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Perawatan data',
        title: 'Kesehatan data',
        subtitle: `Pemeriksaan terakhir ${formatDateTime(report.checkedAt)}`,
        actions: `
          ${linkButton('/settings', 'Buka pengaturan', 'btn btn-secondary', 'settings')}
          ${linkButton('/reports', 'Lihat laporan', 'btn btn-secondary', 'chart-column')}
        `,
      })}

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Total temuan',
          value: formatNumber(report.totalIssues),
          iconName: healthy ? 'shield-check' : 'triangle-alert',
          tone: healthy ? 'positive' : report.criticalChecks > 0 ? 'negative' : 'warning',
          hint: healthy ? 'Semua pemeriksaan aman' : 'Tinjau item di bawah',
        })}
        ${kpiCard({
          label: 'Pemeriksaan kritis',
          value: formatNumber(report.criticalChecks),
          iconName: 'shield-alert',
          tone: report.criticalChecks > 0 ? 'negative' : 'positive',
          hint: 'Prioritas utama',
        })}
        ${kpiCard({
          label: 'Peringatan',
          value: formatNumber(report.warningChecks),
          iconName: 'circle-alert',
          tone: report.warningChecks > 0 ? 'warning' : 'positive',
          hint: 'Perlu dilengkapi',
        })}
        ${kpiCard({
          label: 'Status data',
          value: healthy ? 'Sehat' : 'Perlu perhatian',
          iconName: healthy ? 'circle-check' : 'wrench',
          tone: healthy ? 'positive' : 'warning',
          hint: 'Diperiksa otomatis dari data lokal',
        })}
      </div>

      ${
        healthy
          ? `<p class="inline-note note-success">${icon('shield-check')} Tidak ada masalah yang terdeteksi. Tetap buat backup berkala agar data aman.</p>`
          : `<p class="inline-note note-warning">${icon('triangle-alert')} Beberapa pemeriksaan membutuhkan tindakan. Mulai dari temuan kritis di bawah.</p>`
      }

      <div class="dashboard-stack">
        ${report.checks.map((check) => checkCard(check)).join('')}
      </div>
    `;

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
