import { describe, it, expect } from 'vitest';
import type { Day, EntityLedger, Vocab } from '@/content/types';
import { computeCoverage, type CoverageReport } from './coverage.ts';
import type { LoadedDayLike } from './ledger.ts';

const vocab: Vocab = {
  registers: ['elegy', 'redemption', 'defiance', 'tenderness', 'comedy', 'awe'],
  regions: [
    { id: 'east-asia', label: 'East Asia' },
    { id: 'europe', label: 'Europe' },
    { id: 'north-america', label: 'North America' },
    { id: 'global', label: 'Global' },
  ],
  eras: [
    { id: 'ancient', label: 'Ancient' },
    { id: 'modern', label: 'Modern' },
  ],
};

function day(
  index: number,
  over: Partial<Pick<Day, 'registers' | 'regions' | 'eras' | 'status'>> & {
    refs?: string[];
  } = {},
): LoadedDayLike {
  const refs = over.refs ?? [];
  const facets = Object.fromEntries(
    ['person', 'picture', 'poem', 'principle', 'passage', 'parallel'].map((key, i) => [
      key,
      { entities: i === 0 ? refs.map((slug) => ({ slug })) : [] },
    ]),
  );
  const d = {
    index,
    theme: `Day ${index}`,
    status: over.status ?? 'published',
    registers: over.registers ?? ['awe'],
    regions: over.regions ?? ['global'],
    eras: over.eras ?? ['modern'],
    facets,
  } as unknown as Day;
  return { file: `${index}.json`, day: d };
}

function ledger(...slugs: { slug: string; status?: string }[]): EntityLedger {
  return {
    schemaVersion: 1,
    entities: slugs.map((s) => ({
      slug: s.slug,
      type: 'person',
      label: s.slug,
      status: (s.status as never) ?? 'used',
      usedInDays: [],
    })),
  };
}

describe('computeCoverage', () => {
  it('tallies registers and reports empty ones as prioritized gaps', () => {
    const report = computeCoverage(
      [day(1, { registers: ['elegy'] }), day(2, { registers: ['awe'] })],
      vocab,
      ledger(),
    );
    expect(report.registerCounts.elegy).toBe(1);
    expect(report.gaps.registers).toContain('redemption');
    // registers are the highest-priority gap kind
    expect(report.prioritizedGaps[0]!.kind).toBe('register');
  });

  it('computes Western share and flags it only past the day threshold', () => {
    const western = Array.from({ length: 6 }, (_, i) => day(i + 1, { regions: ['europe'] }));
    const report: CoverageReport = computeCoverage(western, vocab, ledger());
    expect(report.westernShare).toBe(1);
    expect(report.westernFlag).toBe(true);

    const small = computeCoverage([day(1, { regions: ['europe'] })], vocab, ledger());
    expect(small.westernFlag).toBe(false); // too few days to judge
  });

  it('measures entity reuse from the day files, not stored usedInDays', () => {
    const days = [
      day(1, { refs: ['reused'] }),
      day(2, { refs: ['reused'] }),
      day(3, { refs: ['reused'] }),
      day(4, { refs: ['reused'] }),
    ];
    const report = computeCoverage(days, vocab, ledger({ slug: 'reused' }));
    expect(report.entityReuse[0]).toEqual({ slug: 'reused', days: 4 });
    expect(report.overReusedEntities).toContain('reused'); // > ENTITY_REUSE_LIMIT (3)
  });

  it('flags greatest-hits entities that are in use', () => {
    const report = computeCoverage([day(1)], vocab, ledger({ slug: 'ozymandias', status: 'used' }));
    expect(report.greatestHitsInUse).toContain('ozymandias');
  });

  it('counts ledger entries by status', () => {
    const report = computeCoverage(
      [day(1)],
      vocab,
      ledger({ slug: 'a', status: 'candidate' }, { slug: 'b', status: 'used' }),
    );
    expect(report.ledgerStatusCounts.candidate).toBe(1);
    expect(report.ledgerStatusCounts.used).toBe(1);
  });
});
