import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { resetAllData, clearFingerdashStorage } from './resetAll';
import { settings } from './settings';
import { showHands } from './showHands';
import { introsSeen } from './introsSeen';

describe('clearing data', () => {
  beforeEach(() => localStorage.clear());

  it('removes only keys that start with the fingerdash: prefix', () => {
    localStorage.setItem('fingerdash:settings', '{}');
    localStorage.setItem('fingerdash:results', '{}');
    localStorage.setItem('other-app:thing', 'keep');
    clearFingerdashStorage();
    expect(localStorage.getItem('fingerdash:settings')).toBeNull();
    expect(localStorage.getItem('fingerdash:results')).toBeNull();
    expect(localStorage.getItem('other-app:thing')).toBe('keep');
  });

  it('resets stores to defaults and leaves no Fingerdash keys behind', () => {
    settings.patch({ theme: 'nord', punctuation: true });
    showHands.set(false);
    introsSeen.mark('setup-1');
    expect(localStorage.getItem('fingerdash:settings')).not.toBeNull();

    resetAllData();

    expect(get(settings).theme).toBe('dark');
    expect(get(settings).punctuation).toBe(false);
    expect(get(showHands)).toBe(true);
    expect(introsSeen.has('setup-1')).toBe(false);
    for (let i = 0; i < localStorage.length; i++) {
      expect(localStorage.key(i)?.startsWith('fingerdash:')).toBe(false);
    }
  });
});
