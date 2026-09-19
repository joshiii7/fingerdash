import { describe, it, expect } from 'vitest';
import { lessons, getLessonById } from './index';
import { validateLesson, validateLessons } from './validate';
import { KEY_FINGERS, getKeyGuide, fingersForKeys, keysForFinger } from '../fingerMap';
import type { Lesson } from './types';

function sample(): Lesson {
  return structuredClone(getLessonById('home-row-1')!);
}

describe('lesson data', () => {
  it('has no schema problems in any lesson', () => {
    expect(validateLessons(lessons)).toEqual([]);
  });

  it('gives every lesson an explanation, a summary, and a unique id', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(10);
      expect(lesson.explain.why.length, lesson.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('marks setup and zone lessons as reading and everything else as a drill', () => {
    const reading = lessons.filter((l) => l.kind === 'reading').map((l) => l.id);
    expect(reading).toEqual(['setup-1', 'zones-1', 'zones-2']);
  });

  it('only practices words made of keys the finger map knows', () => {
    for (const lesson of lessons) {
      for (const char of lesson.words.join('')) {
        expect(getKeyGuide(char), `${lesson.id}: ${char}`).not.toBeNull();
      }
    }
  });

  it('keeps early drills to the keys introduced so far', () => {
    const allowed = new Set([...'fjdksla;']);
    for (const id of ['home-row-1', 'home-row-2', 'home-row-3', 'home-row-4', 'home-row-5']) {
      for (const char of getLessonById(id)!.words.join('')) {
        expect(allowed.has(char), id).toBe(true);
      }
    }
  });

  it('only tints fingers that exist on the map', () => {
    const known = new Set(Object.values(KEY_FINGERS));
    for (const lesson of lessons) {
      for (const finger of lesson.explain.fingers ?? []) {
        expect(known.has(finger), `${lesson.id}: ${finger}`).toBe(true);
      }
    }
  });

  it('agrees with the finger map on the zones the index-finger lesson teaches', () => {
    const lesson = getLessonById('zones-1')!;
    expect(lesson.explain.fingers).toEqual(['left-index', 'right-index']);
    const how = lesson.explain.how.join(' ');
    expect(how).toContain('R, T, F, G, V, B and the number keys 4 and 5');
    expect(how).toContain('Y, U, H, J, N, M and the number keys 6 and 7');
    expect(keysForFinger('left-index')).toEqual(['4', '5', 'r', 't', 'f', 'g', 'v', 'b']);
    expect(keysForFinger('right-index')).toEqual(['6', '7', 'y', 'u', 'h', 'j', 'n', 'm']);
  });

  it('agrees with the finger map on the middle, ring, and pinky zones', () => {
    const how = getLessonById('zones-2')!.explain.how.join(' ');
    expect(how).toContain('Left middle: 3, E, D, C');
    expect(how).toContain('Right middle: 8, I, K and the comma');
    expect(how).toContain('Left ring: 2, W, S, X');
    expect(how).toContain('Right ring: 9, O, L and the period');
    expect(how).toContain('Left pinky: 1, Q, A, Z');
    expect(fingersForKeys(['3', 'e', 'd', 'c'])).toEqual(['left-middle']);
    expect(fingersForKeys(['8', 'i', 'k', ','])).toEqual(['right-middle']);
    expect(fingersForKeys(['2', 'w', 's', 'x'])).toEqual(['left-ring']);
    expect(fingersForKeys(['9', 'o', 'l', '.'])).toEqual(['right-ring']);
  });

  it('teaches Shift with the opposite hand, matching the map', () => {
    const text = getLessonById('shift-1')!.explain.how.join(' ');
    expect(text).toContain('left-hand letter, hold Shift with your right pinky');
    expect(getKeyGuide('F')?.shift?.finger).toBe('right-pinky');
    expect(getKeyGuide('J')?.shift?.finger).toBe('left-pinky');
  });

  it('makes the swap-hands drill alternate hands on every letter', () => {
    const hand = (char: string) => getKeyGuide(char)!.fingers[0].split('-')[0];
    for (const word of getLessonById('words-1')!.words) {
      for (let i = 1; i < word.length; i++) {
        expect(hand(word[i]), `${word}[${i}]`).not.toBe(hand(word[i - 1]));
      }
    }
  });

  it('asks for more accuracy in the accuracy lesson than in the early drills', () => {
    expect(getLessonById('accuracy-1')!.minAccuracy).toBeGreaterThan(
      getLessonById('home-row-1')!.minAccuracy,
    );
  });
});

describe('validateLesson', () => {
  it('accepts a complete lesson', () => {
    expect(validateLesson(sample())).toEqual([]);
  });

  it('rejects a lesson with no explain block', () => {
    const lesson = sample() as Partial<Lesson>;
    delete lesson.explain;
    expect(validateLesson(lesson as Lesson).join()).toMatch(/explain block/);
  });

  it('rejects too few or too many why paragraphs and mistakes', () => {
    const lesson = sample();
    lesson.explain.why = ['only one'];
    lesson.explain.mistakes = [{ mistake: 'a', reason: 'b' }];
    const problems = validateLesson(lesson).join();
    expect(problems).toMatch(/why needs 2 to 4/);
    expect(problems).toMatch(/mistakes needs 2 to 4/);
    lesson.explain.why = ['1', '2', '3', '4', '5'];
    expect(validateLesson(lesson).join()).toMatch(/why needs 2 to 4/);
  });

  it('rejects a mistake with no reason, and a missing goal, recap, or summary', () => {
    const lesson = sample();
    lesson.explain.mistakes = [
      { mistake: 'a', reason: '' },
      { mistake: 'b', reason: 'because' },
    ];
    lesson.explain.goal = '';
    lesson.explain.recap = ' ';
    lesson.summary = '';
    const problems = validateLesson(lesson).join();
    expect(problems).toMatch(/both a mistake and a reason/);
    expect(problems).toMatch(/goal is required/);
    expect(problems).toMatch(/recap is required/);
    expect(problems).toMatch(/one-line summary/);
  });

  it('requires words and thresholds for a drill but not for a reading lesson', () => {
    const drill = sample();
    drill.words = [];
    drill.minWpm = 0;
    expect(validateLesson(drill).join()).toMatch(/needs words/);
    const reading = sample();
    Object.assign(reading, { kind: 'reading', words: [], wordCount: 0, minAccuracy: 0, minWpm: 0 });
    expect(validateLesson(reading)).toEqual([]);
  });

  it('flags a target key that is not on the finger map', () => {
    const lesson = sample();
    lesson.targetKeys = ['é'];
    expect(validateLesson(lesson).join()).toMatch(/not on the finger map/);
  });

  it('flags duplicate ids across a list', () => {
    expect(validateLessons([sample(), sample()]).join()).toMatch(/duplicate id/);
  });
});
