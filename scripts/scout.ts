#!/usr/bin/env tsx
// Scout: propose candidate themes/entities aimed at the library's biggest gaps.
// Deliberately pulls toward the non-Western and non-modern, and away from the
// greatest hits. Dedupes against the existing ledger.
//
// Usage:
//   npm run scout                          # worksheet against the biggest gaps
//   npm run scout -- --register redemption --region east-asia --era post-classical
//   npm run scout -- --write --slug bodhidharma --label "Bodhidharma" --type person \
//                    --register defiance --region east-asia --era post-classical
//
// Without --write it emits a structured worksheet to stdout. With --write it appends a
// `candidate` entity to entities.json (dedupe-safe: it refuses to clobber an existing
// slug), turning Scout into a real on-ramp to the ledger.
import { writeFileSync } from 'node:fs';
import { REGISTERS } from '@/content/types';
import type { Entity, EntityType, Register } from '@/content/types';
import { loadDays, loadEntities, loadVocab } from './lib/content.ts';
import { computeCoverage } from './lib/coverage.ts';
import { ENTITIES_FILE } from './lib/paths.ts';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

const days = loadDays();
const vocab = loadVocab();
const ledger = loadEntities();
const coverage = computeCoverage(days, vocab, ledger);

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

// ---- --write: append a candidate entity to the ledger -----------------------
if (has('write')) {
  const slug = flag('slug');
  const label = flag('label');
  const type = flag('type') as EntityType | undefined;
  const validTypes: EntityType[] = [
    'person',
    'artwork',
    'poem',
    'text',
    'place',
    'concept',
    'event',
  ];

  if (!slug || !label || !type) {
    console.error('--write requires --slug, --label and --type.');
    process.exit(1);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`--slug must be kebab-case, got "${slug}".`);
    process.exit(1);
  }
  if (!validTypes.includes(type)) {
    console.error(`--type must be one of ${validTypes.join(', ')}, got "${type}".`);
    process.exit(1);
  }
  if (ledger.entities.some((e) => e.slug === slug)) {
    console.error(`Refusing to clobber: entity "${slug}" already exists in the ledger.`);
    process.exit(1);
  }

  const candidate: Entity = {
    slug,
    type,
    label,
    status: 'candidate',
    usedInDays: [],
    registers: [targetRegister],
    regions: [targetRegion],
    eras: [targetEra],
    notes: 'Proposed by scout. Research before use; add a Wikidata QID where one exists.',
  };

  const next = {
    ...ledger,
    entities: [...ledger.entities, candidate],
  };
  writeFileSync(ENTITIES_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log(
    `Appended candidate "${slug}" (${type}) targeting ${targetRegister}/${targetRegion}/${targetEra}.`,
  );
  console.log('Next: research it, then scaffold a day with npm run deep.');
  process.exit(0);
}

// ---- default: print a worksheet --------------------------------------------
const takenSlugs = new Set(
  ledger.entities.filter((e) => e.status === 'used' || e.status === 'rejected').map((e) => e.slug),
);

console.log('Pantheon Scout worksheet\n');
console.log(
  `Targeting gap -> register: ${targetRegister}, region: ${targetRegion}, era: ${targetEra}\n`,
);
if (coverage.prioritizedGaps.length) {
  console.log('Biggest gaps right now:');
  coverage.prioritizedGaps
    .slice(0, 5)
    .forEach((g, i) => console.log(`  ${i + 1}. ${g.kind}: ${g.id}`));
  console.log('');
}
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
console.log(
  '\nRecord a candidate:  npm run scout -- --write --slug <slug> --label <Label> --type <type>',
);
console.log('Then scaffold the day: npm run deep -- --day NNN --slug <slug> --theme <Theme>');
