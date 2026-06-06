#!/usr/bin/env tsx
// Map: query the library's coverage. Read-only. Coverage is queried, not remembered,
// so this reads the actual day files every run. Pass --json for a machine-readable dump.
import { FACET_ORDER, REGISTERS } from '@/content/types';
import type { Region } from '@/content/types';
import { loadDays, loadEntities, loadVocab } from './lib/content.ts';

const asJson = process.argv.includes('--json');

const GREATEST_HITS = ['icarus', 'napoleon', 'ozymandias', 'theranos'];
// Regions that are over-reached for by a tired search; the charter says pull away.
const OVER_REACHED: Region[] = ['mediterranean', 'europe'];

const days = loadDays();
const vocab = loadVocab();
const ledger = loadEntities();

function tally<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}

const registerCounts = tally(REGISTERS);
const regionCounts: Record<string, number> = Object.fromEntries(
  vocab.regions.map((r) => [r.id, 0]),
);
const eraCounts: Record<string, number> = Object.fromEntries(vocab.eras.map((e) => [e.id, 0]));

const concentrationFlags: string[] = [];
const greatestHitsFound: string[] = [];

for (const { day } of days) {
  for (const r of day.registers) registerCounts[r] += 1;
  for (const region of day.regions) regionCounts[region] = (regionCounts[region] ?? 0) + 1;
  for (const era of day.eras) eraCounts[era] = (eraCounts[era] ?? 0) + 1;

  // Single-day region concentration: charter flags e.g. four Mediterranean facets.
  for (const region of OVER_REACHED) {
    if (day.regions.filter((x) => x === region).length >= 1 && day.regions.length === 1) {
      concentrationFlags.push(`Day ${day.index} (${day.theme}) is wholly ${region}.`);
    }
  }
}

for (const e of ledger.entities) {
  if (GREATEST_HITS.includes(e.slug) && e.status === 'used') {
    greatestHitsFound.push(e.slug);
  }
}

// Entity reuse across days.
const reuse = ledger.entities
  .filter((e) => e.usedInDays.length > 1)
  .map((e) => `${e.slug} (${e.usedInDays.length} days)`);

const gaps = {
  registers: REGISTERS.filter((r) => registerCounts[r] === 0),
  regions: vocab.regions.filter((r) => regionCounts[r.id] === 0).map((r) => r.id),
  eras: vocab.eras.filter((e) => eraCounts[e.id] === 0).map((e) => e.id),
};

const coverage = {
  daysCounted: days.length,
  facetOrder: FACET_ORDER,
  registerCounts,
  regionCounts,
  eraCounts,
  gaps,
  concentrationFlags,
  greatestHitsFound,
  entityReuse: reuse,
};

if (asJson) {
  console.log(JSON.stringify(coverage, null, 2));
} else {
  console.log(`Pantheon coverage map  (${days.length} day(s))\n`);
  console.log('Registers:');
  for (const r of REGISTERS) console.log(`  ${r.padEnd(12)} ${registerCounts[r]}`);
  console.log('\nGaps to drive what gets researched next:');
  console.log(`  registers: ${gaps.registers.join(', ') || '(none)'}`);
  console.log(`  regions:   ${gaps.regions.join(', ') || '(none)'}`);
  console.log(`  eras:      ${gaps.eras.join(', ') || '(none)'}`);
  if (concentrationFlags.length) {
    console.log('\nConcentration flags:');
    concentrationFlags.forEach((f) => console.log(`  ${f}`));
  }
  if (greatestHitsFound.length) {
    console.log(`\nGreatest hits in use: ${greatestHitsFound.join(', ')}`);
  }
  if (reuse.length) {
    console.log(`\nEntity reuse: ${reuse.join(', ')}`);
  }
}
