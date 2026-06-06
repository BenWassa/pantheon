import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { Day, EntityLedger, Vocab } from '@/content/types';
import { DAYS_DIR, ENTITIES_FILE, VOCAB_FILE } from './paths.ts';

export interface LoadedDay {
  file: string; // bare filename, e.g. "001-hubris.json"
  path: string; // absolute path
  day: Day;
}

// Matches "001-hubris.json" -> { index: 1, slug: "hubris" }.
const DAY_FILE_RE = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

export function parseDayFileName(file: string): { index: number; slug: string } | null {
  const m = DAY_FILE_RE.exec(file);
  if (!m) return null;
  return { index: Number(m[1]), slug: m[2]! };
}

export function listDayFiles(): string[] {
  if (!existsSync(DAYS_DIR)) return [];
  return readdirSync(DAYS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

export function loadDays(): LoadedDay[] {
  return listDayFiles().map((file) => {
    const path = join(DAYS_DIR, file);
    const day = JSON.parse(readFileSync(path, 'utf8')) as Day;
    return { file: basename(file), path, day };
  });
}

export function loadEntities(): EntityLedger {
  if (!existsSync(ENTITIES_FILE)) return { schemaVersion: 1, entities: [] };
  return JSON.parse(readFileSync(ENTITIES_FILE, 'utf8')) as EntityLedger;
}

export function loadVocab(): Vocab {
  return JSON.parse(readFileSync(VOCAB_FILE, 'utf8')) as Vocab;
}
