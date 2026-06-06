import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { SCHEMA_DIR } from './paths.ts';

function loadSchema(name: string): object {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, name), 'utf8')) as object;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

export const validateDaySchema: ValidateFunction = ajv.compile(loadSchema('day.schema.json'));
export const validateEntitiesSchema: ValidateFunction = ajv.compile(
  loadSchema('entities.schema.json'),
);
export const validateVocabSchema: ValidateFunction = ajv.compile(loadSchema('vocab.schema.json'));

export function formatAjvErrors(validate: ValidateFunction): string {
  return (validate.errors ?? [])
    .map((e) => `    ${e.instancePath || '/'} ${e.message ?? ''}`)
    .join('\n');
}
