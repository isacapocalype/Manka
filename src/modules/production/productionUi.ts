import type { ProductionStage, WorkOrderStatus } from '@/types/production';
import { PRODUCTION_STAGES } from '@/types/production';
import {
  PRODUCTION_PRIORITY_LABELS,
  PRODUCTION_PRIORITY_TONES,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGE_TONES,
} from '@/app/labels';
import { formatBusinessDate, todayJakarta } from '@/core/utils/date';
import { badge } from '@/components/ui/ui';

export function stageBadge(stage: ProductionStage): string {
  return badge(PRODUCTION_STAGE_LABELS[stage], PRODUCTION_STAGE_TONES[stage]);
}

export function priorityBadge(priority: 'low' | 'normal' | 'high' | 'urgent'): string {
  return badge(PRODUCTION_PRIORITY_LABELS[priority], PRODUCTION_PRIORITY_TONES[priority]);
}

export function deadlineCell(
  deadline: string | null,
  status: WorkOrderStatus,
): string {
  if (!deadline) return '<span class="muted">Tanpa tenggat</span>';
  const overdue = status === 'active' && deadline < todayJakarta();
  return `<span class="${overdue ? 'value-negative' : ''}">${formatBusinessDate(deadline)}</span>${
    overdue ? '<span class="table-sub">Lewat tenggat</span>' : ''
  }`;
}

export function productionPipeline(
  currentStage: ProductionStage,
  status: WorkOrderStatus,
): string {
  const currentIndex = PRODUCTION_STAGES.indexOf(currentStage);
  return `
    <ol class="production-pipeline" aria-label="Tahap produksi">
      ${PRODUCTION_STAGES.map((stage, index) => {
        const done = status === 'done' || index < currentIndex;
        const current = status === 'active' && index === currentIndex;
        const classes = ['production-step'];
        if (done) classes.push('is-done');
        if (current) classes.push('is-current');
        if (status === 'cancelled') classes.push('is-cancelled');
        return `
          <li class="${classes.join(' ')}" ${current ? 'aria-current="step"' : ''}>
            <span class="production-step-dot">${done ? '✓' : index + 1}</span>
            <span class="production-step-label">${PRODUCTION_STAGE_LABELS[stage]}</span>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}
