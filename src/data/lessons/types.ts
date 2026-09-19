import type { FingerId } from '../fingerMap';

export type LessonGroup =
  'basics' | 'home-row' | 'top-row' | 'bottom-row' | 'numbers' | 'punctuation' | 'practice';

/** The "why" behind a lesson, shown as an intro before the drill and again from "Why?". */
export interface LessonExplain {
  /** One sentence on what you'll learn. */
  goal: string;
  /** Two to four short paragraphs on why this matters or why it works this way. */
  why: string[];
  /** Concrete instructions: which finger, which keys, hand position. */
  how: string[];
  /** Two to four common mistakes, each with the reason it's a problem. */
  mistakes: { mistake: string; reason: string }[];
  /** One or two sentences to take away. */
  recap: string;
  /**
   * Fingers whose zones are tinted on the keyboard and hands. When left out, they are worked
   * out from the lesson's keys, so a normal drill never needs to list them.
   */
  fingers?: FingerId[];
}

export interface Lesson {
  id: string;
  group: LessonGroup;
  title: string;
  /** One line for the lesson list: what you'll learn and why. */
  summary: string;
  /** `reading` lessons are explanation only, with no typing drill. Defaults to `drill`. */
  kind?: 'drill' | 'reading';
  /** Keys this lesson drills. Used to drive the on-screen keyboard highlight. */
  targetKeys: string[];
  /** Word bank the practice text is drawn from — keeps practice text limited
   * to keys already introduced. */
  words: string[];
  /** How many words to generate for a practice run. */
  wordCount: number;
  minAccuracy: number;
  minWpm: number;
  explain: LessonExplain;
}
