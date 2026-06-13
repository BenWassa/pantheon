// The trust gate. Structural validation via JSON Schema (Ajv) plus the
// charter-specific rules that are awkward to express in pure JSON Schema.
//
// Returns a structured result so it can be used both by the CLI (scripts/validate.ts)
// and by a Vitest content gate (src/test/validate.test.ts).

import { FACET_ORDER, QID_EXPECTED_TYPES, REGISTERS } from '@/content/types';
import type { Day, DayFacets, Entity, FacetKey } from '@/content/types';
import { countWords, FACET_BODY_MIN_WORDS, FACET_BODY_MAX_WORDS } from '@/lib/wordCount';
import { loadDays, loadEntities, loadVocab, parseDayFileName } from './content.ts';
import { deriveUsage } from './ledger.ts';
import { ENTITY_REUSE_LIMIT, GREATEST_HITS } from './coverage.ts';
import {
  formatAjvErrors,
  validateDaySchema,
  validateEntitiesSchema,
  validateVocabSchema,
} from './schema.ts';

export interface Issue {
  level: 'error' | 'warning';
  where: string;
  message: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
  daysChecked: number;
}

const EM_DASH = '—';
const EN_DASH = '–';

// Sentinels left by the scaffolder (deep.ts) or by structural placeholder days. A day
// carrying any of these has not been authored to charter standard and must never reach
// the app as `published`.
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /placeholder/i,
  /\bTODO\b/,
  /pending research/i,
  /not for publication/i,
];

// All reader-facing text fields on a facet, used for the typographic checks.
function facetTextFields(key: FacetKey, facet: DayFacets[FacetKey]): string[] {
  const fields = [facet.oneWord, facet.title, facet.body];
  if (key === 'poem') {
    const poem = (facet as DayFacets['poem']).poem;
    if (poem.status === 'public-domain') fields.push(poem.full);
    else if (poem.excerpt) fields.push(poem.excerpt);
  }
  if (key === 'picture') {
    fields.push((facet as DayFacets['picture']).image.attribution);
  }
  return fields;
}

function checkDay(
  day: Day,
  file: string,
  entitiesBySlug: Map<string, Entity>,
  validRegions: Set<string>,
  validEras: Set<string>,
  push: (i: Issue) => void,
): void {
  const at = `${file}`;

  // Filename <-> index <-> slug consistency.
  const parsed = parseDayFileName(file);
  if (!parsed) {
    push({ level: 'error', where: at, message: `filename does not match NNN-slug.json` });
  } else {
    if (parsed.index !== day.index) {
      push({
        level: 'error',
        where: at,
        message: `filename index ${parsed.index} != day.index ${day.index}`,
      });
    }
    if (parsed.slug !== day.slug) {
      push({
        level: 'error',
        where: at,
        message: `filename slug "${parsed.slug}" != day.slug "${day.slug}"`,
      });
    }
  }

  // Registers must be within the closed charter vocabulary.
  for (const r of day.registers) {
    if (!REGISTERS.includes(r)) {
      push({ level: 'error', where: at, message: `unknown register "${r}"` });
    }
  }
  // Regions / eras within the controlled vocab.
  for (const region of day.regions) {
    if (!validRegions.has(region)) {
      push({ level: 'error', where: at, message: `unknown region "${region}" (see vocab.json)` });
    }
  }
  for (const era of day.eras) {
    if (!validEras.has(era)) {
      push({ level: 'error', where: at, message: `unknown era "${era}" (see vocab.json)` });
    }
  }

  // Resonance threads must reference real, distinct facet keys.
  day.resonanceThreads.forEach((thread, i) => {
    const unique = new Set(thread.facets);
    if (unique.size < 2) {
      push({
        level: 'error',
        where: `${at} resonanceThreads[${i}]`,
        message: `must connect at least 2 distinct facets`,
      });
    }
    for (const fk of thread.facets) {
      if (!FACET_ORDER.includes(fk)) {
        push({
          level: 'error',
          where: `${at} resonanceThreads[${i}]`,
          message: `unknown facet key "${fk}"`,
        });
      }
    }
  });

  // Per-facet checks.
  for (const key of FACET_ORDER) {
    const facet = day.facets[key];
    const facetAt = `${at} facets.${key}`;

    if (facet.key !== key) {
      push({ level: 'error', where: facetAt, message: `facet.key "${facet.key}" != "${key}"` });
    }

    // Word count bound (charter: 80-130).
    const words = countWords(facet.body);
    if (words < FACET_BODY_MIN_WORDS || words > FACET_BODY_MAX_WORDS) {
      push({
        level: 'error',
        where: facetAt,
        message: `body is ${words} words, expected ${FACET_BODY_MIN_WORDS}-${FACET_BODY_MAX_WORDS}`,
      });
    }

    // oneWord must be a single token.
    if (/\s/.test(facet.oneWord)) {
      push({
        level: 'error',
        where: facetAt,
        message: `oneWord "${facet.oneWord}" has whitespace`,
      });
    }

    // At least one source (schema enforces too; reported here for readability).
    if (facet.sources.length === 0) {
      push({ level: 'error', where: facetAt, message: `no sources (every claim needs one)` });
    }

    // Typography: reject em dash hard, warn on en dash.
    for (const text of facetTextFields(key, facet)) {
      if (text.includes(EM_DASH)) {
        push({ level: 'error', where: facetAt, message: `contains an em dash (U+2014)` });
      }
      if (text.includes(EN_DASH)) {
        push({ level: 'warning', where: facetAt, message: `contains an en dash (U+2013)` });
      }
    }

    // Entity cross-references resolve, QID format/expectations.
    for (const ref of facet.entities ?? []) {
      const entity = entitiesBySlug.get(ref.slug);
      if (!entity) {
        push({
          level: 'error',
          where: facetAt,
          message: `entity "${ref.slug}" not found in entities.json`,
        });
        continue;
      }
      if (ref.qid && !/^Q\d+$/.test(ref.qid)) {
        push({ level: 'error', where: facetAt, message: `bad QID format "${ref.qid}"` });
      }
      if (!ref.qid && !entity.qid && QID_EXPECTED_TYPES.includes(entity.type)) {
        push({
          level: 'warning',
          where: facetAt,
          message: `entity "${ref.slug}" (${entity.type}) has no Wikidata QID`,
        });
      }
    }
  }

  // The six grid words must be distinct: the dark grid shows one word per facet, and a
  // repeat reads as a bug to the reader and weakens the day's resonance.
  const seenWords = new Map<string, FacetKey>();
  for (const key of FACET_ORDER) {
    const word = day.facets[key].oneWord.toLocaleLowerCase();
    const prior = seenWords.get(word);
    if (prior) {
      push({
        level: 'error',
        where: `${at} facets.${key}`,
        message: `oneWord "${day.facets[key].oneWord}" duplicates facets.${prior}`,
      });
    } else {
      seenWords.set(word, key);
    }
  }

  // A published day must carry no scaffolding or placeholder sentinels. This is the
  // trust gate's line against placeholder content masquerading as finished work.
  if (day.status === 'published') {
    const guarded: string[] = [];
    for (const key of FACET_ORDER) {
      const f = day.facets[key];
      guarded.push(f.oneWord, f.title, f.body);
      for (const src of f.sources) guarded.push(src.title, src.note ?? '');
    }
    const hit = PLACEHOLDER_PATTERNS.find((re) => guarded.some((t) => re.test(t)));
    if (hit) {
      push({
        level: 'error',
        where: at,
        message: `published day contains placeholder/scaffold text (matched ${hit}); author it or lower its status`,
      });
    }
  }

  // In-copyright poems must never carry full text (schema enforces; double-checked).
  const poem = day.facets.poem.poem;
  if (poem.status === 'in-copyright' && 'full' in poem) {
    push({
      level: 'error',
      where: `${at} facets.poem`,
      message: `in-copyright poem must not include full text`,
    });
  }
}

// Validate a single day object in memory (schema + charter rules). Used by the
// test suite to prove the gate catches deliberately broken content. Entity refs are
// cross-checked against the real ledger so an otherwise-valid day stays valid.
export function validateDayObject(day: unknown, file = 'in-memory.json'): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const push = (i: Issue) => (i.level === 'error' ? errors : warnings).push(i);

  const vocab = loadVocab();
  const validRegions = new Set(vocab.regions.map((r) => r.id));
  const validEras = new Set(vocab.eras.map((e) => e.id));
  const entitiesBySlug = new Map(loadEntities().entities.map((e) => [e.slug, e]));

  if (!validateDaySchema(day)) {
    push({ level: 'error', where: file, message: '\n' + formatAjvErrors(validateDaySchema) });
    return { errors, warnings, daysChecked: 1 };
  }
  checkDay(day as Day, file, entitiesBySlug, validRegions, validEras, push);
  return { errors, warnings, daysChecked: 1 };
}

export function validateAll(): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const push = (i: Issue) => (i.level === 'error' ? errors : warnings).push(i);

  // --- Vocab ---
  const vocab = loadVocab();
  if (!validateVocabSchema(vocab)) {
    push({
      level: 'error',
      where: 'vocab.json',
      message: '\n' + formatAjvErrors(validateVocabSchema),
    });
  }
  const validRegions = new Set(vocab.regions.map((r) => r.id));
  const validEras = new Set(vocab.eras.map((e) => e.id));

  // --- Entities ---
  const ledger = loadEntities();
  if (!validateEntitiesSchema(ledger)) {
    push({
      level: 'error',
      where: 'entities.json',
      message: '\n' + formatAjvErrors(validateEntitiesSchema),
    });
  }
  const entitiesBySlug = new Map(ledger.entities.map((e) => [e.slug, e]));

  // --- Days ---
  const days = loadDays();
  const seenIndexes = new Map<number, string>();

  for (const { file, day } of days) {
    // Structural first; if it fails, skip the semantic checks for this file.
    if (!validateDaySchema(day)) {
      push({ level: 'error', where: file, message: '\n' + formatAjvErrors(validateDaySchema) });
      continue;
    }
    const prior = seenIndexes.get(day.index);
    if (prior) {
      push({
        level: 'error',
        where: file,
        message: `duplicate index ${day.index} (also ${prior})`,
      });
    } else {
      seenIndexes.set(day.index, file);
    }
    checkDay(day, file, entitiesBySlug, validRegions, validEras, push);
  }

  // Index gap warning (published days should be a contiguous 1..N run).
  const indexes = [...seenIndexes.keys()].sort((a, b) => a - b);
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1) {
      warnings.push({
        level: 'warning',
        where: 'content/days',
        message: `index sequence has a gap near ${indexes[i]} (expected ${i + 1})`,
      });
      break;
    }
  }

  // Ledger drift: the stored usedInDays must match what the day files actually
  // reference. Hand-maintained, this is the first thing to rot as the library grows,
  // so the gate surfaces it (a warning; `npm run sync` repairs it).
  const usage = deriveUsage(days);
  for (const entity of ledger.entities) {
    const derived = usage.get(entity.slug) ?? [];
    const stored = [...entity.usedInDays].sort((a, b) => a - b);
    if (derived.length !== stored.length || derived.some((v, i) => v !== stored[i])) {
      warnings.push({
        level: 'warning',
        where: 'entities.json',
        message: `entity "${entity.slug}" usedInDays [${stored.join(', ')}] != actual [${derived.join(', ')}] (run npm run sync)`,
      });
    }
    // Taste rule: an entity leaned on across many days drifts toward a house style.
    if (derived.length > ENTITY_REUSE_LIMIT) {
      warnings.push({
        level: 'warning',
        where: 'entities.json',
        message: `entity "${entity.slug}" is used in ${derived.length} days (> ${ENTITY_REUSE_LIMIT}); prefer fresh material`,
      });
    }
  }

  // Taste rule: the greatest hits are allowed only when genuinely best, never as a reflex.
  for (const e of ledger.entities) {
    if ((GREATEST_HITS as readonly string[]).includes(e.slug) && e.status === 'used') {
      warnings.push({
        level: 'warning',
        where: 'entities.json',
        message: `greatest-hits entity "${e.slug}" is in use; confirm it is genuinely the best choice`,
      });
    }
  }

  return { errors, warnings, daysChecked: days.length };
}
