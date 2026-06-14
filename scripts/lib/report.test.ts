import { describe, it, expect } from 'vitest';
import type { Judgment, JudgmentTarget } from '@/content/judgments';
import {
  byLevel,
  coverageForTargets,
  isStale,
  revisionQueue,
  staleJudgments,
  strongestKeeps,
  unreviewedTargets,
  worstDays,
  worstFacets,
} from './report.ts';

// Compact judgment builder. Defaults to a keep on day 1's person facet.
function j(
  over: Omit<Partial<Judgment>, 'target'> & { target?: Partial<JudgmentTarget> } = {},
): Judgment {
  const { target, ...rest } = over;
  return {
    id: Math.random().toString(36).slice(2),
    at: '2026-06-14T00:00:00.000Z',
    target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person', ...target },
    verdict: 'keep',
    tags: [],
    ...rest,
  };
}

describe('revisionQueue', () => {
  it('orders by verdict (cut, then fix, then flat) and excludes keeps', () => {
    const queue = revisionQueue([
      j({ verdict: 'flat', target: { day: 1 } }),
      j({ verdict: 'keep', target: { day: 1, facet: 'poem' } }),
      j({ verdict: 'cut', target: { day: 1, facet: 'parallel' } }),
      j({ verdict: 'fix', target: { day: 1, facet: 'picture' } }),
    ]);
    expect(queue.map((x) => x.verdict)).toEqual(['cut', 'fix', 'flat']);
  });

  it('within a verdict, orders by day, then facet, then sentence index', () => {
    const queue = revisionQueue([
      j({ verdict: 'cut', target: { day: 2, slug: 'patience', facet: 'poem' } }),
      j({
        verdict: 'cut',
        target: { day: 1, level: 'sentence', facet: 'person', sentenceIndex: 2 },
      }),
      j({
        verdict: 'cut',
        target: { day: 1, level: 'sentence', facet: 'person', sentenceIndex: 0 },
      }),
      j({ verdict: 'cut', target: { day: 1, facet: 'parallel' } }),
    ]);
    // day 1 before day 2; within day 1, parallel before person; person sentences in order.
    expect(queue.map((x) => [x.target.day, x.target.facet, x.target.sentenceIndex])).toEqual([
      [1, 'parallel', undefined],
      [1, 'person', 0],
      [1, 'person', 2],
      [2, 'poem', undefined],
    ]);
  });
});

describe('staleness', () => {
  const target: JudgmentTarget = {
    level: 'title',
    day: 1,
    slug: 'hubris',
    facet: 'person',
    text: 'Qin Shi Huang',
  };

  it('flags a judgment whose recorded text no longer matches the live content', () => {
    const judged = j({ target });
    expect(isStale(judged, () => 'Qin Shi Huang')).toBe(false); // unchanged
    expect(isStale(judged, () => 'A New Title')).toBe(true); // edited
  });

  it('does not flag when the target stored no text, or the target is gone', () => {
    const noText = j({ target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person' } });
    expect(isStale(noText, () => 'anything')).toBe(false);
    expect(isStale(j({ target }), () => undefined)).toBe(false); // target removed -> not stale
  });

  it('collects only the stale judgments', () => {
    const stale = j({ target });
    const fresh = j({ target: { ...target, facet: 'poem', text: 'Stable' } });
    const result = staleJudgments([stale, fresh], (t) =>
      t.facet === 'person' ? 'Edited' : 'Stable',
    );
    expect(result).toEqual([stale]);
  });
});

describe('byLevel', () => {
  it('groups verdicts by review level in canonical order', () => {
    const rows = byLevel([
      j({ verdict: 'keep', target: { level: 'day', facet: undefined } }),
      j({ verdict: 'cut', target: { level: 'sentence', sentenceIndex: 0 } }),
      j({ verdict: 'flat', target: { level: 'sentence', sentenceIndex: 1 } }),
      j({ verdict: 'fix', target: { level: 'facet' } }),
    ]);
    expect(rows.map((r) => r.level)).toEqual(['day', 'facet', 'sentence']); // canonical order
    const sentence = rows.find((r) => r.level === 'sentence')!;
    expect(sentence.total).toBe(2);
    expect(sentence.byVerdict).toMatchObject({ cut: 1, flat: 1 });
  });
});

describe('coverageForTargets / unreviewedTargets', () => {
  const targets = [
    {
      target: { level: 'day', day: 1, slug: 'hubris', field: 'theme' },
    },
    {
      target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person' },
    },
    {
      target: { level: 'facet', day: 1, slug: 'hubris', facet: 'poem' },
    },
  ] satisfies { target: JudgmentTarget }[];

  it('counts current judgments against the supplied targets', () => {
    const current = [
      j({ target: { level: 'day', day: 1, slug: 'hubris', facet: undefined, field: 'theme' } }),
      j({ target: { level: 'facet', day: 1, slug: 'hubris', facet: 'person' } }),
    ];
    expect(coverageForTargets('Facet', targets, current)).toEqual({
      label: 'Facet',
      total: 3,
      reviewed: 2,
      unreviewed: 1,
      percent: 67,
    });
  });

  it('returns the first unreviewed targets in feed order', () => {
    const current = [
      j({ target: { level: 'day', day: 1, slug: 'hubris', facet: undefined, field: 'theme' } }),
    ];
    expect(unreviewedTargets(targets, current, 1).map((t) => t.target.facet)).toEqual(['person']);
  });
});

describe('strongestKeeps', () => {
  it('returns only keeps, larger units first, and honours the limit', () => {
    const keeps = strongestKeeps(
      [
        j({ verdict: 'keep', target: { level: 'sentence', sentenceIndex: 0 } }),
        j({ verdict: 'cut', target: { level: 'day', facet: undefined } }),
        j({ verdict: 'keep', target: { level: 'day', facet: undefined } }),
        j({ verdict: 'keep', target: { level: 'facet' } }),
      ],
      2,
    );
    expect(keeps).toHaveLength(2);
    expect(keeps.map((k) => k.target.level)).toEqual(['day', 'facet']);
  });
});

describe('worstDays / worstFacets', () => {
  const sample = [
    j({ verdict: 'cut', target: { day: 1, slug: 'hubris', facet: 'parallel' } }),
    j({ verdict: 'fix', target: { day: 1, slug: 'hubris', facet: 'parallel' } }),
    j({ verdict: 'flat', target: { day: 2, slug: 'patience', facet: 'person' } }),
    j({ verdict: 'keep', target: { day: 2, slug: 'patience', facet: 'poem' } }),
    j({ verdict: 'keep', target: { level: 'day', day: 3, slug: 'thresholds', facet: undefined } }),
  ];

  it('ranks days by weighted negative signal, worst first, and drops all-keep days', () => {
    const rows = worstDays(sample);
    // hubris: cut(3)+fix(2)=5 ; patience: flat(1)+keep(0)=1 ; thresholds: keep only -> excluded
    expect(rows.map((r) => [r.slug, r.negative])).toEqual([
      ['hubris', 5],
      ['patience', 1],
    ]);
  });

  it('ranks facets and ignores judgments with no facet', () => {
    const rows = worstFacets(sample);
    expect(rows[0]!.key).toBe('hubris · parallel');
    expect(rows[0]!.negative).toBe(5);
    // the day-level thresholds keep has no facet and must not appear
    expect(rows.some((r) => r.slug === 'thresholds')).toBe(false);
  });
});
