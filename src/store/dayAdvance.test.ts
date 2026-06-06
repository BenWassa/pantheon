import { describe, it, expect } from 'vitest';
import { advanceSequence, localDateKey, type SequenceState } from './dayAdvance';

const at = (s: string) => new Date(s);

describe('advanceSequence', () => {
  const fresh: SequenceState = {
    currentDayIndex: 1,
    lastAdvanceDateKey: null,
    startedAt: null,
  };

  it('first use unlocks Day 1 and anchors the metric window', () => {
    const next = advanceSequence(fresh, at('2026-06-06T09:00:00'), 3);
    expect(next.currentDayIndex).toBe(1);
    expect(next.lastAdvanceDateKey).toBe('2026-06-06');
    expect(next.startedAt).not.toBeNull();
  });

  it('does not advance twice in the same calendar day', () => {
    const day1 = advanceSequence(fresh, at('2026-06-06T09:00:00'), 3);
    const later = advanceSequence(day1, at('2026-06-06T22:00:00'), 3);
    expect(later.currentDayIndex).toBe(1);
  });

  it('advances by exactly one on the next calendar day', () => {
    const day1 = advanceSequence(fresh, at('2026-06-06T09:00:00'), 3);
    const day2 = advanceSequence(day1, at('2026-06-07T08:00:00'), 3);
    expect(day2.currentDayIndex).toBe(2);
    expect(day2.lastAdvanceDateKey).toBe('2026-06-07');
  });

  it('a multi-day gap still unlocks only one day (no streak guilt)', () => {
    const day1 = advanceSequence(fresh, at('2026-06-06T09:00:00'), 3);
    const afterGap = advanceSequence(day1, at('2026-06-20T09:00:00'), 3);
    expect(afterGap.currentDayIndex).toBe(2);
  });

  it('clamps to the highest published day', () => {
    let state = advanceSequence(fresh, at('2026-06-06T09:00:00'), 2);
    state = advanceSequence(state, at('2026-06-07T09:00:00'), 2); // -> 2
    state = advanceSequence(state, at('2026-06-08T09:00:00'), 2); // would be 3, clamp to 2
    expect(state.currentDayIndex).toBe(2);
  });

  it('preserves startedAt across advances', () => {
    const day1 = advanceSequence(fresh, at('2026-06-06T09:00:00'), 3);
    const day2 = advanceSequence(day1, at('2026-06-07T09:00:00'), 3);
    expect(day2.startedAt).toBe(day1.startedAt);
  });
});

describe('localDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(localDateKey(new Date('2026-01-09T12:00:00'))).toBe('2026-01-09');
  });
});
