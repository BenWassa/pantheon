#!/usr/bin/env tsx
// Deep: scaffold a full Day JSON to charter standard, ready for the author to fill
// with researched, sourced bodies. Writes a status:'draft' file. Will not overwrite
// an existing day file.
//
// Usage: npm run deep -- --day 4 --slug courage --theme Courage
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FACET_ORDER } from '@/content/types';
import type { Day, FacetKey } from '@/content/types';
import { DAYS_DIR } from './lib/paths.ts';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const dayArg = flag('day');
const slug = flag('slug');
const theme = flag('theme') ?? (slug ? slug[0]!.toUpperCase() + slug.slice(1) : undefined);

if (!dayArg || !slug || !theme) {
  console.error('Usage: npm run deep -- --day <N> --slug <slug> [--theme <Theme>]');
  process.exit(1);
}

const index = Number(dayArg);
if (!Number.isInteger(index) || index < 1) {
  console.error(`--day must be a positive integer, got "${dayArg}"`);
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`--slug must be kebab-case, got "${slug}"`);
  process.exit(1);
}

const fileName = `${String(index).padStart(3, '0')}-${slug}.json`;
const filePath = join(DAYS_DIR, fileName);
if (existsSync(filePath)) {
  console.error(`Refusing to overwrite existing ${fileName}.`);
  process.exit(1);
}

const TODO = 'TODO: write 80-130 words to charter standard, with sources below.';

function scaffoldFacet(key: FacetKey) {
  const base = {
    key,
    oneWord: 'TODO',
    title: 'TODO',
    body: TODO,
    sources: [{ kind: 'secondary', title: 'TODO: authoritative source' }],
    entities: [],
  };
  if (key === 'picture') {
    return {
      ...base,
      image: {
        src: 'TODO: /content/images/<file> or Commons URL',
        commonsFile: 'File:TODO',
        alt: 'TODO: describe the image',
        attribution: 'TODO: credit line',
        license: 'PD',
        sourceUrl: 'https://commons.wikimedia.org/',
      },
    };
  }
  if (key === 'poem') {
    return {
      ...base,
      poet: 'TODO',
      poem: { status: 'public-domain', full: 'TODO: full public-domain poem text' },
    };
  }
  return base;
}

const facets = Object.fromEntries(FACET_ORDER.map((k) => [k, scaffoldFacet(k)]));

const day = {
  schemaVersion: 1,
  index,
  slug,
  theme,
  status: 'draft',
  registers: ['awe'],
  regions: ['global'],
  eras: ['contemporary'],
  facets,
  resonanceThreads: [
    {
      facets: ['person', 'principle'],
      note: 'TODO: name a real cross-thread. If you cannot, the day is not ready.',
    },
  ],
  notes: 'Scaffolded by deep.ts. Fill every TODO and run npm run validate before publishing.',
} as unknown as Day;

writeFileSync(filePath, JSON.stringify(day, null, 2) + '\n');
console.log(`Scaffolded ${fileName} (status: draft). Fill the TODOs, then: npm run validate`);
