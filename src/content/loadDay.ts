import type { Day, ManifestEntry } from './types';
import { contentUrl } from './urls';

// Lazy-load a single day's JSON, one day at a time. Results are memoized so revisiting
// today's facets never refetches.
const cache = new Map<string, Day>();

export async function loadDay(entry: ManifestEntry): Promise<Day> {
  const cached = cache.get(entry.file);
  if (cached) return cached;

  const res = await fetch(contentUrl(entry.file), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load ${entry.file} (${res.status}).`);
  }
  const day = (await res.json()) as Day;
  cache.set(entry.file, day);
  return day;
}
