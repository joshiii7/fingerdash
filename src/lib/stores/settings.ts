import { writable } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';
import { CODE_LANGUAGES, type CodeLanguage } from '../../data/code';
import { TEST_MODES, type TestMode } from '../config/modes';
import { QUOTE_LENGTH_OPTIONS, type QuoteLengthFilter } from '../../data/quotes';
import { DEFAULT_CUSTOM_TEXT, normalizeCustomText } from '../text/customText';

export { TEST_MODES, type TestMode };

export const THEMES = [
  { id: 'dark', label: 'GitHub Dark' },
  { id: 'light', label: 'GitHub Light' },
  { id: 'nord', label: 'Nord' },
  { id: 'solarized', label: 'Solarized' },
] as const;

export type ThemeName = (typeof THEMES)[number]['id'];
export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export interface Settings {
  theme: ThemeName;
  mode: TestMode;
  timeDuration: (typeof TIME_OPTIONS)[number];
  wordCount: (typeof WORD_OPTIONS)[number];
  punctuation: boolean;
  numbers: boolean;
  quoteLength: QuoteLengthFilter;
  customText: string;
  codeLanguage: CodeLanguage;
  /** Code mode: jump past a line's leading spaces after Enter. */
  skipIndent: boolean;
  /** Show the key you actually pressed, small, above each wrong character. */
  showMistakes: boolean;
}

const STORAGE_KEY = 'fingerdash:settings';

export const defaultSettings: Settings = {
  theme: 'dark',
  mode: 'words',
  timeDuration: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
  quoteLength: 'all',
  customText: DEFAULT_CUSTOM_TEXT,
  codeLanguage: 'javascript',
  skipIndent: true,
  showMistakes: true,
};

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Fills in anything missing (settings saved by an older version) and replaces
 * any value that is no longer valid, so a stale or hand-edited entry in
 * localStorage can never put the app in an impossible state.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = defaultSettings;
  const customText = typeof r.customText === 'string' ? normalizeCustomText(r.customText).text : '';
  return {
    theme: oneOf(
      r.theme,
      THEMES.map((t) => t.id),
      d.theme,
    ),
    mode: oneOf(
      r.mode,
      TEST_MODES.map((m) => m.id),
      d.mode,
    ),
    timeDuration: oneOf(r.timeDuration, TIME_OPTIONS, d.timeDuration),
    wordCount: oneOf(r.wordCount, WORD_OPTIONS, d.wordCount),
    punctuation: bool(r.punctuation, d.punctuation),
    numbers: bool(r.numbers, d.numbers),
    quoteLength: oneOf(
      r.quoteLength,
      QUOTE_LENGTH_OPTIONS.map((o) => o.id),
      d.quoteLength,
    ),
    customText: customText || d.customText,
    codeLanguage: oneOf(
      r.codeLanguage,
      CODE_LANGUAGES.map((l) => l.id),
      d.codeLanguage,
    ),
    skipIndent: bool(r.skipIndent, d.skipIndent),
    showMistakes: bool(r.showMistakes, d.showMistakes),
  };
}

function createSettingsStore() {
  const initial = sanitizeSettings(readStorage<unknown>(STORAGE_KEY, {}));
  const { subscribe, update, set } = writable<Settings>(initial);

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    set,
    update,
    patch(partial: Partial<Settings>) {
      update((s) => ({ ...s, ...partial }));
    },
    reset() {
      set(defaultSettings);
    },
  };
}

export const settings = createSettingsStore();
