import { describe, it, expect, beforeEach } from 'vitest';
import type { Judgment } from '@/content/judgments';
import {
  appendLocal,
  exportJsonl,
  exportSummary,
  loadLocal,
  mergeJudgments,
  parseImport,
  removeLocal,
} from './localLog';

function mk(
  id: string,
  at = '2026-01-01T00:00:00.000Z',
  verdict: Judgment['verdict'] = 'keep',
  facet: 'person' | 'picture' = 'person',
): Judgment {
  return {
    id,
    at,
    target: { level: 'facet', day: 1, slug: 'hubris', facet },
    verdict,
    tags: [],
  };
}

beforeEach(() => localStorage.clear());

describe('localLog', () => {
  it('appends and loads in order', () => {
    appendLocal(mk('a'));
    appendLocal(mk('b'));
    expect(loadLocal().map((j) => j.id)).toEqual(['a', 'b']);
  });

  it('removes by id', () => {
    appendLocal(mk('a'));
    appendLocal(mk('b'));
    removeLocal('a');
    expect(loadLocal().map((j) => j.id)).toEqual(['b']);
  });

  it('ignores a stored envelope from another version', () => {
    localStorage.setItem(
      'pantheon.studio.judgments.v1',
      JSON.stringify({ version: 99, judgments: [mk('x')] }),
    );
    expect(loadLocal()).toEqual([]);
  });

  it('merges by id without duplicates, newest value winning, sorted by time', () => {
    const a = [mk('a', '2026-01-01T00:00:00.000Z')];
    const b = [mk('a', '2026-01-02T00:00:00.000Z'), mk('c', '2026-01-03T00:00:00.000Z')];
    const merged = mergeJudgments(a, b);
    expect(merged.map((j) => j.id)).toEqual(['a', 'c']);
    expect(merged.find((j) => j.id === 'a')?.at).toBe('2026-01-02T00:00:00.000Z');
  });

  it('exports one current opinion per target as JSONL', () => {
    const older = mk('a', '2026-01-01T00:00:00.000Z', 'keep');
    const newer = mk('b', '2026-01-02T00:00:00.000Z', 'cut'); // same target, later
    const lines = exportJsonl([older, newer]).trim().split('\n');
    expect(lines).toHaveLength(1);
    expect((JSON.parse(lines[0] ?? '{}') as Judgment).verdict).toBe('cut');
  });

  it('keeps distinct targets separate on export', () => {
    const text = exportJsonl([
      mk('a', '2026-01-01T00:00:00.000Z', 'keep', 'person'),
      mk('b', '2026-01-01T00:00:00.000Z', 'cut', 'picture'),
    ]);
    expect(text.trim().split('\n')).toHaveLength(2);
  });

  it('summarises the current opinion per target as readable Markdown', () => {
    const older = mk('a', '2026-01-01T00:00:00.000Z', 'keep', 'person');
    const newer = mk('b', '2026-01-02T00:00:00.000Z', 'cut', 'person'); // same target, later
    const other = mk('c', '2026-01-01T00:00:00.000Z', 'fix', 'picture');
    const md = exportSummary([older, newer, other]);
    expect(md).toContain('# Pantheon Studio — decisions');
    expect(md).toContain('## Day 1 · hubris');
    // Latest verdict on the person facet wins (Cut, not Keep).
    expect(md).toContain('**Cut** — Person');
    expect(md).not.toContain('**Keep** — Person');
    expect(md).toContain('**Fix** — Picture');
  });

  it('summarises empty input without throwing', () => {
    expect(exportSummary([])).toContain('No decisions captured yet');
  });

  it('parses JSON-array and JSONL imports, and empty input', () => {
    expect(parseImport(JSON.stringify([mk('a')])).map((j) => j.id)).toEqual(['a']);
    expect(
      parseImport([JSON.stringify(mk('a')), JSON.stringify(mk('b'))].join('\n')).map((j) => j.id),
    ).toEqual(['a', 'b']);
    expect(parseImport('  ')).toEqual([]);
  });
});
