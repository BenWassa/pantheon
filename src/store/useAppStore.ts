import { create } from 'zustand';
import type { Day, FacetKey, Manifest } from '@/content/types';
import { loadManifest } from '@/content/loadManifest';
import { loadDay } from '@/content/loadDay';
import { advanceSequence } from './dayAdvance';
import {
  emptyState,
  loadState,
  saveState,
  type PerDayRecord,
  type PersistedState,
} from './persistence';

interface AppState {
  // persisted slice
  persisted: PersistedState;

  // ephemeral
  manifest: Manifest | null;
  loadedDay: Day | null;
  loading: boolean;
  error: string | null;

  // actions
  init: (now?: Date) => Promise<void>;
  openCurrentDay: (now?: Date) => void;
  readFacet: (key: FacetKey, now?: Date) => void;
}

function persist(get: () => AppState): void {
  saveState(get().persisted);
}

export const useAppStore = create<AppState>((set, get) => ({
  persisted: emptyState(),
  manifest: null,
  loadedDay: null,
  loading: true,
  error: null,

  // Bootstraps the app: hydrate persisted state, load the manifest, run the
  // day-advance check, then lazy-load the current day.
  init: async (now = new Date()) => {
    set({ loading: true, error: null });
    try {
      const manifest = await loadManifest();
      const maxPublishedIndex = manifest.days.length;

      const hydrated = loadState();
      const seq = advanceSequence(
        {
          currentDayIndex: hydrated.currentDayIndex,
          lastAdvanceDateKey: hydrated.lastAdvanceDateKey,
          startedAt: hydrated.startedAt,
        },
        now,
        maxPublishedIndex,
      );
      const persisted: PersistedState = { ...hydrated, ...seq };

      const entry = manifest.days.find((d) => d.index === persisted.currentDayIndex);
      const loadedDay = entry ? await loadDay(entry) : null;

      set({ manifest, persisted, loadedDay, loading: false });
      persist(get);
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  // Records the first open of the current day (the open-rate metric signal).
  openCurrentDay: (now = new Date()) => {
    const { persisted } = get();
    const index = persisted.currentDayIndex;
    if (persisted.records[index]?.firstOpenedAt) return; // already recorded today

    const record: PerDayRecord = persisted.records[index] ?? {
      index,
      firstOpenedAt: now.toISOString(),
      facetsRead: {},
    };
    record.firstOpenedAt = record.firstOpenedAt || now.toISOString();

    set({
      persisted: { ...persisted, records: { ...persisted.records, [index]: record } },
    });
    persist(get);
  },

  // Marks a facet as read the first time it is revealed.
  readFacet: (key, now = new Date()) => {
    const { persisted } = get();
    const index = persisted.currentDayIndex;
    const existing: PerDayRecord = persisted.records[index] ?? {
      index,
      firstOpenedAt: now.toISOString(),
      facetsRead: {},
    };
    if (existing.facetsRead[key]) return; // already read

    const updated: PerDayRecord = {
      ...existing,
      facetsRead: { ...existing.facetsRead, [key]: now.toISOString() },
    };
    set({
      persisted: { ...persisted, records: { ...persisted.records, [index]: updated } },
    });
    persist(get);
  },
}));
