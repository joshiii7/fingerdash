import { describe, it, expect } from 'vitest';
import {
  CUSTOM_TEXT_MAX,
  DEFAULT_CUSTOM_TEXT,
  countText,
  normalizeCustomText,
  validateCustomText,
} from './customText';

describe('normalizeCustomText', () => {
  it('leaves clean text alone and reports no changes', () => {
    const result = normalizeCustomText('The quick brown fox.');
    expect(result.text).toBe('The quick brown fox.');
    expect(result.notes).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it('trims the ends', () => {
    expect(normalizeCustomText('   hello world \n').text).toBe('hello world');
  });

  it('collapses repeated spaces, tabs, and newlines into single spaces', () => {
    const result = normalizeCustomText('one   two\n\nthree\tfour\r\nfive');
    expect(result.text).toBe('one two three four five');
    expect(result.notes).toContain('Combined line breaks and repeated spaces into single spaces.');
  });

  it('does not mention whitespace when only the ends were trimmed', () => {
    expect(normalizeCustomText('  hello  ').notes).toEqual([]);
  });

  it('replaces curly quotes with plain quotes', () => {
    const result = normalizeCustomText('“It’s fine,” she said. ‘Really’.');
    expect(result.text).toBe("\"It's fine,\" she said. 'Really'.");
    expect(result.notes).toEqual(['Replaced 5 curly quotes with plain quotes.']);
  });

  it('replaces en, em, and other long dashes with a hyphen', () => {
    const result = normalizeCustomText('a–b — c―d');
    expect(result.text).toBe('a-b - c-d');
    expect(result.notes).toEqual(['Replaced 3 long dashes with a hyphen.']);
  });

  it('replaces the ellipsis character with three periods', () => {
    const result = normalizeCustomText('wait… what…');
    expect(result.text).toBe('wait... what...');
    expect(result.notes).toEqual(['Replaced 2 ellipses with three periods.']);
  });

  it('uses singular wording for a single change', () => {
    expect(normalizeCustomText('a—b').notes).toEqual(['Replaced 1 long dash with a hyphen.']);
  });

  it('treats non-breaking spaces as ordinary spaces', () => {
    expect(normalizeCustomText('a b').text).toBe('a b');
  });

  it("removes characters that can't be typed on a US keyboard and says which", () => {
    const result = normalizeCustomText('café naïve 你好');
    expect(result.text).toBe('caf nave');
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toContain('Removed 4 characters');
    expect(result.notes[0]).toContain('é');
  });

  it('removes emoji cleanly, counting each once', () => {
    const result = normalizeCustomText('hello \u{1f600} world');
    expect(result.text).toBe('hello world');
    expect(result.notes[0]).toContain('Removed 1 character');
  });

  it('removes control characters and zero-width characters', () => {
    expect(normalizeCustomText('a​b\u0007c').text).toBe('abc');
  });

  it('collapses spaces left behind by removed characters', () => {
    expect(normalizeCustomText('one é two').text).toBe('one two');
  });

  it('always returns printable ASCII with single spaces', () => {
    const messy = '  “Héllo”—world… \n\n \t café  \u{1f680}  ';
    const { text } = normalizeCustomText(messy);
    expect(text).toMatch(/^[\x20-\x7e]*$/);
    expect(text).not.toMatch(/ {2}/);
    expect(text).toBe(text.trim());
  });

  it('caps the text at the limit and says so', () => {
    const result = normalizeCustomText('word '.repeat(2000));
    expect(result.text.length).toBeLessThanOrEqual(CUSTOM_TEXT_MAX);
    expect(result.truncated).toBe(true);
    expect(result.text.endsWith(' ')).toBe(false);
    expect(result.notes.at(-1)).toContain('5,000');
  });

  it('accepts text exactly at the limit', () => {
    const result = normalizeCustomText('a'.repeat(CUSTOM_TEXT_MAX));
    expect(result.text).toHaveLength(CUSTOM_TEXT_MAX);
    expect(result.truncated).toBe(false);
  });

  it('is empty for whitespace-only input', () => {
    expect(normalizeCustomText(' \n\t ').text).toBe('');
  });

  it('is idempotent', () => {
    const once = normalizeCustomText('“A” — b…  c').text;
    expect(normalizeCustomText(once).text).toBe(once);
    expect(normalizeCustomText(once).notes).toEqual([]);
  });
});

describe('countText', () => {
  it('counts characters and words', () => {
    expect(countText('one two three')).toEqual({ characters: 13, words: 3 });
  });

  it('is zero for empty text', () => {
    expect(countText('')).toEqual({ characters: 0, words: 0 });
  });
});

describe('validateCustomText', () => {
  it('rejects empty text with a message', () => {
    expect(validateCustomText('')).toMatch(/enter some text/i);
  });

  it('accepts any non-empty text', () => {
    expect(validateCustomText('x')).toBeNull();
  });
});

describe('DEFAULT_CUSTOM_TEXT', () => {
  it('starts with the classic pangram and is about 30 words of typeable ASCII', () => {
    expect(DEFAULT_CUSTOM_TEXT.startsWith('a quick brown fox jumps over the lazy dog')).toBe(true);
    const { words } = countText(DEFAULT_CUSTOM_TEXT);
    expect(words).toBeGreaterThanOrEqual(25);
    expect(words).toBeLessThanOrEqual(40);
    expect(normalizeCustomText(DEFAULT_CUSTOM_TEXT).text).toBe(DEFAULT_CUSTOM_TEXT);
  });
});
