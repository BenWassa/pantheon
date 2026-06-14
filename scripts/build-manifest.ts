#!/usr/bin/env tsx
// Generates content/manifest.json (the ordered, app-facing day index) and copies the
// /content tree into /public/content so the app can fetch JSON at runtime.
//
// By default the app-facing manifest includes only published days. Pass --all to
// include every status (useful in development).
import { basename } from 'node:path';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { loadDays } from './lib/content.ts';
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

// Copy content into /public/content for runtime fetching.
rmSync(PUBLIC_CONTENT_DIR, { recursive: true, force: true });
mkdirSync(PUBLIC_CONTENT_DIR, { recursive: true });
cpSync(CONTENT_DIR, PUBLIC_CONTENT_DIR, {
  recursive: true,
  filter: (src) => !PRIVATE_CONTENT.has(basename(src)),
});

console.log(
  `Manifest written: ${entries.length} day(s)${includeAll ? ' (all statuses)' : ' (published only)'}; content copied to public/content.`,
);
