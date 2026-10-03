import { settings } from './settings';
import { results } from './results';
import { tutorialProgress } from './tutorialProgress';
import { showHands } from './showHands';
import { introsSeen } from './introsSeen';
import { gunSettings } from './gun';

/** Every localStorage key Fingerdash writes starts with this prefix. */
export const STORAGE_PREFIX = 'fingerdash:';

/** Removes all Fingerdash keys. Other sites' and apps' keys are untouched. */
export function clearFingerdashStorage(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable: nothing was stored, so there is nothing to clear.
  }
}

/**
 * Resets every store to its defaults and wipes the stored keys. The stores
 * rewrite their defaults when reset, so storage is cleared afterwards, leaving
 * localStorage empty until the user changes something again.
 */
export function resetAllData(): void {
  settings.reset();
  results.reset();
  tutorialProgress.reset();
  introsSeen.reset();
  showHands.reset();
  gunSettings.reset();
  clearFingerdashStorage();
}
