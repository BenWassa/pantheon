#!/usr/bin/env tsx
// Content trust gate CLI. Exits non-zero on any error (and on warnings with --warn-as-error).
import { validateAll } from './lib/validateContent.ts';

const warnAsError = process.argv.includes('--warn-as-error');

const { errors, warnings, daysChecked } = validateAll();

for (const w of warnings) {
  console.warn(`  warn  ${w.where}: ${w.message}`);
}
for (const e of errors) {
  console.error(`  ERROR ${e.where}: ${e.message}`);
}

const summary = `Validated ${daysChecked} day(s): ${errors.length} error(s), ${warnings.length} warning(s).`;

if (errors.length > 0 || (warnAsError && warnings.length > 0)) {
  console.error(`\n${summary}`);
  process.exit(1);
}

console.log(`\n${summary} OK.`);
