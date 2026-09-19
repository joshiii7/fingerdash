/** Longest custom text, in characters, after normalization. */
export const CUSTOM_TEXT_MAX = 5000;

/** A short pangram-based paragraph of about 30 words. */
export const DEFAULT_CUSTOM_TEXT =
  'a quick brown fox jumps over the lazy dog. the fox is quick, the dog is lazy, and the sun is warm. a quick brown fox jumps over the lazy dog again.';

export interface NormalizeResult {
  /** Text ready to type: printable ASCII, single spaces, trimmed, at most CUSTOM_TEXT_MAX long. */
  text: string;
  /** Plain-language notes on anything that was changed or removed. Empty when nothing was. */
  notes: string[];
  truncated: boolean;
}

const SINGLE_QUOTES = new RegExp('[\\u2018\\u2019\\u201a\\u201b\\u2032]', 'g');
const DOUBLE_QUOTES = new RegExp('[\\u201c\\u201d\\u201e\\u201f\\u2033]', 'g');
const LONG_DASHES = new RegExp('[\\u2010-\\u2015\\u2212]', 'g');
const ELLIPSIS = new RegExp('\\u2026', 'g');
// Non-breaking and other Unicode spaces become ordinary spaces (they collapse silently).
const ODD_SPACES = new RegExp('[\\u00a0\\u1680\\u2000-\\u200a\\u202f\\u205f\\u3000]', 'g');
const NOT_TYPEABLE = /[^\x20-\x7e]/gu;

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Turns pasted or typed text into something typeable on a US keyboard: curly
 * quotes, long dashes, and ellipses become their plain ASCII forms, whitespace
 * and newlines collapse to single spaces, anything else that can't be typed is
 * removed, and the result is trimmed and capped at CUSTOM_TEXT_MAX characters.
 */
export function normalizeCustomText(input: string): NormalizeResult {
  const notes: string[] = [];
  let text = input;

  const singles = count(text, SINGLE_QUOTES);
  const doubles = count(text, DOUBLE_QUOTES);
  if (singles + doubles > 0) {
    notes.push(
      `Replaced ${plural(singles + doubles, 'curly quote', 'curly quotes')} with plain quotes.`,
    );
  }
  const dashes = count(text, LONG_DASHES);
  if (dashes > 0) {
    notes.push(`Replaced ${plural(dashes, 'long dash', 'long dashes')} with a hyphen.`);
  }
  const ellipses = count(text, ELLIPSIS);
  if (ellipses > 0) {
    notes.push(`Replaced ${plural(ellipses, 'ellipsis', 'ellipses')} with three periods.`);
  }
  text = text
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(LONG_DASHES, '-')
    .replace(ELLIPSIS, '...')
    .replace(ODD_SPACES, ' ');

  const trimmed = text.trim();
  if (/[\r\n\t]|\s{2,}/.test(trimmed)) {
    notes.push('Combined line breaks and repeated spaces into single spaces.');
  }
  text = collapseWhitespace(text);

  const removed = text.match(NOT_TYPEABLE) ?? [];
  if (removed.length > 0) {
    const distinct = [...new Set(removed)];
    const shown = distinct.slice(0, 5).join(' ');
    const more = distinct.length > 5 ? ', and others' : '';
    notes.push(
      `Removed ${plural(removed.length, 'character', 'characters')} that can't be typed on a US keyboard (${shown}${more}).`,
    );
    text = collapseWhitespace(text.replace(NOT_TYPEABLE, ''));
  }

  let truncated = false;
  if (text.length > CUSTOM_TEXT_MAX) {
    text = text.slice(0, CUSTOM_TEXT_MAX).trimEnd();
    truncated = true;
    notes.push(`Trimmed to the ${CUSTOM_TEXT_MAX.toLocaleString('en-US')} character limit.`);
  }

  return { text, notes, truncated };
}

export interface TextCounts {
  characters: number;
  words: number;
}

/** Counts for already-normalized text (single spaces, so words are space-separated). */
export function countText(normalized: string): TextCounts {
  return {
    characters: normalized.length,
    words: normalized.length === 0 ? 0 : normalized.split(' ').length,
  };
}

/** Returns an error message, or null when the text can be saved. */
export function validateCustomText(normalized: string): string | null {
  return normalized.length === 0 ? 'Enter some text to type before saving.' : null;
}
