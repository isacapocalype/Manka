import { describe, expect, it } from 'vitest';
import {
  endOfWeek,
  resolvePeriod,
  startOfWeek,
  todayJakarta,
} from '@/core/utils/date';

describe('business period presets', () => {
  it('starts weeks on Monday and ends on Sunday', () => {
    expect(startOfWeek('2026-11-18')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-16')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-22')).toBe('2026-11-16');
    expect(endOfWeek('2026-11-18')).toBe('2026-11-22');
  });

  it('resolves the current week up to the reference date', () => {
    const period = resolvePeriod('thisWeek', undefined, '2026-11-18');
    expect(period.from).toBe('2026-11-16');
    expect(period.to).toBe('2026-11-18');
    expect(period.preset).toBe('thisWeek');
  });

  it('resolves the full previous week across a month boundary', () => {
    const period = resolvePeriod('lastWeek', undefined, '2026-12-02');
    expect(period.from).toBe('2026-11-23');
    expect(period.to).toBe('2026-11-29');
  });

  it('resolves monthly, yearly, and custom ranges', () => {
    expect(resolvePeriod('thisMonth', undefined, '2026-11-18')).toMatchObject({
      from: '2026-11-01',
      to: '2026-11-18',
    });
    expect(resolvePeriod('lastMonth', undefined, '2026-01-10')).toMatchObject({
      from: '2025-12-01',
      to: '2025-12-31',
    });
    expect(resolvePeriod('thisYear', undefined, '2026-11-18')).toMatchObject({
      from: '2026-01-01',
      to: '2026-11-18',
    });
    expect(
      resolvePeriod('custom', { from: '2026-11-20', to: '2026-11-01' }, '2026-11-18'),
    ).toMatchObject({
      from: '2026-11-01',
      to: '2026-11-20',
    });
  });

  it('computes the Jakarta business date in YYYY-MM-DD format', () => {
    expect(todayJakarta()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
