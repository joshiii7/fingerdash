import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { introsSeen } from './introsSeen';

describe('introsSeen', () => {
  beforeEach(() => {
    introsSeen.reset();
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(get(introsSeen).seen).toEqual([]);
    expect(introsSeen.has('home-row-1')).toBe(false);
  });

  it('remembers a lesson once, however many times it is marked', () => {
    introsSeen.mark('home-row-1');
    introsSeen.mark('home-row-1');
    expect(get(introsSeen).seen).toEqual(['home-row-1']);
    expect(introsSeen.has('home-row-1')).toBe(true);
  });

  it('saves to localStorage under the fingerdash prefix', () => {
    introsSeen.mark('setup-1');
    const raw = localStorage.getItem('fingerdash:tutorial-intros-seen');
    expect(JSON.parse(raw ?? '{}')).toEqual({ seen: ['setup-1'] });
  });

  it('forgets everything on reset', () => {
    introsSeen.mark('setup-1');
    introsSeen.reset();
    expect(introsSeen.has('setup-1')).toBe(false);
  });
});
