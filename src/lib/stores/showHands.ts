import { writable } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';

const STORAGE_KEY = 'fingerdash:show-hands';

function createShowHandsStore() {
  const initial = readStorage<boolean>(STORAGE_KEY, true);
  const { subscribe, set } = writable<boolean>(initial);

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    set,
    reset() {
      set(true);
    },
  };
}

/** Whether the tutorial's hands diagram is visible. */
export const showHands = createShowHandsStore();
