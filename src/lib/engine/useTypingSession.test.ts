import { describe, it, expect, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { createTypingSession, type TypingSession } from './useTypingSession';
import { generateQuoteChallenge } from './challenge';

let session: TypingSession | undefined;

function press(key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  document.dispatchEvent(event);
  return event;
}

function type(text: string) {
  for (const char of text) press(char);
}

afterEach(() => {
  session?.destroy();
  session = undefined;
});

function start(text: string) {
  session = createTypingSession(generateQuoteChallenge(text));
  session.start();
  return session;
}

describe('typing session key handling', () => {
  it('Ctrl+Backspace deletes the whole word being typed', () => {
    const s = start('cat dog fish');
    type('cat do');
    const event = press('Backspace', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    const snap = s.engine.getSnapshot();
    expect(snap.wordIndex).toBe(1);
    expect(snap.charIndexInWord).toBe(0);
    expect(get(s.snapshot)).toBeDefined();
  });

  it('Option/Alt+Backspace does the same, for Mac keyboards', () => {
    const s = start('cat dog fish');
    type('cat do');
    press('Backspace', { altKey: true });
    expect(s.engine.getSnapshot().charIndexInWord).toBe(0);
  });

  it('a plain Backspace still removes a single character', () => {
    const s = start('cat dog fish');
    type('cat do');
    press('Backspace');
    expect(s.engine.getSnapshot().charIndexInWord).toBe(1);
  });

  it('leaves other Ctrl shortcuts to the browser', () => {
    const s = start('cat dog fish');
    type('ca');
    const event = press('a', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(s.engine.getSnapshot().charIndexInWord).toBe(2);
  });

  it('does not treat Cmd+Backspace as a word delete', () => {
    const s = start('cat dog fish');
    type('ca');
    press('Backspace', { metaKey: true });
    expect(s.engine.getSnapshot().charIndexInWord).toBe(2);
  });
});
