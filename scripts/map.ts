#!/usr/bin/env tsx
// Map: query the library's coverage. Read-only. Coverage is queried, not remembered,
// so this reads the actual day files every run. The analysis lives in lib/coverage.ts
// (pure and unit-tested); this file only loads content and prints. Pass --json for a
// machine-readable dump.
import { REGISTERS } from '@/content/types';
import { loadDays, loadEntities, loadVocab } from './lib/content.ts';
import { computeCoverage } from './lib/coverage.ts';

const asJson = process.argv.includes('--json');

const days = loadDays();
const vocab = loadVocab();
const ledger = loadEntities();

const report = computeCoverage(days, vocab, ledger);

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(
    `Pantheon coverage map  (${report.daysCounted} day(s), ${report.publishedCount} published)\n`,
  );

  console.log('Registers:');
  for (const r of REGISTERS) console.log(`  ${r.padEnd(12)} ${report.registerCounts[r]}`);

  console.log('\nGaps to drive what gets researched next:');
  console.log(`  registers: ${report.gaps.registers.join(', ') || '(none)'}`);
  console.log(`  regions:   ${report.gaps.regions.join(', ') || '(none)'}`);
  console.log(`  eras:      ${report.gaps.eras.join(', ') || '(none)'}`);

  if (report.prioritizedGaps.length) {
    console.log('\nResearch next (highest-leverage gaps first):');
    report.prioritizedGaps
      .slice(0, 5)
      .forEach((g, i) => console.log(`  ${i + 1}. ${g.kind}: ${g.id}  (${g.reason})`));
  }

  console.log(
    `\nWestern region share: ${(report.westernShare * 100).toFixed(0)}%` +
      (report.westernFlag ? '  [FLAG: leaning Western, pull toward the rest of the world]' : ''),
  );

  if (report.singleDayConcentration.length) {
    console.log('\nConcentration flags:');
    report.singleDayConcentration.forEach((f) => console.log(`  ${f}`));
  }
  if (report.greatestHitsInUse.length) {
    console.log(`\nGreatest hits in use (taste rule): ${report.greatestHitsInUse.join(', ')}`);
  }
  if (report.entityReuse.length) {
    const tail = report.overReusedEntities.length
      ? `  [over-reused: ${report.overReusedEntities.join(', ')}]`
      : '';
    console.log(
      `\nEntity reuse: ${report.entityReuse.map((e) => `${e.slug} (${e.days} days)`).join(', ')}${tail}`,
    );
  }

  const s = report.ledgerStatusCounts;
  console.log(
    `\nLedger: ${s.candidate} candidate, ${s.researched} researched, ${s.used} used, ${s.rejected} rejected.`,
  );
}
