// Pure day-advance logic, kept separate from the store so it is trivially unit-testable.
//
// Rules (from the PRD, with the open decisions resolved):
//  - A "calendar day" boundary is the device's LOCAL midnight.
//  - First ever use unlocks Day 1 and anchors the metric window.
//  - On a new calendar day, advance by EXACTLY ONE day, no matter how long the gap.
//    A five-day absence still unlocks one new day. The sequence waits; no streak guilt.
//  - The current index is clamped to the highest published day. If the next day is not
//    published yet, the reader stays on the last published day ("caught up").

export interface SequenceState {
  currentDayIndex: number;
  lastAdvanceDateKey: string | null; // local "YYYY-MM-DD" of the last unlock
  startedAt: string | null; // ISO timestamp of first daily use
}

// Local calendar date key, e.g. "2026-06-06". Uses local time, not UTC.
export function localDateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function advanceSequence(
  state: SequenceState,
  now: Date,
  maxPublishedIndex: number,
): SequenceState {
  const today = localDateKey(now);

  // First ever use.
  if (state.lastAdvanceDateKey === null) {
    return {
      currentDayIndex: clamp(1, maxPublishedIndex),
      lastAdvanceDateKey: today,
      startedAt: state.startedAt ?? now.toISOString(),
    };
  }

  // Same calendar day: no advance.
  if (state.lastAdvanceDateKey === today) {
    return { ...state, currentDayIndex: clamp(state.currentDayIndex, maxPublishedIndex) };
  }

  // A new calendar day: advance by exactly one, then clamp.
  return {
    ...state,
    currentDayIndex: clamp(state.currentDayIndex + 1, maxPublishedIndex),
    lastAdvanceDateKey: today,
  };
}

function clamp(index: number, maxPublishedIndex: number): number {
  if (maxPublishedIndex < 1) return 1;
  if (index < 1) return 1;
  if (index > maxPublishedIndex) return maxPublishedIndex;
  return index;
}
