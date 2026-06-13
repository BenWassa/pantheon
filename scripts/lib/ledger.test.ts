import { describe, it, expect } from 'vitest';
import type { Day, Entity } from '@/content/types';
import { deriveUsage, reconcile, type LoadedDayLike } from './ledger.ts';

// Minimal day builder: deriveUsage/reconcile only read index and facet entity refs.
function day(index: number, refsByFacet: Partial<Record<string, string[]>>): LoadedDayLike {
  const facets = Object.fromEntries(
    ['person', 'picture', 'poem', 'principle', 'passage', 'parallel'].map((key) => [
      key,
      { entities: (refsByFacet[key] ?? []).map((slug) => ({ slug })) },
    ]),
  );
  return {
    file: `${String(index).padStart(3, '0')}-x.json`,
    day: { index, facets } as unknown as Day,
  };
}

function entity(slug: string, over: Partial<Entity> = {}): Entity {
  return { slug, type: 'person', label: slug, status: 'used', usedInDays: [], ...over };
}

describe('deriveUsage', () => {
  it('collects sorted, unique day indices per referenced slug across facets', () => {
    const days = [
      day(1, { person: ['qin'], passage: ['tao'] }),
      day(3, { person: ['qin'], picture: ['qin'] }), // duplicate within a day collapses
    ];
    const usage = deriveUsage(days);
    expect(usage.get('qin')).toEqual([1, 3]);
    expect(usage.get('tao')).toEqual([1]);
  });
});

describe('reconcile', () => {
  it('rewrites usedInDays to the derived truth', () => {
    const days = [day(2, { person: ['qin'] })];
    const { entities, changes } = reconcile([entity('qin', { usedInDays: [1] })], days);
    expect(entities[0]!.usedInDays).toEqual([2]);
    expect(changes.some((c) => c.kind === 'usedInDays')).toBe(true);
  });

  it('promotes a referenced candidate to used', () => {
    const days = [day(1, { person: ['new-find'] })];
    const { entities, changes } = reconcile(
      [entity('new-find', { status: 'candidate', usedInDays: [] })],
      days,
    );
    expect(entities[0]!.status).toBe('used');
    expect(changes.some((c) => c.kind === 'promote')).toBe(true);
  });

  it('flags a used entity that nothing references as an orphan without downgrading it', () => {
    const { entities, changes } = reconcile([entity('ghost', { usedInDays: [9] })], []);
    expect(entities[0]!.status).toBe('used'); // dedupe memory preserved
    expect(entities[0]!.usedInDays).toEqual([]);
    expect(changes.some((c) => c.kind === 'orphan')).toBe(true);
  });

  it('reports referenced slugs that are absent from the ledger', () => {
    const days = [day(1, { person: ['unknown-person'] })];
    const { missing } = reconcile([], days);
    expect(missing).toEqual([{ slug: 'unknown-person', usedInDays: [1] }]);
  });

  it('is a no-op (no changes) when the ledger already matches reality', () => {
    const days = [day(1, { person: ['qin'] })];
    const { changes, missing } = reconcile([entity('qin', { usedInDays: [1] })], days);
    expect(changes).toEqual([]);
    expect(missing).toEqual([]);
  });
});
