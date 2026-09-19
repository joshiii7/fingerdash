import raw from './quotes.json';
import { pickAvoidingRepeat } from '../../lib/engine/pick';

export type QuoteLength = 'short' | 'medium' | 'long';
export type QuoteLengthFilter = QuoteLength | 'all';

export interface Quote {
  id: string;
  text: string;
  /** Author and work, or "Proverb" / "Fingerdash". */
  source: string;
  length: QuoteLength;
}

/** Character thresholds behind the `length` groups in quotes.json. */
export const QUOTE_SHORT_MAX = 99;
export const QUOTE_MEDIUM_MAX = 229;

export const QUOTE_LENGTH_OPTIONS: { id: QuoteLengthFilter; label: string }[] = [
  { id: 'all', label: 'All lengths' },
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
];

export const QUOTES: readonly Quote[] = raw as Quote[];

export function quotesFor(filter: QuoteLengthFilter): readonly Quote[] {
  return filter === 'all' ? QUOTES : QUOTES.filter((q) => q.length === filter);
}

/** A random quote in the chosen length group, never the same one twice in a row. */
export function pickQuote(
  filter: QuoteLengthFilter,
  previousId: string | null,
  rng: () => number = Math.random,
): Quote {
  return pickAvoidingRepeat(quotesFor(filter), previousId, rng);
}
