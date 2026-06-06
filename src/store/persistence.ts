// localStorage persistence for the parts of the app state that must survive a reload:
// the sequence position, the metric window anchor, and the per-day open / read records.
//
// A version field guards against future schema changes corrupting old state.

import type { FacetKey } from '@/content/types';

export const STORAGE_KEY = 'pantheon.state.v1';
export const STATE_VERSION = 1;

export interface PerDayRecord {
  index: number;
  firstOpenedAt: string; // ISO; presence means the day was opened (the open-rate signal)
  facetsRead: Partial<Record<FacetKey, string>>; // facet key -> first-read ISO timestamp
}

export interface PersistedState {
  version: number;
  currentDayIndex: number;
  lastAdvanceDateKey: string | null;
  startedAt: string | null;
  records: Record<number, PerDayRecord>;
}

export function emptyState(): PersistedState {
  return {
    version: STATE_VERSION,
    currentDayIndex: 1,
    lastAdvanceDateKey: null,
    startedAt: null,
    records: {},
  };
}

export function loadState(): PersistedState {
  if (typeof localStorage === 'undefined') return emptyState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    // Unknown / future versions: start fresh rather than risk corruption.
    if (parsed.version !== STATE_VERSION) return emptyState();
    return { ...emptyState(), ...parsed, version: STATE_VERSION };
  } catch {
    return emptyState();
  }
}

export function saveState(state: PersistedState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (e.g. private mode); the app still works in-memory.
  }
}
