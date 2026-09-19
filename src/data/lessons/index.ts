import basics from './basics.json';
import homeRow from './home-row.json';
import zones from './zones.json';
import topRow from './top-row.json';
import bottomRow from './bottom-row.json';
import numbers from './numbers.json';
import shift from './shift.json';
import punctuation from './punctuation.json';
import practice from './practice.json';
import type { Lesson } from './types';

export type { Lesson, LessonGroup, LessonExplain } from './types';

/**
 * Progression order: setup, home row, finger zones, top row, bottom row, numbers, Shift,
 * punctuation, then mixed practice. Adding a lesson is a JSON change only.
 */
export const lessons: Lesson[] = [
  ...(basics as Lesson[]),
  ...(homeRow as Lesson[]),
  ...(zones as Lesson[]),
  ...(topRow as Lesson[]),
  ...(bottomRow as Lesson[]),
  ...(numbers as Lesson[]),
  ...(shift as Lesson[]),
  ...(punctuation as Lesson[]),
  ...(practice as Lesson[]),
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getLessonIndex(id: string): number {
  return lessons.findIndex((l) => l.id === id);
}
