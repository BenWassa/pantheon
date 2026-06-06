#!/usr/bin/env tsx
// Scout: propose candidate themes/entities aimed at the library's biggest gaps.
// Deliberately pulls toward the non-Western and non-modern, and away from the
// greatest hits. Dedupes against the existing ledger.
//
// Usage:
//   npm run scout                          # propose against the biggest gaps
//   npm run scout -- --register redemption --region east-asia --era post-classical
//
// This MVP version emits a structured worksheet to stdout. With --write it would
// append `candidate` entities to entities.json (not yet enabled to keep it read-only
// by default).
import { REGISTERS } from '@/content/types';
import type { Register } from '@/content/types';
import { loadDays, loadEntities, loadVocab } from './lib/content.ts';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const days = loadDays();
const vocab = loadVocab();
const ledger = loadEntities();

const usedRegisters = new Set(days.flatMap((d) => d.day.registers));
const usedRegions = new Set(days.flatMap((d) => d.day.regions));
const usedEras = new Set(days.flatMap((d) => d.day.eras));

const targetRegister =
  (flag('register') as Register | undefined) ??
  REGISTERS.find((r) => !usedRegisters.has(r)) ??
  'awe';
const targetRegion =
  flag('region') ?? vocab.regions.find((r) => !usedRegions.has(r.id))?.id ?? 'global';
const targetEra = flag('era') ?? vocab.eras.find((e) => !usedEras.has(e.id))?.id ?? 'ancient';

const takenSlugs = new Set(
  ledger.entities.filter((e) => e.status === 'used' || e.status === 'rejected').map((e) => e.slug),
);

console.log('Pantheon Scout worksheet\n');
console.log(
  `Targeting gap -> register: ${targetRegister}, region: ${targetRegion}, era: ${targetEra}\n`,
);
console.log('Charter reminders for the author filling this in:');
console.log('  - Prefer the lesser-known but rigorously documented. Surprise is a value.');
console.log('  - Avoid Icarus / Napoleon / Ozymandias / Theranos unless genuinely best.');
console.log(`  - Already used (do not re-propose): ${[...takenSlugs].join(', ') || '(none)'}\n`);
console.log('Six facets to fill for the candidate theme:');
console.log('  person:    a documented life embodying the theme, shown with highs and lows');
console.log('  picture:   a PD/CC visual work (Wikimedia Commons), with attribution + license');
console.log('  poem:      a poem (PD = full text; in-copyright = excerpt + pointer)');
console.log('  principle: the idea at the theme’s spine');
console.log('  passage:   a passage of wisdom/sacred/literary text from any tradition');
console.log('  parallel:  the bridge from history to now');
console.log('\nName the resonance threads before drafting. If you cannot, the theme is not ready.');
console.log('\nNext: scaffold the day with  npm run deep -- --day NNN --slug <slug>');
