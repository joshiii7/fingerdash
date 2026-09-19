/**
 * `words`: space-separated words, where Space advances to the next word.
 * `text`: typed one character at a time, newlines included (Enter types "\n"),
 * with no word splitting. Used for code.
 */
export type ChallengeKind = 'words' | 'text';

/**
 * A Challenge is the single content abstraction the typing engine understands.
 * It has no notion of "test" vs "tutorial" — both features generate a Challenge
 * from their own data sources and hand it to the same engine.
 */
export interface Challenge {
  /** Full target text the user must type. */
  text: string;
  /** Character indices (into `text`) where each word (or, for `text`, each line) starts. */
  wordBoundaries: number[];
  /** Defaults to `words`. */
  kind?: ChallengeKind;
  /** `text` only: after Enter, skip past the next line's leading spaces automatically. */
  skipIndent?: boolean;
}

export interface WordChallengeOptions {
  numbers?: boolean;
}

function computeWordBoundaries(words: string[]): number[] {
  const boundaries: number[] = [];
  let index = 0;
  for (const word of words) {
    boundaries.push(index);
    index += word.length + 1; // +1 for the joining space
  }
  return boundaries;
}

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomNumber(): string {
  const n = Math.floor(Math.random() * 10000);
  return String(n);
}

function buildWords(
  sourceWords: string[],
  count: number,
  opts: WordChallengeOptions = {},
): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    let word = pickRandom(sourceWords);
    if (opts.numbers && Math.random() < 0.12) {
      word = randomNumber();
    }
    words.push(word);
  }
  return words;
}

/** Build a challenge from an explicit list of words (already joined by single spaces). */
export function challengeFromWords(words: string[]): Challenge {
  return { text: words.join(' '), wordBoundaries: computeWordBoundaries(words) };
}

/** Generate a challenge with a fixed number of random words. */
export function generateWordChallenge(
  sourceWords: string[],
  count: number,
  opts: WordChallengeOptions = {},
): Challenge {
  return challengeFromWords(buildWords(sourceWords, count, opts));
}

/**
 * Generate a challenge intended for a time-based test. We can't know exactly
 * how many words will be needed, so we generate a generous batch; the engine
 * supports extending text via `extendChallenge` if the user reaches the end
 * before time runs out.
 */
export function generateTimeChallenge(
  sourceWords: string[],
  opts: WordChallengeOptions = {},
  initialWordCount = 200,
): Challenge {
  return generateWordChallenge(sourceWords, initialWordCount, opts);
}

/** Append more random words to an in-progress challenge (used by time mode). */
export function extendChallenge(
  challenge: Challenge,
  sourceWords: string[],
  count: number,
  opts: WordChallengeOptions = {},
): Challenge {
  const words = buildWords(sourceWords, count, opts);
  const additionalText = words.join(' ');
  const separator = challenge.text.length > 0 ? ' ' : '';
  const startIndex = challenge.text.length + separator.length;
  const newBoundaries = computeWordBoundaries(words).map((b) => b + startIndex);
  return {
    text: challenge.text + separator + additionalText,
    wordBoundaries: [...challenge.wordBoundaries, ...newBoundaries],
  };
}

/** Build a challenge from a single quote string. */
export function generateQuoteChallenge(quote: string): Challenge {
  return challengeFromWords(quote.split(' '));
}

export function pickQuote(quotes: string[]): Challenge {
  return generateQuoteChallenge(pickRandom(quotes));
}

/** Build a challenge from a tutorial lesson's practice text pattern. */
export function generateLessonChallenge(practiceText: string): Challenge {
  return challengeFromWords(practiceText.split(' '));
}

/** Build a challenge from multi-line text (code). Newlines are typed with Enter. */
export function generateCodeChallenge(code: string, skipIndent = true): Challenge {
  const lineStarts: number[] = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\n') lineStarts.push(i + 1);
  }
  return { text: code, wordBoundaries: lineStarts, kind: 'text', skipIndent };
}
