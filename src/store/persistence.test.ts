import { describe, it, expect, beforeEach } from 'vitest';
import { emptyState, loadState, saveState, STORAGE_KEY, type PersistedState } from './persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty state when nothing is stored', () => {
    expect(loadState()).toEqual(emptyState());
  });

  it('round-trips a saved state', () => {
    const state: PersistedState = {
      ...emptyState(),
      currentDayIndex: 2,
      lastAdvanceDateKey: '2026-06-07',
      startedAt: '2026-06-06T09:00:00.000Z',
      records: { 1: { index: 1, firstOpenedAt: '2026-06-06T09:00:00.000Z', facetsRead: {} } },
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('discards state from an unknown version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, currentDayIndex: 7 }));
    expect(loadState()).toEqual(emptyState());
  });

  it('survives corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadState()).toEqual(emptyState());
  });
});
