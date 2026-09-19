import { writable, get } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';

export interface IntrosSeenState {
  /** Ids of lessons whose intro the learner has read or skipped. */
  seen: string[];
}

const STORAGE_KEY = 'fingerdash:tutorial-intros-seen';
const defaultState: IntrosSeenState = { seen: [] };

function readInitial(): IntrosSeenState {
  const stored = readStorage<IntrosSeenState>(STORAGE_KEY, defaultState);
  // Anything unexpected in storage is treated as "nothing seen yet".
  return Array.isArray(stored?.seen)
    ? { seen: stored.seen.filter((id) => typeof id === 'string') }
    : { seen: [] };
}

function createIntrosSeenStore() {
  const { subscribe, update, set } = writable<IntrosSeenState>(readInitial());

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    reset() {
      set({ seen: [] });
    },
    has(lessonId: string): boolean {
      return get({ subscribe }).seen.includes(lessonId);
    },
    /** Remembers that this lesson's intro was read or skipped, so it doesn't open by itself again. */
    mark(lessonId: string): void {
      update((state) =>
        state.seen.includes(lessonId) ? state : { seen: [...state.seen, lessonId] },
      );
    },
  };
}

export const introsSeen = createIntrosSeenStore();
