import { afterEach, describe, expect, it } from 'vitest';
import { lockScroll, unlockScroll } from './scrollLock';

const locked = () => document.documentElement.classList.contains('scroll-locked');

describe('scroll lock', () => {
  afterEach(() => {
    // Leave no lock behind, whatever a test did.
    for (let i = 0; i < 5; i++) unlockScroll();
    document.documentElement.classList.remove('scroll-locked');
  });

  it('locks while a modal is open and releases when it closes', () => {
    lockScroll();
    expect(locked()).toBe(true);
    unlockScroll();
    expect(locked()).toBe(false);
  });

  it('stays locked until the last of several modals closes', () => {
    lockScroll();
    lockScroll();
    unlockScroll();
    expect(locked()).toBe(true);
    unlockScroll();
    expect(locked()).toBe(false);
  });

  it('ignores an unlock with nothing locked, so it cannot go negative', () => {
    unlockScroll();
    unlockScroll();
    lockScroll();
    expect(locked()).toBe(true);
    unlockScroll();
    expect(locked()).toBe(false);
  });
});
