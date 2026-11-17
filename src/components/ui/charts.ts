import type { Chart, ChartConfiguration } from 'chart.js';
import { formatCompactRupiah, formatRupiah } from '@/core/utils/money';

const FONT_FAMILY = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  fillColor?: string;
  fill?: boolean;
}

export interface ChartOptions {
  currency?: boolean;
  signal?: AbortSignal;
}

async function loadChart(): Promise<typeof Chart> {
  const module = await import('chart.js/auto');
  return module.default;
}

function commonOptions(series: ChartSeries[], options: ChartOptions): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: series.length > 1,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          boxHeight: 7,
          padding: 16,
          color: '#667085',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#172033',
        titleColor: '#FFFFFF',
        bodyColor: '#E6EAF0',
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const raw = context.parsed.y;
            const value = typeof raw === 'number' ? raw : 0;
            const formatted = options.currency ? formatRupiah(value) : String(value);
            return ` ${context.dataset.label ?? ''}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#667085',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(230, 234, 240, 0.8)' },
        ticks: {
          color: '#667085',
          font: { size: 11 },
          callback: (value) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            return options.currency ? formatCompactRupiah(numeric) : String(numeric);
          },
        },
      },
    },
  };
}

export async function renderLineChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  series: ChartSeries[],
  options: ChartOptions = {},
): Promise<Chart<'line', number[], string> | null> {
  if (options.signal?.aborted) return null;
  const ChartClass = await loadChart();
  if (options.signal?.aborted) return null;
  ChartClass.defaults.font.family = FONT_FAMILY;
  ChartClass.defaults.color = '#667085';

  const configuration: ChartConfiguration<'line', number[], string> = {
    type: 'line',
    data: {
      labels,
      datasets: series.map((item) => ({
        label: item.label,
        data: item.data,
        borderColor: item.color,
        backgroundColor: item.fillColor ?? 'transparent',
        fill: item.fill ?? false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: item.color,
      })),
    },
    options: commonOptions(series, options) as ChartConfiguration<'line', number[], string>['options'],
  };
  return new ChartClass(canvas, configuration);
}

export async function renderBarChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  series: ChartSeries[],
  options: ChartOptions = {},
): Promise<Chart<'bar', number[], string> | null> {
  if (options.signal?.aborted) return null;
  const ChartClass = await loadChart();
  if (options.signal?.aborted) return null;
  ChartClass.defaults.font.family = FONT_FAMILY;
  ChartClass.defaults.color = '#667085';

  const configuration: ChartConfiguration<'bar', number[], string> = {
    type: 'bar',
    data: {
      labels,
      datasets: series.map((item) => ({
        label: item.label,
        data: item.data,
        backgroundColor: item.color,
        borderRadius: 5,
        maxBarThickness: 42,
      })),
    },
    options: commonOptions(series, options) as ChartConfiguration<'bar', number[], string>['options'],
  };
  return new ChartClass(canvas, configuration);
}
