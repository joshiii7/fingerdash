export interface WpmSample {
  timeSeconds: number;
  wpm: number;
  rawWpm: number;
}

export interface Keystroke {
  char: string;
  timestamp: number; // ms, from performance.now()
  correct: boolean;
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  elapsedSeconds: number;
}

export interface CharCounts {
  correct: number;
  incorrect: number;
  extra: number;
}

/**
 * Core WPM formula shared by "live" and "final" calculations:
 * (correct chars / 5) / minutes.
 */
export function computeWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return correctChars / 5 / minutes;
}

export function computeRawWpm(totalChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return totalChars / 5 / minutes;
}

export function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, (correct / total) * 100));
}

/**
 * Consistency: bucket keystrokes into 1-second windows, compute the
 * instantaneous "raw wpm" per window, then express the spread of those
 * samples as 100 - coefficient-of-variation, clamped to [0, 100].
 */
export function computeConsistency(keystrokes: Keystroke[], startTime: number): number {
  if (keystrokes.length < 2) return 100;

  const bucketSize = 1000; // ms
  const buckets = new Map<number, number>();
  for (const stroke of keystrokes) {
    const bucket = Math.floor((stroke.timestamp - startTime) / bucketSize);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  const samples = Array.from(buckets.values()).map((count) => computeRawWpm(count, bucketSize));
  if (samples.length < 2) return 100;

  const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  if (mean === 0) return 100;

  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  return Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));
}

export function calculateStats(
  keystrokes: Keystroke[],
  charCounts: CharCounts,
  startTime: number,
  endTime: number,
): TypingStats {
  const elapsedMs = Math.max(0, endTime - startTime);
  const totalTyped = charCounts.correct + charCounts.incorrect + charCounts.extra;

  return {
    wpm: Math.round(computeWpm(charCounts.correct, elapsedMs) * 10) / 10,
    rawWpm: Math.round(computeRawWpm(totalTyped, elapsedMs) * 10) / 10,
    accuracy: Math.round(computeAccuracy(charCounts.correct, totalTyped) * 10) / 10,
    consistency: Math.round(computeConsistency(keystrokes, startTime) * 10) / 10,
    correctChars: charCounts.correct,
    incorrectChars: charCounts.incorrect,
    extraChars: charCounts.extra,
    elapsedSeconds: Math.round((elapsedMs / 1000) * 10) / 10,
  };
}
