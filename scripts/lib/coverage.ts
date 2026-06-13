// Coverage analysis. The charter says the map of coverage is queried, not remembered,
// and that the library must grow toward breadth, not drift toward one mood and one
// hemisphere. This module turns the day files into a structured coverage report:
// register/region/era tallies, the gaps that should drive what gets researched next,
// concentration flags, taste-rule signals, and ledger health.
//
// Pure (no I/O) so it can back both the `map` CLI and the unit tests.

import { REGISTERS } from '@/content/types';
import type { Day, EntityLedger, EntityStatus, Register, Vocab } from '@/content/types';
import type { LoadedDayLike } from './ledger.ts';
import { deriveUsage } from './ledger.ts';

// The greatest hits the charter says to avoid as reflexes.
export const GREATEST_HITS = ['icarus', 'napoleon', 'ozymandias', 'theranos'] as const;

// Regions a tired search over-reaches for; the charter says pull deliberately away.
export const WESTERN_REGIONS = ['mediterranean', 'europe', 'north-america'] as const;

// Above this share of region tags, the library is leaning Western (only judged once
// there are enough days to be meaningful).
export const WESTERN_SHARE_FLAG = 0.5;
export const WESTERN_SHARE_MIN_DAYS = 6;

// An entity referenced by more than this many days is a taste-rule flag.
export const ENTITY_REUSE_LIMIT = 3;

export interface GapRecommendation {
  kind: 'register' | 'region' | 'era';
  id: string;
  reason: string;
}

export interface CoverageReport {
  daysCounted: number;
  publishedCount: number;
  registerCounts: Record<string, number>;
  regionCounts: Record<string, number>;
  eraCounts: Record<string, number>;
  gaps: { registers: string[]; regions: string[]; eras: string[] };
  prioritizedGaps: GapRecommendation[];
  singleDayConcentration: string[];
  westernShare: number;
  westernFlag: boolean;
  greatestHitsInUse: string[];
  entityReuse: { slug: string; days: number }[];
  overReusedEntities: string[];
  ledgerStatusCounts: Record<EntityStatus, number>;
}

function tally<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}

const ENTITY_STATUSES: readonly EntityStatus[] = ['candidate', 'researched', 'used', 'rejected'];

export function computeCoverage(
  loaded: LoadedDayLike[],
  vocab: Vocab,
  ledger: EntityLedger,
): CoverageReport {
  const days: Day[] = loaded.map((d) => d.day);

  const registerCounts = tally(REGISTERS);
  const regionCounts: Record<string, number> = Object.fromEntries(
    vocab.regions.map((r) => [r.id, 0]),
  );
  const eraCounts: Record<string, number> = Object.fromEntries(vocab.eras.map((e) => [e.id, 0]));

  const singleDayConcentration: string[] = [];
  let westernTags = 0;
  let totalRegionTags = 0;

  for (const day of days) {
    for (const r of day.registers) registerCounts[r as Register] += 1;
    for (const region of day.regions) {
      regionCounts[region] = (regionCounts[region] ?? 0) + 1;
      totalRegionTags += 1;
      if ((WESTERN_REGIONS as readonly string[]).includes(region)) westernTags += 1;
    }
    for (const era of day.eras) eraCounts[era] = (eraCounts[era] ?? 0) + 1;

    // A day tagged to exactly one Western region is the charter's "four Mediterranean
    // facets in one day" flag, generalized: a day with no breadth at all.
    if (
      day.regions.length === 1 &&
      (WESTERN_REGIONS as readonly string[]).includes(day.regions[0]!)
    ) {
      singleDayConcentration.push(`Day ${day.index} (${day.theme}) is wholly ${day.regions[0]}.`);
    }
  }

  const gaps = {
    registers: REGISTERS.filter((r) => registerCounts[r] === 0),
    regions: vocab.regions.filter((r) => regionCounts[r.id] === 0).map((r) => r.id),
    eras: vocab.eras.filter((e) => eraCounts[e.id] === 0).map((e) => e.id),
  };

  // Prioritize: empty registers first (closed set of six, most visible imbalance),
  // then eras (only six), then regions (the long tail), each least-covered first.
  const prioritizedGaps: GapRecommendation[] = [
    ...gaps.registers.map(
      (id): GapRecommendation => ({ kind: 'register', id, reason: 'no day in this register yet' }),
    ),
    ...gaps.eras.map(
      (id): GapRecommendation => ({ kind: 'era', id, reason: 'no day from this era yet' }),
    ),
    ...gaps.regions
      .filter((id) => id !== 'global')
      .map(
        (id): GapRecommendation => ({ kind: 'region', id, reason: 'no day from this region yet' }),
      ),
  ];

  const westernShare = totalRegionTags === 0 ? 0 : westernTags / totalRegionTags;
  const westernFlag = days.length >= WESTERN_SHARE_MIN_DAYS && westernShare > WESTERN_SHARE_FLAG;

  const greatestHitsInUse = ledger.entities
    .filter((e) => (GREATEST_HITS as readonly string[]).includes(e.slug) && e.status === 'used')
    .map((e) => e.slug);

  // Reuse measured from the real day files, not the stored usedInDays, so it is honest
  // even when the ledger has drifted.
  const usage = deriveUsage(loaded);
  const entityReuse = [...usage]
    .filter(([, daysList]) => daysList.length > 1)
    .map(([slug, daysList]) => ({ slug, days: daysList.length }))
    .sort((a, b) => b.days - a.days);
  const overReusedEntities = entityReuse
    .filter((e) => e.days > ENTITY_REUSE_LIMIT)
    .map((e) => e.slug);

  const ledgerStatusCounts = tally(ENTITY_STATUSES);
  for (const e of ledger.entities) ledgerStatusCounts[e.status] += 1;

  return {
    daysCounted: days.length,
    publishedCount: days.filter((d) => d.status === 'published').length,
    registerCounts,
    regionCounts,
    eraCounts,
    gaps,
    prioritizedGaps,
    singleDayConcentration,
    westernShare,
    westernFlag,
    greatestHitsInUse,
    entityReuse,
    overReusedEntities,
    ledgerStatusCounts,
  };
}
