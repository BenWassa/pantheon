import type { ManifestEntry } from '@/content/types';
import { loadManifest } from '@/content/loadManifest';
import { loadDay } from '@/content/loadDay';
import { contentUrl } from '@/content/urls';
import { fetchDays, fetchJudgments, postJudgment } from '@/studio/api';
import { appendLocal, loadLocal } from './localLog';
import type { StudioBackend } from './types';

// Talks to the Studio dev API: every day at every status, judgments appended to
// the on-disk ledger. Reachable only under `vite serve` (the dev/LAN workflow).
function liveBackend(): StudioBackend {
  return {
    mode: 'live',
    loadDays: fetchDays,
    loadJudgments: fetchJudgments,
    submit: async (judgment) => {
      await postJudgment(judgment);
    },
  };
}

// The backend GitHub Pages gets: static content + browser storage, no server.
function localBackend(): StudioBackend {
  return {
    mode: 'local',
    loadDays: async () => {
      const entries = await loadStudioManifest();
      const days = await Promise.all(entries.map((entry) => loadDay(entry)));
      return days.sort((a, b) => a.index - b.index);
    },
    loadJudgments: async () => loadLocal(),
    submit: async (judgment) => {
      appendLocal(judgment);
    },
  };
}

// Prefer a drafts-inclusive studio manifest when one was deployed (see
// build-manifest.ts --studio); otherwise fall back to the reader's published one.
async function loadStudioManifest(): Promise<ManifestEntry[]> {
  try {
    const res = await fetch(contentUrl('studio-manifest.json'), { cache: 'no-cache' });
    if (res.ok) {
      const manifest = (await res.json()) as { days?: ManifestEntry[] };
      if (Array.isArray(manifest.days)) return manifest.days;
    }
  } catch {
    // No studio manifest deployed; the published manifest is the source of truth.
  }
  return (await loadManifest()).days;
}

// Probe the dev API once. On GitHub Pages `/studio/days` is off-scope and fails
// fast, so the Studio quietly drops to local mode.
export async function detectBackend(signal?: AbortSignal): Promise<StudioBackend> {
  try {
    const res = await fetch('/studio/days', { method: 'GET', cache: 'no-store', signal });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) return liveBackend();
    }
  } catch {
    // Not running against the dev server: use local mode.
  }
  return localBackend();
}
