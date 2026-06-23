import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Judgment } from '@/content/judgments';
import { detectBackend } from './backend';

const sample: Judgment = {
  id: 'a',
  at: '2026-01-01T00:00:00.000Z',
  target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person' },
  verdict: 'keep',
  tags: [],
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('detectBackend', () => {
  it('falls back to local mode when the dev API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await detectBackend()).mode).toBe('local');
  });

  it('uses live mode when /studio/days returns an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    expect((await detectBackend()).mode).toBe('live');
  });

  it('local backend persists submitted judgments to storage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const backend = await detectBackend();
    await backend.submit(sample);
    expect((await backend.loadJudgments()).map((j) => j.id)).toEqual(['a']);
  });
});
