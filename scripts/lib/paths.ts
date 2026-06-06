import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// scripts/lib -> repo root is two levels up.
export const REPO_ROOT = join(here, '..', '..');

export const CONTENT_DIR = join(REPO_ROOT, 'content');
export const DAYS_DIR = join(CONTENT_DIR, 'days');
export const IMAGES_DIR = join(CONTENT_DIR, 'images');
export const ENTITIES_FILE = join(CONTENT_DIR, 'entities.json');
export const VOCAB_FILE = join(CONTENT_DIR, 'vocab.json');
export const MANIFEST_FILE = join(CONTENT_DIR, 'manifest.json');

export const SCHEMA_DIR = join(REPO_ROOT, 'schema');
export const PUBLIC_CONTENT_DIR = join(REPO_ROOT, 'public', 'content');
