import { describe, expect, it } from 'vitest';
import {
  buildSchedule,
  revealedAt,
  loopRevealed,
  MIN_CHAR_MS,
  MAX_CHAR_MS,
  TOTAL_BUDGET_MS,
} from './typewriter';

describe('buildSchedule', () => {
  it('has one time per character across all lines, in increasing order', () => {
    const schedule = buildSchedule([10, 87]);
    expect(schedule).toHaveLength(97);
    for (let i = 1; i < schedule.length; i++) expect(schedule[i]).toBeGreaterThan(schedule[i - 1]);
  });

  it('keeps every gap between 45 and 70 ms when the text is short enough to fit', () => {
    const schedule = buildSchedule([10]);
    let previous = 0;
    for (const time of schedule) {
      const gap = time - previous;
      expect(gap).toBeGreaterThanOrEqual(MIN_CHAR_MS - 1e-9);
      expect(gap).toBeLessThanOrEqual(MAX_CHAR_MS + 1e-9);
      previous = time;
    }
  });

  it('never runs past the total budget, however long the text is', () => {
    const schedule = buildSchedule([10, 87]);
    expect(schedule[schedule.length - 1]).toBeLessThanOrEqual(TOTAL_BUDGET_MS + 1e-9);
  });

  it('varies the gaps instead of using one fixed delay', () => {
    const schedule = buildSchedule([20]);
    const gaps = schedule.map((t, i) => t - (schedule[i - 1] ?? 0));
    expect(new Set(gaps.map((g) => g.toFixed(3))).size).toBeGreaterThan(1);
  });

  it('is repeatable with a seeded random source', () => {
    const fixed = () => 0.5;
    expect(buildSchedule([5], { random: fixed })).toEqual(buildSchedule([5], { random: fixed }));
  });
});

describe('revealedAt', () => {
  it('counts the characters whose time has come', () => {
    const schedule = [50, 100, 150];
    expect(revealedAt(schedule, 0)).toBe(0);
    expect(revealedAt(schedule, 100)).toBe(2);
    expect(revealedAt(schedule, 9999)).toBe(3);
  });
});

describe('loopRevealed', () => {
  const schedule = [100, 200, 300, 400];
  const timing = { holdMs: 1000, eraseMs: 400, pauseMs: 200 };
  // One cycle: 400 typing + 1000 hold + 400 erase + 200 pause = 2000 ms.

  it('types, holds the whole text, deletes it, then waits empty', () => {
    expect(loopRevealed(schedule, 0, timing)).toBe(0);
    expect(loopRevealed(schedule, 250, timing)).toBe(2);
    expect(loopRevealed(schedule, 900, timing)).toBe(4);
    expect(loopRevealed(schedule, 1500, timing)).toBe(3);
    expect(loopRevealed(schedule, 1900, timing)).toBe(0);
  });

  it('deletes down to nothing without ever going backward', () => {
    let previous = 4;
    for (let t = 1400; t < 1800; t += 20) {
      const shown = loopRevealed(schedule, t, timing);
      expect(shown).toBeLessThanOrEqual(previous);
      previous = shown;
    }
  });

  it('starts over after every cycle, forever', () => {
    for (const cycle of [1, 2, 50, 1000]) {
      expect(loopRevealed(schedule, cycle * 2000 + 250, timing)).toBe(2);
    }
  });

  it('shows nothing for an empty schedule', () => {
    expect(loopRevealed([], 500, timing)).toBe(0);
  });
});
