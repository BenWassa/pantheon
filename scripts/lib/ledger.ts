// Ledger reconciliation. The entity ledger's `usedInDays` and `status` are the
// dedupe memory and the future graph's nodes, but if they are hand-maintained they
// drift the moment the library grows past a handful of days. This module derives the
// truth from the actual day files, so coverage is queried, not remembered.
//
// Pure functions only (no I/O), so the same logic serves the CLI (scripts/sync.ts),
// the trust gate (validateContent.ts), and the unit tests.

import type { Day, Entity } from '@/content/types';

export interface LoadedDayLike {
  file: string;
  day: Day;
}

// slug -> the sorted, unique day indices whose facets reference that entity.
export function deriveUsage(days: LoadedDayLike[]): Map<string, number[]> {
  const usage = new Map<string, Set<number>>();
  for (const { day } of days) {
    for (const facet of Object.values(day.facets)) {
      for (const ref of facet.entities ?? []) {
        if (!usage.has(ref.slug)) usage.set(ref.slug, new Set());
        usage.get(ref.slug)!.add(day.index);
      }
    }
  }
  return new Map([...usage].map(([slug, set]) => [slug, [...set].sort((a, b) => a - b)] as const));
}

export type LedgerChangeKind =
  | 'usedInDays' // recorded day indices disagree with reality
  | 'promote' // a referenced candidate/researched entity should become `used`
  | 'orphan'; // marked `used` but no day references it any longer

export interface LedgerChange {
  slug: string;
  kind: LedgerChangeKind;
  message: string;
}

export interface MissingEntity {
  slug: string;
  usedInDays: number[];
}

export interface ReconcileResult {
  entities: Entity[]; // the reconciled ledger entities (usedInDays + status corrected)
  changes: LedgerChange[]; // what reconciliation altered or would alter
  missing: MissingEntity[]; // slugs referenced by days but absent from the ledger
}

function sameNumbers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Reconcile a ledger against the real day files. Does not mutate its inputs.
// `usedInDays` is rewritten to the derived truth; a referenced candidate/researched
// entity is promoted to `used`; an entity marked `used` that nothing references any
// longer is reported as an orphan (status left untouched, to preserve dedupe memory).
export function reconcile(entities: Entity[], days: LoadedDayLike[]): ReconcileResult {
  const usage = deriveUsage(days);
  const changes: LedgerChange[] = [];
  const known = new Set(entities.map((e) => e.slug));

  const reconciled = entities.map((entity): Entity => {
    const derived = usage.get(entity.slug) ?? [];
    const next: Entity = { ...entity };

    if (!sameNumbers(entity.usedInDays, derived)) {
      changes.push({
        slug: entity.slug,
        kind: 'usedInDays',
        message: `usedInDays [${entity.usedInDays.join(', ')}] -> [${derived.join(', ')}]`,
      });
      next.usedInDays = derived;
    }

    if (derived.length > 0 && (entity.status === 'candidate' || entity.status === 'researched')) {
      changes.push({
        slug: entity.slug,
        kind: 'promote',
        message: `status ${entity.status} -> used (referenced by day ${derived.join(', ')})`,
      });
      next.status = 'used';
    }

    if (derived.length === 0 && entity.status === 'used') {
      changes.push({
        slug: entity.slug,
        kind: 'orphan',
        message: `marked used but no day references it; status left as-is for dedupe memory`,
      });
    }

    return next;
  });

  const missing: MissingEntity[] = [...usage]
    .filter(([slug]) => !known.has(slug))
    .map(([slug, usedInDays]) => ({ slug, usedInDays }));

  return { entities: reconciled, changes, missing };
}
