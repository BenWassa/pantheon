import { describe, it, expect } from 'vitest';
import { countWords, isBodyWithinBounds } from './wordCount';

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('one two three')).toBe(3);
    expect(countWords('  spaced   out \n words ')).toBe(3);
  });

  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('isBodyWithinBounds', () => {
  it('rejects bodies that are too short', () => {
    expect(isBodyWithinBounds('a few words only')).toBe(false);
  });

  it('accepts a body within the 80-130 word band', () => {
    const body = Array.from({ length: 100 }, () => 'word').join(' ');
    expect(isBodyWithinBounds(body)).toBe(true);
  });

  it('rejects bodies that are too long', () => {
    const body = Array.from({ length: 200 }, () => 'word').join(' ');
    expect(isBodyWithinBounds(body)).toBe(false);
  });
});
