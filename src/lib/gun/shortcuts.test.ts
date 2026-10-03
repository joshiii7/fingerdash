import { describe, it, expect } from 'vitest';
import { isGunToggleShortcut, isVolumeFocusShortcut } from './shortcuts';

type Mods = Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>>;

const key = (k: string, mods: Mods = {}) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe('Gun Mode shortcuts', () => {
  it('toggles on Ctrl+G or Cmd+G, in either case', () => {
    expect(isGunToggleShortcut(key('g', { ctrlKey: true }))).toBe(true);
    expect(isGunToggleShortcut(key('G', { metaKey: true }))).toBe(true);
  });

  it('never fires on a plain G, which is a typing key', () => {
    expect(isGunToggleShortcut(key('g'))).toBe(false);
    expect(isGunToggleShortcut(key('G', { shiftKey: true }))).toBe(false);
  });

  it('ignores Ctrl+Shift+G and Ctrl+Alt+G', () => {
    expect(isGunToggleShortcut(key('g', { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isGunToggleShortcut(key('g', { ctrlKey: true, altKey: true }))).toBe(false);
  });

  it('focuses the volume slider on Ctrl+Shift+V only', () => {
    expect(isVolumeFocusShortcut(key('V', { ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isVolumeFocusShortcut(key('v', { ctrlKey: true }))).toBe(false);
    expect(isVolumeFocusShortcut(key('v'))).toBe(false);
  });
});
