// Thin client for the Studio dev API (scripts/lib/studioServer.ts). The Studio
// only runs against the Vite dev server, so these endpoints are always present
// when it is loaded.

import type { Day } from '@/content/types';
import type { Judgment } from '@/content/judgments';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string }).error ?? '';
    } catch {
      // no JSON body
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  return (await res.json()) as T;
}

export async function fetchDays(): Promise<Day[]> {
  return asJson<Day[]>(await fetch('/studio/days', { cache: 'no-store' }));
}

export async function fetchJudgments(): Promise<Judgment[]> {
  return asJson<Judgment[]>(await fetch('/studio/judgments', { cache: 'no-store' }));
}

export async function postJudgment(judgment: Judgment): Promise<Judgment> {
  return asJson<Judgment>(
    await fetch('/studio/judgments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(judgment),
    }),
  );
}

export async function deleteJudgment(id: string): Promise<void> {
  await asJson<{ removed: boolean }>(
    await fetch(`/studio/judgments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  );
}
