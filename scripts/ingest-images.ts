#!/usr/bin/env tsx
// Ingests Wikimedia-sourced image data into canonical day files.
//
// The /wikimedia-images skill produces verified copies named:
//   NNN-slug-wikimedia-sourced-verified.json  (or any *-wikimedia-sourced*.json variant)
//
// This script:
//   1. Finds all such files in content/days/
//   2. Extracts the image object from each facet
//   3. Merges them into the matching canonical NNN-slug.json
//   4. Deletes the sourced file
//   5. Reports what changed
//
// Pass --dry-run to preview without writing.
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DAYS_DIR } from './lib/paths.ts';
import type { Day } from '@/content/types.ts';

const dryRun = process.argv.includes('--dry-run');

// Matches files like "003-mercy-wikimedia-sourced-verified.json"
// capturing the NNN-slug prefix so we can find the canonical file.
const SOURCED_RE = /^(\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*?)-wikimedia-sourced.*\.json$/;

const allFiles = readdirSync(DAYS_DIR).sort();
const sourcedFiles = allFiles.filter((f) => SOURCED_RE.test(f));

if (sourcedFiles.length === 0) {
  console.log('No wikimedia-sourced files found in content/days/. Nothing to do.');
  process.exit(0);
}

let totalMerged = 0;
let totalSkipped = 0;

for (const sourcedFile of sourcedFiles) {
  const match = SOURCED_RE.exec(sourcedFile)!;
  const prefix = match[1]!; // e.g. "003-mercy"
  const canonicalFile = `${prefix}.json`;
  const sourcedPath = join(DAYS_DIR, sourcedFile);
  const canonicalPath = join(DAYS_DIR, canonicalFile);

  // Check canonical exists
  if (!allFiles.includes(canonicalFile)) {
    console.warn(`  SKIP  ${sourcedFile}: no matching canonical file "${canonicalFile}"`);
    totalSkipped++;
    continue;
  }

  const sourced = JSON.parse(readFileSync(sourcedPath, 'utf8')) as Day;
  const canonical = JSON.parse(readFileSync(canonicalPath, 'utf8')) as Day;

  if (sourced.slug !== canonical.slug || sourced.index !== canonical.index) {
    console.warn(
      `  SKIP  ${sourcedFile}: slug/index mismatch with ${canonicalFile} — check manually`,
    );
    totalSkipped++;
    continue;
  }

  const facetKeys = Object.keys(sourced.facets) as Array<keyof typeof sourced.facets>;
  const changed: string[] = [];

  for (const key of facetKeys) {
    const sourcedFacet = sourced.facets[key] as unknown as Record<string, unknown>;
    const canonicalFacet = canonical.facets[key] as unknown as Record<string, unknown>;

    if (!sourcedFacet?.image) continue;

    // Strip skill-internal fields that aren't part of the content schema.
    const image = { ...(sourcedFacet.image as Record<string, unknown>) };
    delete image['imageConfidence'];
    delete image['imageSearchNote'];
    sourcedFacet.image = image;

    const existing = canonicalFacet?.image as Record<string, unknown> | undefined;
    const isPlaceholder =
      !existing || (typeof existing.src === 'string' && existing.src.includes('placeholder'));

    if (existing && !isPlaceholder) {
      // Only overwrite if the sourced image is a different/better file
      if (existing.src === (sourcedFacet.image as Record<string, unknown>).src) continue;
    }

    canonicalFacet.image = sourcedFacet.image;
    changed.push(key);
  }

  if (changed.length === 0) {
    console.log(`  same  ${canonicalFile}: all images already up to date`);
    if (!dryRun) rmSync(sourcedPath);
    continue;
  }

  if (dryRun) {
    console.log(`  dry   ${canonicalFile}: would merge images for [${changed.join(', ')}]`);
  } else {
    writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2) + '\n');
    rmSync(sourcedPath);
    console.log(`  merge ${canonicalFile}: images merged for [${changed.join(', ')}]`);
  }

  totalMerged++;
}

const verb = dryRun ? 'Would merge' : 'Merged';
console.log(`\n${verb} ${totalMerged} file(s), skipped ${totalSkipped}.`);
if (dryRun) console.log('Run without --dry-run to apply.');
