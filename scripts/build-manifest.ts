#!/usr/bin/env tsx
// Generates content/manifest.json (the ordered, app-facing day index) and copies the
// /content tree into /public/content so the app can fetch JSON at runtime.
//
// The reader manifest lists published days only (pass --all to include every status
// in development). It also emits studio-manifest.json — an all-statuses index the
// mobile Studio reads — and ships every day file. During the beta the review surface
// covers drafts too, so unpublished days are part of the public build (unlinked by
// the reader). Only private Studio metadata (the ledger) is withheld.
import { basename, join } from 'node:path';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { loadDays } from './lib/content.ts';
import { CONTENT_DIR, MANIFEST_FILE, PUBLIC_CONTENT_DIR } from './lib/paths.ts';

// Private Studio metadata that must never be copied into the build.
const PRIVATE_CONTENT = new Set(['judgments.jsonl']);
import type { Manifest, ManifestEntry } from '@/content/types';

const includeAll = process.argv.includes('--all');

const days = loadDays();

function entryOf({ file, day }: ReturnType<typeof loadDays>[number]): ManifestEntry {
  return {
    index: day.index,
    slug: day.slug,
    file: `days/${file}`,
    theme: day.theme,
    status: day.status,
  };
}

const allEntries: ManifestEntry[] = days.map(entryOf).sort((a, b) => a.index - b.index);
const entries = allEntries.filter((e) => includeAll || e.status === 'published');

const now = new Date().toISOString();

// The reader manifest: published days (or all, with --all).
writeFileSync(
  MANIFEST_FILE,
  JSON.stringify(
    { schemaVersion: 1, generatedAt: now, days: entries } satisfies Manifest,
    null,
    2,
  ) + '\n',
);

// Copy the content tree for runtime fetching. Every day file ships (the Studio
// reviews drafts); only private metadata is withheld.
rmSync(PUBLIC_CONTENT_DIR, { recursive: true, force: true });
mkdirSync(PUBLIC_CONTENT_DIR, { recursive: true });
cpSync(CONTENT_DIR, PUBLIC_CONTENT_DIR, {
  recursive: true,
  filter: (src) => !PRIVATE_CONTENT.has(basename(src)),
});

// The studio manifest: every day, every status, for the mobile review surface.
writeFileSync(
  join(PUBLIC_CONTENT_DIR, 'studio-manifest.json'),
  JSON.stringify(
    { schemaVersion: 1, generatedAt: now, days: allEntries } satisfies Manifest,
    null,
    2,
  ) + '\n',
);

console.log(
  `Manifest written: ${entries.length} published day(s); studio manifest: ${allEntries.length} day(s) (all statuses). Content copied to public/content.`,
);
