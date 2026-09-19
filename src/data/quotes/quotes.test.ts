import { describe, it, expect } from 'vitest';
import {
  QUOTES,
  QUOTE_LENGTH_OPTIONS,
  QUOTE_MEDIUM_MAX,
  QUOTE_SHORT_MAX,
  pickQuote,
  quotesFor,
} from './index';
import { pickAvoidingRepeat } from '../../lib/engine/pick';
import { createSeededRng } from '../../lib/engine/punctuation';

describe('bundled quotes', () => {
  it('has at least 40 quotes with unique ids', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(QUOTES.map((q) => q.id)).size).toBe(QUOTES.length);
  });

  it('has no duplicate text', () => {
    expect(new Set(QUOTES.map((q) => q.text)).size).toBe(QUOTES.length);
  });

  it('gives every quote text, a source, and a length group', () => {
    for (const quote of QUOTES) {
      expect(quote.text.trim().length, quote.id).toBeGreaterThan(10);
      expect(quote.source.trim().length, quote.id).toBeGreaterThan(0);
      expect(['short', 'medium', 'long'], quote.id).toContain(quote.length);
    }
  });

  it('is typeable ASCII with single spaces and no leading or trailing space', () => {
    for (const { id, text, source } of QUOTES) {
      expect(text, id).toMatch(/^[\x20-\x7e]+$/);
      expect(source, id).toMatch(/^[\x20-\x7e]+$/);
      expect(text, id).not.toMatch(/ {2}/);
      expect(text, id).toBe(text.trim());
    }
  });

  it('assigns each quote to the group its length implies', () => {
    for (const { id, text, length } of QUOTES) {
      const expected =
        text.length <= QUOTE_SHORT_MAX
          ? 'short'
          : text.length <= QUOTE_MEDIUM_MAX
            ? 'medium'
            : 'long';
      expect(length, id).toBe(expected);
    }
  });

  it('has at least 8 quotes in every length group', () => {
    for (const group of ['short', 'medium', 'long'] as const) {
      expect(quotesFor(group).length, group).toBeGreaterThanOrEqual(8);
    }
  });

  it('offers all four length filters', () => {
    expect(QUOTE_LENGTH_OPTIONS.map((o) => o.id)).toEqual(['all', 'short', 'medium', 'long']);
    expect(quotesFor('all')).toHaveLength(QUOTES.length);
  });
});

describe('pickQuote', () => {
  it('only returns quotes from the chosen group', () => {
    const rng = createSeededRng(4);
    for (let i = 0; i < 100; i++) {
      expect(pickQuote('short', null, rng).length).toBe('short');
      expect(pickQuote('long', null, rng).length).toBe('long');
    }
  });

  it('never repeats the previous quote', () => {
    const rng = createSeededRng(9);
    let previous: string | null = null;
    for (let i = 0; i < 300; i++) {
      const quote = pickQuote('all', previous, rng);
      expect(quote.id).not.toBe(previous);
      previous = quote.id;
    }
  });

  it('eventually shows different quotes', () => {
    const rng = createSeededRng(2);
    const ids = new Set(Array.from({ length: 60 }, () => pickQuote('all', null, rng).id));
    expect(ids.size).toBeGreaterThan(10);
  });
});

describe('pickAvoidingRepeat', () => {
  it('repeats when there is only one item', () => {
    expect(pickAvoidingRepeat([{ id: 'a' }], 'a').id).toBe('a');
  });

  it('throws on an empty list', () => {
    expect(() => pickAvoidingRepeat([], null)).toThrow();
  });

  it('ignores an unknown previous id', () => {
    expect(pickAvoidingRepeat([{ id: 'a' }, { id: 'b' }], 'zzz', () => 0).id).toBe('a');
  });
});
