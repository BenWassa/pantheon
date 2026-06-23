import type { Verdict } from '@/content/judgments';

// Presentation for the four verdicts on the mobile surface: a glyph, the text
// color token (see tailwind verdict.*), and the one-line meaning. The vocabulary
// itself lives in @/content/judgments; this is only how it looks on the phone.
export const VERDICT_META: Record<
  Verdict,
  { glyph: string; label: string; color: string; hint: string }
> = {
  // A geometric fill-level system, not social iconography: full = alive, empty =
  // lifeless, half = partial, struck = rejected.
  keep: { glyph: '●', label: 'Keep', color: 'text-verdict-keep', hint: 'Alive. It belongs.' },
  flat: {
    glyph: '○',
    label: 'Flat',
    color: 'text-verdict-flat',
    hint: 'Not wrong, just lifeless.',
  },
  fix: { glyph: '◐', label: 'Fix', color: 'text-verdict-fix', hint: 'Worth keeping, needs work.' },
  cut: { glyph: '✕', label: 'Cut', color: 'text-verdict-cut', hint: 'Reject.' },
};

export const VERDICT_BG: Record<Verdict, string> = {
  keep: 'bg-verdict-keep',
  flat: 'bg-verdict-flat',
  fix: 'bg-verdict-fix',
  cut: 'bg-verdict-cut',
};
