import { getKeyGuide } from '../fingerMap.ts';
import type { Lesson } from './types.ts';

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Checks one lesson against the schema and returns what is wrong, or an empty list.
 * Lessons are data, so adding one should never need a code change; this catches a
 * malformed one before it reaches a learner.
 */
export function validateLesson(lesson: Lesson): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(`${lesson.id || '(no id)'}: ${message}`);

  if (!isText(lesson.id)) say('needs an id');
  if (!isText(lesson.title)) say('needs a title');
  if (!isText(lesson.summary)) say('needs a one-line summary');
  else if (lesson.summary.includes('\n')) say('summary must be one line');

  const drill = (lesson.kind ?? 'drill') === 'drill';
  if (drill) {
    if (!lesson.words?.length) say('a drill needs words');
    if (!(lesson.wordCount > 0)) say('a drill needs a word count above 0');
    if (!(lesson.minAccuracy > 0 && lesson.minAccuracy <= 100)) say('minAccuracy must be 1-100');
    if (!(lesson.minWpm > 0)) say('minWpm must be above 0');
    if (!lesson.targetKeys?.length) say('a drill needs target keys');
  }

  const explain = lesson.explain;
  if (!explain) {
    say('needs an explain block');
    return problems;
  }
  if (!isText(explain.goal)) say('explain.goal is required');
  else if (/\n/.test(explain.goal)) say('explain.goal is one sentence');
  if (!Array.isArray(explain.why) || explain.why.length < 2 || explain.why.length > 4) {
    say('explain.why needs 2 to 4 paragraphs');
  } else if (!explain.why.every(isText)) say('explain.why has an empty paragraph');
  if (!Array.isArray(explain.how) || explain.how.length < 1 || !explain.how.every(isText)) {
    say('explain.how needs at least one instruction');
  }
  if (
    !Array.isArray(explain.mistakes) ||
    explain.mistakes.length < 2 ||
    explain.mistakes.length > 4
  ) {
    say('explain.mistakes needs 2 to 4 entries');
  } else if (!explain.mistakes.every((m) => isText(m?.mistake) && isText(m?.reason))) {
    say('every mistake needs both a mistake and a reason');
  }
  if (!isText(explain.recap)) say('explain.recap is required');

  for (const key of lesson.targetKeys ?? []) {
    if (!getKeyGuide(key)) say(`target key "${key}" is not on the finger map`);
  }
  return problems;
}

/** Validates every lesson plus the list as a whole (unique ids). */
export function validateLessons(lessons: Lesson[]): string[] {
  const problems = lessons.flatMap(validateLesson);
  const seen = new Set<string>();
  for (const lesson of lessons) {
    if (seen.has(lesson.id)) problems.push(`${lesson.id}: duplicate id`);
    seen.add(lesson.id);
  }
  return problems;
}
