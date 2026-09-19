/**
 * Sentence-shaped random text for punctuation mode. Pure functions with an
 * injectable random number generator, so output is reproducible in tests.
 *
 * Words stay random (the text is nonsense) but is shaped like sentences: a
 * capital first word, a comma somewhere in the middle, and a closing mark. About
 * one sentence in three also carries one decoration (apostrophe, quotes, hyphen,
 * spaced dash, or an @ handle/address). Everything is ASCII and typeable on a US
 * keyboard, and every token is separated by exactly one space.
 */

/** Returns a float in [0, 1), like Math.random. */
export type Rng = () => number;

/** Small, fast, deterministic PRNG (mulberry32). */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PunctuationOptions {
  /** Source words (lowercase). */
  words: string[];
  /** Contractions such as "don't"; used for the apostrophe decoration. */
  contractions: string[];
  /** Occasionally swap a plain word for a number. */
  numbers?: boolean;
  rng?: Rng;
}

export const MIN_SENTENCE_WORDS = 5;
export const MAX_SENTENCE_WORDS = 12;
/** Chance that a sentence carries one decoration. */
export const DECORATION_RATE = 1 / 3;
/** Chance that a sentence ends with "?" or "!" instead of ".". */
export const NON_PERIOD_RATE = 1 / 8;
const NUMBER_RATE = 0.12;
const TLDS = ['com', 'net', 'org', 'io'];

type TokenKind = 'plain' | 'quote' | 'dash' | 'at';
interface Token {
  text: string;
  /** `plain` tokens may take a comma; the others are decorated and must not. */
  kind: TokenKind;
}

type Decoration = 'apostrophe' | 'quote' | 'hyphen' | 'dash' | 'at';
const DECORATIONS: Decoration[] = ['apostrophe', 'quote', 'hyphen', 'dash', 'at'];

function pick<T>(list: readonly T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)];
}

/** Integer in [min, max]. */
function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Splits `total` words into sentence lengths of 5 to 12 that add up exactly.
 * Each split leaves at least 5 words for the rest, so the last sentence is
 * never too short. A total under 5 becomes a single short sentence.
 */
export function planSentenceLengths(total: number, rng: Rng = Math.random): number[] {
  const lengths: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    if (remaining <= MAX_SENTENCE_WORDS) {
      lengths.push(remaining);
      break;
    }
    const most = Math.min(MAX_SENTENCE_WORDS, remaining - MIN_SENTENCE_WORDS);
    const length = randInt(MIN_SENTENCE_WORDS, most, rng);
    lengths.push(length);
    remaining -= length;
  }
  return lengths;
}

/** Applies at most one decoration by replacing tokens in place (the token count never changes). */
function decorate(tokens: Token[], kind: Decoration, opts: PunctuationOptions, rng: Rng): void {
  const last = tokens.length - 1;
  const word = () => pick(opts.words, rng);

  switch (kind) {
    case 'apostrophe': {
      const i = randInt(0, last, rng);
      const text = rng() < 0.5 ? pick(opts.contractions, rng) : `${word()}'s`;
      tokens[i] = { text, kind: 'plain' };
      break;
    }
    case 'hyphen': {
      const i = randInt(0, last, rng);
      tokens[i] = { text: `${word()}-${word()}`, kind: 'plain' };
      break;
    }
    case 'quote': {
      // Keep the first and last tokens plain: the sentence starts with a letter and ends with a word.
      const i = randInt(1, last - 1, rng);
      if (i + 1 <= last - 1 && rng() < 0.5) {
        tokens[i] = { text: `"${tokens[i].text}`, kind: 'quote' };
        tokens[i + 1] = { text: `${tokens[i + 1].text}"`, kind: 'quote' };
      } else {
        tokens[i] = { text: `"${tokens[i].text}"`, kind: 'quote' };
      }
      break;
    }
    case 'dash': {
      // A spaced dash between two words, so never the first or last slot.
      const i = randInt(1, last - 1, rng);
      tokens[i] = { text: '-', kind: 'dash' };
      break;
    }
    case 'at': {
      const i = randInt(1, last - 1, rng);
      const text = rng() < 0.5 ? `@${word()}` : `${word()}@${word()}.${pick(TLDS, rng)}`;
      tokens[i] = { text, kind: 'at' };
      break;
    }
  }
}

/** Indices where a comma reads naturally: mid-sentence, on a plain word, not next to a dash. */
function commaCandidates(tokens: Token[]): number[] {
  const candidates: number[] = [];
  for (let i = 1; i <= tokens.length - 2; i++) {
    if (tokens[i].kind !== 'plain') continue;
    if (tokens[i + 1]?.kind === 'dash') continue;
    candidates.push(i);
  }
  return candidates;
}

function buildSentenceTokens(length: number, opts: PunctuationOptions, rng: Rng): string[] {
  const decorationKind = rng() < DECORATION_RATE ? pick(DECORATIONS, rng) : null;
  const shortSentence = length < MIN_SENTENCE_WORDS;

  for (let attempt = 0; attempt < 2; attempt++) {
    const useDecoration = attempt === 0 && decorationKind !== null && !shortSentence;
    const tokens: Token[] = Array.from({ length }, () => ({
      text: pick(opts.words, rng),
      kind: 'plain' as const,
    }));

    if (useDecoration) decorate(tokens, decorationKind, opts, rng);

    if (opts.numbers) {
      for (let i = 1; i < tokens.length; i++) {
        if (tokens[i].kind === 'plain' && rng() < NUMBER_RATE) {
          tokens[i] = { text: String(randInt(1, 9999, rng)), kind: 'plain' };
        }
      }
    }

    // Sentences shorter than 3 words have no middle for a comma.
    const candidates = commaCandidates(tokens);
    if (candidates.length === 0 && length >= 3) continue; // retry without the decoration
    const commaAt = candidates.length > 0 ? pick(candidates, rng) : -1;

    const out = tokens.map((t) => t.text);
    out[0] = capitalize(out[0]);
    if (commaAt >= 0) out[commaAt] += ',';
    const mark = rng() < NON_PERIOD_RATE ? (rng() < 0.5 ? '?' : '!') : '.';
    out[out.length - 1] += mark;
    return out;
  }

  // Unreachable for lengths of 5 or more; a defensive plain sentence for tiny inputs.
  const plain = Array.from({ length }, () => pick(opts.words, rng));
  plain[0] = capitalize(plain[0]);
  plain[plain.length - 1] += '.';
  return plain;
}

/**
 * Exactly `count` tokens made of complete sentences (the last one included).
 * Tokens are space-separated words, so `count` matches the word count the
 * typing engine sees.
 */
export function generatePunctuationWords(count: number, opts: PunctuationOptions): string[] {
  const rng = opts.rng ?? Math.random;
  return planSentenceLengths(count, rng).flatMap((length) =>
    buildSentenceTokens(length, opts, rng),
  );
}

/**
 * At least `minWords` tokens, always ending on a finished sentence. Used for
 * time mode, where the test keeps asking for more text as needed.
 */
export function generatePunctuationBatch(minWords: number, opts: PunctuationOptions): string[] {
  const rng = opts.rng ?? Math.random;
  const tokens: string[] = [];
  while (tokens.length < minWords) {
    const length = randInt(MIN_SENTENCE_WORDS, MAX_SENTENCE_WORDS, rng);
    tokens.push(...buildSentenceTokens(length, opts, rng));
  }
  return tokens;
}
