#!/usr/bin/env tsx
// Generates content/manifest.json (the ordered, app-facing day index) and copies the
// /content tree into /public/content so the app can fetch JSON at runtime.
//
// By default the app-facing manifest includes only published days. Pass --all to
// include every status (useful in development).
import { basename } from 'node:path';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { loadDays, parseDayFileName } from './lib/content.ts';
import { CONTENT_DIR, MANIFEST_FILE, PUBLIC_CONTENT_DIR } from './lib/paths.ts';

// Private Studio metadata that must never be copied into the reader build.
const PRIVATE_CONTENT = new Set(['judgments.jsonl']);
import type { Manifest, ManifestEntry } from '@/content/types';

const includeAll = process.argv.includes('--all');

const days = loadDays();

const entries: ManifestEntry[] = days
  .map(({ file, day }) => ({
    index: day.index,
    slug: day.slug,
    file: `days/${file}`,
    theme: day.theme,
    status: day.status,
  }))
  .filter((e) => includeAll || e.status === 'published')
  .sort((a, b) => a.index - b.index);

const manifest: Manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  days: entries,
};

writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');

// Copy content into /public/content for runtime fetching. Only the day files that
// are in the manifest are shipped: unpublished drafts (and Studio test content) must
// never reach the public reader build, even unlinked. Non-day content (entities,
// vocab, images, manifest) is always copied.
const shippedDayFiles = new Set(entries.map((e) => basename(e.file)));
rmSync(PUBLIC_CONTENT_DIR, { recursive: true, force: true });
mkdirSync(PUBLIC_CONTENT_DIR, { recursive: true });
cpSync(CONTENT_DIR, PUBLIC_CONTENT_DIR, {
  recursive: true,
  filter: (src) => {
    const base = basename(src);
    if (PRIVATE_CONTENT.has(base)) return false;
    // A day file not in the manifest (e.g. a draft) is withheld from the reader build.
    if (parseDayFileName(base) && !shippedDayFiles.has(base)) return false;
    return true;
  },
});

console.log(
  `Manifest written: ${entries.length} day(s)${includeAll ? ' (all statuses)' : ' (published only)'}; content copied to public/content.`,
);
