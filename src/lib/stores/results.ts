import { writable, get } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';
import type { TestMode } from './settings';
import type { TypingStats } from '../engine/stats';

export interface PersonalBest {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  date: string;
}

export interface ResultsState {
  bests: Record<string, PersonalBest>;
}

const STORAGE_KEY = 'fingerdash:results';

const defaultState: ResultsState = { bests: {} };

/** Personal bests are kept per mode and per option: 30 (seconds), 25 (words), "short" (quote length), "python" (code language). */
export type BestValue = number | string;

export function bestKey(mode: TestMode, value: BestValue): string {
  return `${mode}-${value}`;
}

function createResultsStore() {
  const initial = readStorage<ResultsState>(STORAGE_KEY, defaultState);
  const { subscribe, update, set } = writable<ResultsState>(initial);

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    reset() {
      set(defaultState);
    },
    getBest(mode: TestMode, value: BestValue): PersonalBest | null {
      return get({ subscribe }).bests[bestKey(mode, value)] ?? null;
    },
    /** Records a result; returns true if it beat the previous best WPM. */
    recordResult(mode: TestMode, value: BestValue, stats: TypingStats): boolean {
      const key = bestKey(mode, value);
      let improved = false;
      update((state) => {
        const previous = state.bests[key];
        improved = !previous || stats.wpm > previous.wpm;
        if (!improved) return state;
        return {
          bests: {
            ...state.bests,
            [key]: {
              wpm: stats.wpm,
              rawWpm: stats.rawWpm,
              accuracy: stats.accuracy,
              consistency: stats.consistency,
              date: new Date().toISOString(),
            },
          },
        };
      });
      return improved;
    },
  };
}

export const results = createResultsStore();
