import { describe, it, expect } from 'vitest';
import {
  isPaletteShortcut,
  isTextEntryTarget,
  shouldOpenPalette,
  type OpenContext,
} from './openRules';

function ctx(overrides: Partial<OpenContext> = {}): OpenContext {
  return {
    key: '/',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: document.body,
    runStatus: 'none',
    paletteOpen: false,
    ...overrides,
  };
}

function el(html: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  return wrap.firstElementChild as HTMLElement;
}

describe('isTextEntryTarget', () => {
  it('is true for text fields, textareas, selects, and comboboxes', () => {
    expect(isTextEntryTarget(el('<input type="text">'))).toBe(true);
    expect(isTextEntryTarget(el('<input>'))).toBe(true);
    expect(isTextEntryTarget(el('<input type="search">'))).toBe(true);
    expect(isTextEntryTarget(el('<textarea></textarea>'))).toBe(true);
    expect(isTextEntryTarget(el('<select><option>a</option></select>'))).toBe(true);
    expect(isTextEntryTarget(el('<div role="combobox"></div>'))).toBe(true);
    expect(isTextEntryTarget(el('<div role="textbox"></div>'))).toBe(true);
  });

  it('is false for buttons, links, checkboxes, and the page itself', () => {
    expect(isTextEntryTarget(el('<button>x</button>'))).toBe(false);
    expect(isTextEntryTarget(el('<a href="#">x</a>'))).toBe(false);
    expect(isTextEntryTarget(el('<input type="checkbox">'))).toBe(false);
    expect(isTextEntryTarget(document.body)).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });
});

describe('isPaletteShortcut', () => {
  it('accepts Ctrl+K and Cmd+K in either case', () => {
    expect(isPaletteShortcut(ctx({ key: 'k', ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(ctx({ key: 'K', ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(ctx({ key: 'k', metaKey: true }))).toBe(true);
  });

  it('rejects K without Ctrl/Cmd, or with extra modifiers', () => {
    expect(isPaletteShortcut(ctx({ key: 'k' }))).toBe(false);
    expect(isPaletteShortcut(ctx({ key: 'k', ctrlKey: true, altKey: true }))).toBe(false);
    expect(isPaletteShortcut(ctx({ key: 'k', ctrlKey: true, shiftKey: true }))).toBe(false);
  });
});

describe('shouldOpenPalette: Ctrl/Cmd+K', () => {
  const k = { key: 'k', ctrlKey: true };

  it('opens from anywhere', () => {
    expect(shouldOpenPalette(ctx(k))).toBe(true);
    expect(shouldOpenPalette(ctx({ key: 'k', metaKey: true }))).toBe(true);
  });

  it('opens during a run so the caller can pause it', () => {
    expect(shouldOpenPalette(ctx({ ...k, runStatus: 'running' }))).toBe(true);
    expect(shouldOpenPalette(ctx({ ...k, runStatus: 'idle' }))).toBe(true);
  });

  it('opens while a text field has focus', () => {
    expect(shouldOpenPalette(ctx({ ...k, target: el('<input type="text">') }))).toBe(true);
  });

  it('does nothing while the palette is already open', () => {
    expect(shouldOpenPalette(ctx({ ...k, paletteOpen: true }))).toBe(false);
  });

  it('does nothing when another handler already claimed the event', () => {
    expect(shouldOpenPalette(ctx({ ...k, defaultPrevented: true }))).toBe(false);
  });
});

describe('shouldOpenPalette: "/"', () => {
  it('opens on pages with no typing session', () => {
    expect(shouldOpenPalette(ctx({ runStatus: 'none' }))).toBe(true);
  });

  it('opens once a run has finished (results screen)', () => {
    expect(shouldOpenPalette(ctx({ runStatus: 'finished' }))).toBe(true);
  });

  it('does not open while a run is in progress, since "/" is a typeable character', () => {
    expect(shouldOpenPalette(ctx({ runStatus: 'running' }))).toBe(false);
  });

  it('does not open before the first keystroke either, since "/" may be the first character', () => {
    expect(shouldOpenPalette(ctx({ runStatus: 'idle' }))).toBe(false);
  });

  it('does not open while a text input is focused', () => {
    expect(shouldOpenPalette(ctx({ target: el('<input type="text">') }))).toBe(false);
    expect(shouldOpenPalette(ctx({ target: el('<textarea></textarea>') }))).toBe(false);
  });

  it('still opens when a non-text control such as a button has focus', () => {
    expect(shouldOpenPalette(ctx({ target: el('<button>x</button>') }))).toBe(true);
    expect(shouldOpenPalette(ctx({ target: el('<input type="checkbox">') }))).toBe(true);
  });

  it('ignores "/" combined with Ctrl, Cmd, or Alt', () => {
    expect(shouldOpenPalette(ctx({ ctrlKey: true }))).toBe(false);
    expect(shouldOpenPalette(ctx({ metaKey: true }))).toBe(false);
    expect(shouldOpenPalette(ctx({ altKey: true }))).toBe(false);
  });

  it('ignores "/" during IME composition and while the palette is open', () => {
    expect(shouldOpenPalette(ctx({ isComposing: true }))).toBe(false);
    expect(shouldOpenPalette(ctx({ paletteOpen: true }))).toBe(false);
  });

  it('ignores other keys', () => {
    expect(shouldOpenPalette(ctx({ key: 'a' }))).toBe(false);
    expect(shouldOpenPalette(ctx({ key: 'k' }))).toBe(false);
  });
});
