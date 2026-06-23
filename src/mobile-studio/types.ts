import type { Day } from '@/content/types';
import type { Judgment } from '@/content/judgments';

// Where the mobile Studio reads content from and writes judgments to. Two modes:
//   live  — the dev API (scripts/lib/studioServer.ts): every day at every status,
//           judgments written straight to the on-disk ledger. The laptop-on-LAN
//           workflow: open the phone on the dev server's address.
//   local — GitHub Pages: the published manifest (or an opt-in studio manifest with
//           drafts) for content, the browser's storage for judgments, exported on
//           demand. No backend required.
export type BackendMode = 'live' | 'local';

export interface StudioBackend {
  mode: BackendMode;
  loadDays(): Promise<Day[]>;
  loadJudgments(): Promise<Judgment[]>;
  submit(judgment: Judgment): Promise<void>;
}
