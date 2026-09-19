import { TEST_MODES } from './modes.ts';
import { CODE_LANGUAGES } from '../../data/code/languages.ts';
import { lessons } from '../../data/lessons/index.ts';

export interface StatItem {
  value: number;
  label: string;
}

/**
 * The figures on the About page's "By the numbers" strip. They are counted from the
 * project's own data, so they can't drift, and the build reuses this list to write the
 * same numbers into the static HTML.
 */
export const SITE_STATS: readonly StatItem[] = [
  { value: TEST_MODES.length, label: 'test modes' },
  { value: CODE_LANGUAGES.length, label: 'code languages' },
  { value: lessons.length, label: 'tutorial lessons' },
  { value: 0, label: 'accounts required' },
];
