import type { PersistedState } from './persistence';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export interface OpenRate {
  daysElapsed: number; // days into the window (1-based, capped at WINDOW_DAYS)
  daysOpened: number; // distinct days opened within the window
  rate: number; // 0..1
}

// The PRD's success metric: open rate over the 30-day window from first daily use.
// Computed on demand from the persisted records; no analytics backend.
export function computeOpenRate(state: PersistedState, now: Date = new Date()): OpenRate {
  if (!state.startedAt) return { daysElapsed: 0, daysOpened: 0, rate: 0 };

  const start = new Date(state.startedAt).getTime();
  const elapsed = Math.min(
    WINDOW_DAYS,
    Math.max(1, Math.floor((now.getTime() - start) / DAY_MS) + 1),
  );

  const windowEnd = start + WINDOW_DAYS * DAY_MS;
  const daysOpened = Object.values(state.records).filter((r) => {
    const t = new Date(r.firstOpenedAt).getTime();
    return t >= start && t < windowEnd;
  }).length;

  return { daysElapsed: elapsed, daysOpened, rate: daysOpened / elapsed };
}
