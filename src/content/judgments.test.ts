import { describe, it, expect } from 'vitest';
import {
  type Judgment,
  latestByTarget,
  makeJudgmentId,
  rollup,
  splitSentences,
  targetId,
} from './judgments';

function j(partial: Partial<Judgment> & { id: string; at: string }): Judgment {
  return {
    target: { level: 'day', day: 1, slug: 'hubris' },
    verdict: 'keep',
    tags: [],
    ...partial,
  };
}

describe('splitSentences', () => {
  it('splits plain prose on sentence punctuation', () => {
    expect(splitSentences('He unified the states. He burned the books. He died on tour.')).toEqual([
      'He unified the states.',
      'He burned the books.',
      'He died on tour.',
    ]);
  });

  it('keeps a trailing fragment without terminal punctuation', () => {
    expect(splitSentences('One full sentence. A trailing clause')).toEqual([
      'One full sentence.',
      'A trailing clause',
    ]);
  });

  it('does not split on initials or common abbreviations', () => {
    expect(splitSentences('The poem is by W. H. Auden. It is about a painting.')).toEqual([
      'The poem is by W. H. Auden.',
      'It is about a painting.',
    ]);
    expect(splitSentences('Pull toward the non-Western, e.g. Tang China. Surprise is a value.')).toEqual(
      ['Pull toward the non-Western, e.g. Tang China.', 'Surprise is a value.'],
    );
  });

  it('keeps a mid-name initial together (real seed content)', () => {
    // From the Defiance seed day: a middle initial must not start a new card, and an
    // all-caps acronym followed by a period is a real sentence end.
    expect(
      splitSentences(
        'Ida B. Wells became a journalist who refused to look away. She helped found the NAACP. She named the killers.',
      ),
    ).toEqual([
      'Ida B. Wells became a journalist who refused to look away.',
      'She helped found the NAACP.',
      'She named the killers.',
    ]);
  });

  it('returns an empty array for blank input', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});

describe('targetId', () => {
  it('is stable for the same span and distinct across levels', () => {
    const facet = targetId({ level: 'facet', day: 1, slug: 'hubris', facet: 'person' });
    const same = targetId({ level: 'facet', day: 9, slug: 'hubris', facet: 'person' });
    const sentence = targetId({
      level: 'sentence',
      day: 1,
      slug: 'hubris',
      facet: 'person',
      sentenceIndex: 0,
    });
    expect(facet).toBe(same); // index can shift; slug is the key
    expect(facet).not.toBe(sentence);
  });
});

describe('makeJudgmentId', () => {
  it('is deterministic given a clock and rng, and unique across inputs', () => {
    expect(makeJudgmentId(1000, 0.5)).toBe(makeJudgmentId(1000, 0.5));
    expect(makeJudgmentId(1000, 0.5)).not.toBe(makeJudgmentId(2000, 0.5));
    expect(makeJudgmentId(1000, 0.1)).not.toBe(makeJudgmentId(1000, 0.9));
  });
});

describe('latestByTarget', () => {
  it('keeps only the most recent judgment per target', () => {
    const earlier = j({ id: '1', at: '2026-01-01T00:00:00Z', verdict: 'flat' });
    const later = j({ id: '2', at: '2026-02-01T00:00:00Z', verdict: 'keep' });
    const other = j({
      id: '3',
      at: '2026-01-15T00:00:00Z',
      target: { level: 'facet', day: 1, slug: 'hubris', facet: 'poem' },
      verdict: 'cut',
    });

    const latest = latestByTarget([earlier, later, other]);
    expect(latest.size).toBe(2);
    expect(latest.get(targetId(earlier.target))?.verdict).toBe('keep');
    expect(latest.get(targetId(other.target))?.verdict).toBe('cut');
  });
});

describe('rollup', () => {
  it('counts verdicts, tags, and per-day breakdown', () => {
    const r = rollup([
      j({ id: '1', at: 't1', verdict: 'keep', tags: ['resonance'] }),
      j({ id: '2', at: 't2', verdict: 'cut', tags: ['cliche', 'source'] }),
      j({
        id: '3',
        at: 't3',
        target: { level: 'day', day: 2, slug: 'patience' },
        verdict: 'fix',
        tags: ['source'],
      }),
    ]);

    expect(r.total).toBe(3);
    expect(r.byVerdict).toMatchObject({ keep: 1, cut: 1, fix: 1, flat: 0 });
    expect(r.byTag.source).toBe(2);
    expect(r.byTag.resonance).toBe(1);
    expect(r.byDay.get('hubris')?.byVerdict).toMatchObject({ keep: 1, cut: 1 });
    expect(r.byDay.get('patience')?.byVerdict.fix).toBe(1);
  });

  it('counts severities and judgments carrying a suggestion', () => {
    const r = rollup([
      j({ id: '1', at: 't1', verdict: 'cut', severity: 'major' }),
      j({ id: '2', at: 't2', verdict: 'fix', severity: 'minor', suggestion: 'a rewrite' }),
      j({ id: '3', at: 't3', verdict: 'keep' }), // no severity, no suggestion
    ]);

    expect(r.bySeverity).toEqual({ major: 1, minor: 1 });
    expect(r.withSuggestion).toBe(1);
  });
});
