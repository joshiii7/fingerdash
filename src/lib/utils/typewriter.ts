/** Slowest and fastest time between two characters, in milliseconds. */
export const MIN_CHAR_MS = 45;
export const MAX_CHAR_MS = 70;

/** The whole animation should take about this long or less. */
export const TOTAL_BUDGET_MS = 3000;

export interface ScheduleOptions {
  minMs?: number;
  maxMs?: number;
  budgetMs?: number;
  random?: () => number;
}

/**
 * When each character appears, in milliseconds from the start, across all lines in order.
 * Each gap is random between `minMs` and `maxMs`. If the natural total would run past
 * `budgetMs`, every gap is scaled down together so it fits: the rhythm stays uneven, just faster.
 */
export function buildSchedule(lengths: number[], options: ScheduleOptions = {}): number[] {
  const {
    minMs = MIN_CHAR_MS,
    maxMs = MAX_CHAR_MS,
    budgetMs = TOTAL_BUDGET_MS,
    random = Math.random,
  } = options;

  const count = lengths.reduce((sum, n) => sum + n, 0);
  const gaps = Array.from({ length: count }, () => minMs + random() * (maxMs - minMs));
  const natural = gaps.reduce((sum, gap) => sum + gap, 0);
  const scale = natural > budgetMs ? budgetMs / natural : 1;

  let elapsed = 0;
  return gaps.map((gap) => (elapsed += gap * scale));
}

/** How many characters of the schedule are showing after `elapsedMs`. */
export function revealedAt(schedule: number[], elapsedMs: number): number {
  let shown = 0;
  while (shown < schedule.length && schedule[shown] <= elapsedMs) shown++;
  return shown;
}

/** How long each stage of the loop lasts once the text is typed. */
export interface LoopTiming {
  /** The finished text stays on screen for this long. */
  holdMs: number;
  /** Then it is deleted, evenly, over this long. */
  eraseMs: number;
  /** A short empty pause before it types again. */
  pauseMs: number;
}

export const LOOP_TIMING: LoopTiming = { holdMs: 2400, eraseMs: 900, pauseMs: 450 };

/**
 * How many characters are showing at `elapsedMs` when the text types, holds, deletes and
 * types again, forever. `schedule` is the typing schedule from buildSchedule.
 */
export function loopRevealed(
  schedule: number[],
  elapsedMs: number,
  timing: LoopTiming = LOOP_TIMING,
): number {
  const total = schedule.length;
  if (total === 0) return 0;
  const typeMs = schedule[total - 1];
  const cycle = typeMs + timing.holdMs + timing.eraseMs + timing.pauseMs;
  const t = ((elapsedMs % cycle) + cycle) % cycle;

  if (t < typeMs) return revealedAt(schedule, t);
  if (t < typeMs + timing.holdMs) return total;
  const erasing = t - typeMs - timing.holdMs;
  if (erasing < timing.eraseMs) return Math.ceil(total * (1 - erasing / timing.eraseMs));
  return 0;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
