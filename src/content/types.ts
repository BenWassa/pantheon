// Canonical Pantheon content types.
// This file is the single source of truth, imported by BOTH the app runtime and
// the content pipeline scripts. The JSON Schema files under /schema mirror these.

// ---- Controlled vocabulary -------------------------------------------------

// Register is a closed union: exactly the six values named in the Editorial Charter.
export type Register = 'elegy' | 'redemption' | 'defiance' | 'tenderness' | 'comedy' | 'awe';

export const REGISTERS: readonly Register[] = [
  'elegy',
  'redemption',
  'defiance',
  'tenderness',
  'comedy',
  'awe',
] as const;

// Region and era are open strings validated against vocab.json so they can grow
// without code changes.
export type Region = string;
export type Era = string;

// ---- Facets ----------------------------------------------------------------

export type FacetKey = 'person' | 'picture' | 'poem' | 'principle' | 'passage' | 'parallel';

// The fixed order the app always renders the six facets in.
export const FACET_ORDER: readonly FacetKey[] = [
  'person',
  'picture',
  'poem',
  'principle',
  'passage',
  'parallel',
] as const;

export interface Source {
  kind: 'primary' | 'secondary';
  title: string;
  author?: string;
  url?: string;
  publisher?: string;
  year?: number;
  accessed?: string; // ISO date for web sources
  note?: string; // e.g. "legend, not fact"
}

// A reference from a facet into the entity ledger.
export interface EntityRef {
  slug: string; // foreign key into entities.json
  qid?: string; // Wikidata QID, e.g. "Q42" (omitted only when none exists)
  role?: string; // how this entity appears in this facet
}

export type ImageLicense =
  | 'PD'
  | 'CC0'
  | 'CC-BY'
  | 'CC-BY-SA'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0';

export interface ImageRef {
  src: string; // local path under /content/images OR a Commons file URL
  commonsFile?: string; // "File:Pieter_Bruegel...jpg"
  width?: number;
  height?: number;
  alt: string; // required for accessibility
  attribution: string; // human-readable credit line
  license: ImageLicense;
  licenseUrl?: string;
  sourceUrl: string; // the page the image came from (e.g. Commons file page)
}

// A poem is either public domain (shown in full) or in copyright (excerpt + pointer).
export type PoemText =
  | { status: 'public-domain'; full: string }
  | { status: 'in-copyright'; excerpt?: string; pointerUrl: string; pointerLabel: string };

interface FacetBase {
  key: FacetKey;
  oneWord: string; // the single word shown on the dark grid
  title: string; // revealed heading
  body: string; // 80-130 words, no em dashes
  sources: Source[]; // >= 1 required
  entities?: EntityRef[];
}

export interface PersonFacet extends FacetBase {
  key: 'person';
}
export interface PrincipleFacet extends FacetBase {
  key: 'principle';
}
export interface ParallelFacet extends FacetBase {
  key: 'parallel';
}
export interface PassageFacet extends FacetBase {
  key: 'passage';
  attribution?: string; // where the passage is drawn from
}
export interface PictureFacet extends FacetBase {
  key: 'picture';
  image: ImageRef;
}
export interface PoemFacet extends FacetBase {
  key: 'poem';
  poet?: string;
  poem: PoemText;
}

export type Facet =
  | PersonFacet
  | PictureFacet
  | PoemFacet
  | PrincipleFacet
  | PassageFacet
  | ParallelFacet;

// The named cross-link between facets. The charter's non-negotiable: a day cannot
// ship without at least one.
export interface ResonanceThread {
  facets: FacetKey[]; // >= 2 facets this thread connects
  note: string; // the named connection
}

export type DayStatus = 'draft' | 'review' | 'ready' | 'published';

export interface DayFacets {
  person: PersonFacet;
  picture: PictureFacet;
  poem: PoemFacet;
  principle: PrincipleFacet;
  passage: PassageFacet;
  parallel: ParallelFacet;
}

export interface Day {
  schemaVersion: 1;
  index: number; // 1-based, matches the filename prefix
  slug: string;
  theme: string; // human title, e.g. "Hubris"
  status: DayStatus;
  registers: Register[]; // >= 1; tracked for coverage/balance
  regions: Region[];
  eras: Era[];
  facets: DayFacets;
  resonanceThreads: ResonanceThread[]; // >= 1 required
  notes?: string; // editorial notes, never shown to the reader
}

// ---- Entity ledger ---------------------------------------------------------

export type EntityStatus =
  | 'candidate' // proposed by Scout, not yet used
  | 'researched' // Deep has gathered material
  | 'used' // appears in >= 1 published day
  | 'rejected'; // ruled out (kept for dedupe memory)

export type EntityType =
  | 'person'
  | 'artwork'
  | 'poem'
  | 'text'
  | 'place'
  | 'concept'
  | 'event';

// Entity types that should normally carry a Wikidata QID (validator warns when absent).
export const QID_EXPECTED_TYPES: readonly EntityType[] = [
  'person',
  'artwork',
  'place',
  'event',
] as const;

export interface Entity {
  slug: string; // primary key
  qid?: string; // Wikidata QID identity (preferred)
  type: EntityType;
  label: string;
  status: EntityStatus;
  usedInDays: number[]; // day indices referencing this entity
  registers?: Register[];
  regions?: Region[];
  eras?: Era[];
  aliases?: string[]; // for dedupe matching
  notes?: string;
}

export interface EntityLedger {
  schemaVersion: 1;
  entities: Entity[];
}

// ---- Vocab file ------------------------------------------------------------

export interface VocabTerm {
  id: string;
  label: string;
}

export interface EraTerm extends VocabTerm {
  from?: number;
  to?: number;
}

export interface Vocab {
  registers: Register[];
  regions: VocabTerm[];
  eras: EraTerm[];
}

// ---- Manifest (generated) --------------------------------------------------

export interface ManifestEntry {
  index: number;
  slug: string;
  file: string; // "days/001-hubris.json"
  theme: string;
  status: DayStatus;
}

export interface Manifest {
  schemaVersion: 1;
  generatedAt: string;
  days: ManifestEntry[]; // ordered by index
}
