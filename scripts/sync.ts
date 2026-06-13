#!/usr/bin/env tsx
// Sync: reconcile the entity ledger against the actual day files. The ledger's
// usedInDays and used-status are derived truth, not hand-kept bookkeeping, so this
// recomputes them from what the days really reference. This is what keeps the ledger
// honest as the library scales.
//
// Usage:
//   npm run sync            # rewrite entities.json with the reconciled ledger
//   npm run sync -- --check # report drift and exit non-zero if any (CI-friendly, no write)
import { writeFileSync } from 'node:fs';
import { loadDays, loadEntities } from './lib/content.ts';
import { reconcile } from './lib/ledger.ts';
import { ENTITIES_FILE } from './lib/paths.ts';

const checkOnly = process.argv.includes('--check');

const days = loadDays();
const ledger = loadEntities();
const { entities, changes, missing } = reconcile(ledger.entities, days);

for (const c of changes) console.log(`  ${c.kind.padEnd(11)} ${c.slug}: ${c.message}`);
for (const m of missing) {
  console.error(
    `  MISSING     ${m.slug}: referenced by day ${m.usedInDays.join(', ')} but absent from entities.json`,
  );
}

const clean = changes.length === 0 && missing.length === 0;

if (checkOnly) {
  if (clean) {
    console.log('Ledger is in sync with the day files. OK.');
    process.exit(0);
  }
  console.error(
    `\nLedger drift: ${changes.length} change(s), ${missing.length} missing entity(ies). Run npm run sync.`,
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `\n${missing.length} referenced entity(ies) are missing from entities.json. Add them before syncing; refusing to write.`,
  );
  process.exit(1);
}

if (clean) {
  console.log('Ledger already in sync; nothing to write.');
  process.exit(0);
}

writeFileSync(ENTITIES_FILE, JSON.stringify({ ...ledger, entities }, null, 2) + '\n');
console.log(`\nReconciled ${changes.length} change(s); wrote entities.json.`);
