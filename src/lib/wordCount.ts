// Word counting used identically by the app (for any display) and the content
// validator (for the 80-130 word charter bound). Keeping a single implementation
// guarantees the gate and the runtime never disagree.

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

export const FACET_BODY_MIN_WORDS = 80;
export const FACET_BODY_MAX_WORDS = 130;

export function isBodyWithinBounds(text: string): boolean {
  const n = countWords(text);
  return n >= FACET_BODY_MIN_WORDS && n <= FACET_BODY_MAX_WORDS;
}
