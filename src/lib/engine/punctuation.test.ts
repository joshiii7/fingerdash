import { describe, it, expect } from 'vitest';
import {
  createSeededRng,
  generatePunctuationBatch,
  generatePunctuationWords,
  planSentenceLengths,
  DECORATION_RATE,
  MAX_SENTENCE_WORDS,
  MIN_SENTENCE_WORDS,
  type PunctuationOptions,
} from './punctuation';
import words from '../../data/words/en.json';
import contractions from '../../data/words/contractions.json';

function options(seed: number, extra: Partial<PunctuationOptions> = {}): PunctuationOptions {
  return {
    words: words as string[],
    contractions: contractions as string[],
    rng: createSeededRng(seed),
    ...extra,
  };
}

/** Splits a token list into sentences: each sentence ends at a token ending in . ? or !. */
function sentencesOf(tokens: string[]): string[][] {
  const sentences: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    current.push(token);
    if (/[.?!]$/.test(token)) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length > 0) sentences.push(current); // unfinished tail, caught by tests below
  return sentences;
}

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

describe('createSeededRng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = createSeededRng(7);
    const b = createSeededRng(7);
    for (let i = 0; i < 100; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(createSeededRng(1)()).not.toBe(createSeededRng(2)());
  });
});

describe('planSentenceLengths', () => {
  it('adds up exactly and keeps every sentence within 5 to 12 words', () => {
    for (const seed of SEEDS) {
      for (const total of [10, 25, 50, 100, 37, 13]) {
        const lengths = planSentenceLengths(total, createSeededRng(seed));
        expect(lengths.reduce((a, b) => a + b, 0)).toBe(total);
        for (const length of lengths) {
          expect(length).toBeGreaterThanOrEqual(MIN_SENTENCE_WORDS);
          expect(length).toBeLessThanOrEqual(MAX_SENTENCE_WORDS);
        }
      }
    }
  });

  it('makes a single short sentence when the total is under 5', () => {
    expect(planSentenceLengths(3, createSeededRng(1))).toEqual([3]);
  });
});

describe('generatePunctuationWords', () => {
  it('returns exactly the requested number of words', () => {
    for (const seed of SEEDS) {
      for (const count of [10, 25, 50, 100]) {
        expect(generatePunctuationWords(count, options(seed))).toHaveLength(count);
      }
    }
  });

  it('is reproducible for the same seed', () => {
    const a = generatePunctuationWords(50, options(99));
    const b = generatePunctuationWords(50, options(99));
    expect(a).toEqual(b);
  });

  it('ends every sentence, including the last one, so text never stops mid-sentence', () => {
    for (const seed of SEEDS) {
      const tokens = generatePunctuationWords(25, options(seed));
      expect(tokens[tokens.length - 1]).toMatch(/[.?!]$/);
      for (const sentence of sentencesOf(tokens)) {
        expect(sentence[sentence.length - 1]).toMatch(/[.?!]$/);
      }
    }
  });

  it('capitalizes the first word of the text and of every sentence after a closing mark', () => {
    for (const seed of SEEDS) {
      const tokens = generatePunctuationWords(100, options(seed));
      for (const sentence of sentencesOf(tokens)) {
        expect(sentence[0][0]).toMatch(/[A-Z]/);
      }
    }
  });

  it('never starts a sentence with punctuation', () => {
    for (const seed of SEEDS) {
      for (const sentence of sentencesOf(generatePunctuationWords(100, options(seed)))) {
        expect(sentence[0][0]).toMatch(/[A-Za-z]/);
      }
    }
  });

  it('puts a comma in every sentence, never after the first word or right before the end mark', () => {
    for (const seed of SEEDS) {
      for (const sentence of sentencesOf(generatePunctuationWords(100, options(seed)))) {
        const commaAt = sentence.findIndex((t) => t.endsWith(','));
        expect(commaAt).toBeGreaterThanOrEqual(1); // present, and not on the first word
        expect(commaAt).toBeLessThanOrEqual(sentence.length - 2); // not on the last word
        expect(sentence.filter((t) => t.endsWith(',')).length).toBe(1);
      }
    }
  });

  it('has no double spaces, and no stray leading or trailing space', () => {
    for (const seed of SEEDS) {
      const text = generatePunctuationWords(100, options(seed)).join(' ');
      expect(text).not.toMatch(/ {2}/);
      expect(text).toBe(text.trim());
    }
  });

  it('produces only ASCII a US keyboard can type', () => {
    for (const seed of SEEDS) {
      const text = generatePunctuationWords(100, options(seed, { numbers: true })).join(' ');
      expect(text).toMatch(/^[\x20-\x7e]*$/);
    }
  });

  it('never places two punctuation marks back to back', () => {
    for (const seed of SEEDS) {
      const text = generatePunctuationWords(100, options(seed, { numbers: true })).join(' ');
      expect(text).not.toMatch(/[,.?!;:]["']?[,.?!;:]/); // e.g. ",." or ".,"
      expect(text).not.toMatch(/,\s*-/); // a comma right before a dash
      expect(text).not.toMatch(/-\s*,/);
      expect(text).not.toMatch(/-{2,}/);
    }
  });

  it('keeps quotes and dashes off the ends of a sentence', () => {
    for (const seed of SEEDS) {
      for (const sentence of sentencesOf(generatePunctuationWords(200, options(seed)))) {
        const first = sentence[0];
        const last = sentence[sentence.length - 1];
        expect(first).not.toMatch(/^["@-]/);
        expect(last).not.toMatch(/["@]/);
        expect(last).not.toBe('-.');
      }
    }
  });

  it('balances double quotes within a sentence', () => {
    for (const seed of SEEDS) {
      for (const sentence of sentencesOf(generatePunctuationWords(200, options(seed)))) {
        const quotes = sentence.join(' ').split('"').length - 1;
        expect(quotes % 2).toBe(0);
      }
    }
  });

  it('adds a decoration to roughly one sentence in three', () => {
    let sentences = 0;
    let decorated = 0;
    for (let seed = 1; seed <= 60; seed++) {
      for (const sentence of sentencesOf(generatePunctuationWords(100, options(seed)))) {
        sentences++;
        if (/['"@-]/.test(sentence.join(' '))) decorated++;
      }
    }
    const rate = decorated / sentences;
    expect(sentences).toBeGreaterThan(500);
    expect(rate).toBeGreaterThan(DECORATION_RATE - 0.06);
    expect(rate).toBeLessThan(DECORATION_RATE + 0.06);
  });

  it('uses each kind of decoration somewhere', () => {
    const text = Array.from({ length: 60 }, (_, i) =>
      generatePunctuationWords(100, options(i + 1)).join(' '),
    ).join(' ');
    expect(text).toMatch(/\b[a-zA-Z]+'[a-z]+\b/); // apostrophe (contraction or possessive)
    expect(text).toMatch(/"[a-z]+/); // double quotes
    expect(text).toMatch(/[a-z]+-[a-z]+/); // hyphenated word
    expect(text).toMatch(/ - /); // spaced dash
    expect(text).toMatch(/@[a-z]+/); // @handle
    expect(text).toMatch(/[a-z]+@[a-z]+\.(com|net|org|io)/); // made-up address
  });

  it('ends with ? or ! about one time in eight, and otherwise a period', () => {
    let ends = 0;
    let other = 0;
    for (let seed = 1; seed <= 60; seed++) {
      for (const sentence of sentencesOf(generatePunctuationWords(100, options(seed)))) {
        ends++;
        if (/[?!]$/.test(sentence[sentence.length - 1])) other++;
      }
    }
    expect(other / ends).toBeGreaterThan(0.06);
    expect(other / ends).toBeLessThan(0.19);
  });

  it('only swaps in numbers when asked', () => {
    const plain = generatePunctuationWords(100, options(3)).join(' ');
    expect(plain).not.toMatch(/\d/);
    let sawNumber = false;
    for (let seed = 1; seed <= 20; seed++) {
      if (/\d/.test(generatePunctuationWords(100, options(seed, { numbers: true })).join(' '))) {
        sawNumber = true;
      }
    }
    expect(sawNumber).toBe(true);
  });

  it('keeps the first word of a sentence a word even with numbers on', () => {
    for (const seed of SEEDS) {
      const tokens = generatePunctuationWords(100, options(seed, { numbers: true }));
      for (const sentence of sentencesOf(tokens)) {
        expect(sentence[0][0]).toMatch(/[A-Z]/);
      }
    }
  });
});

describe('generatePunctuationBatch (time mode)', () => {
  it('produces at least the requested words and ends on a finished sentence', () => {
    for (const seed of SEEDS) {
      const tokens = generatePunctuationBatch(200, options(seed));
      expect(tokens.length).toBeGreaterThanOrEqual(200);
      expect(tokens.length).toBeLessThan(200 + MAX_SENTENCE_WORDS);
      expect(tokens[tokens.length - 1]).toMatch(/[.?!]$/);
    }
  });

  it('starts a fresh capitalized sentence, so batches can be appended', () => {
    const first = generatePunctuationBatch(40, options(5));
    const second = generatePunctuationBatch(40, options(6));
    const joined = [...first, ...second].join(' ');
    expect(second[0][0]).toMatch(/[A-Z]/);
    expect(joined).not.toMatch(/ {2}/);
    for (const sentence of sentencesOf([...first, ...second])) {
      expect(sentence.some((t) => t.endsWith(','))).toBe(true);
    }
  });
});
