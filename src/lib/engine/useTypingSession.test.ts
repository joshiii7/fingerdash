import { describe, it, expect, afterEach, vi } from 'vitest';
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

describe('typing session keystroke reports', () => {
  function startWith(text: string) {
    const onKeystroke = vi.fn();
    session = createTypingSession(generateQuoteChallenge(text), { onKeystroke });
    session.start();
    return onKeystroke;
  }

  it('reports a correct character as a hit and a wrong one as a miss', () => {
    const onKeystroke = startWith('cat dog');
    press('c');
    press('x');
    expect(onKeystroke.mock.calls).toEqual([['hit'], ['miss']]);
  });

  it('reports a space that moves to the next word, and ignores one that does not', () => {
    const onKeystroke = startWith('cat dog');
    press(' '); // nothing typed yet, so the space is ignored
    expect(onKeystroke).not.toHaveBeenCalled();
    type('cat');
    onKeystroke.mockClear();
    press(' ');
    expect(onKeystroke).toHaveBeenCalledWith('hit');
    onKeystroke.mockClear();
    press(' '); // a second space with nothing typed in the new word
    expect(onKeystroke).not.toHaveBeenCalled();
  });

  it('stays quiet for Backspace, Shift, Tab, arrows, F-keys and shortcuts', () => {
    const onKeystroke = startWith('cat dog');
    type('ca');
    onKeystroke.mockClear();
    for (const key of ['Backspace', 'Shift', 'Tab', 'ArrowLeft', 'F5', 'Control', 'Alt']) {
      press(key);
    }
    press('a', { ctrlKey: true });
    expect(onKeystroke).not.toHaveBeenCalled();
  });

  it('does not change typing results when a listener is attached', () => {
    const onKeystroke = startWith('cat dog');
    type('cax');
    const withListener = session!.engine.getSnapshot();
    session?.destroy();
    session = createTypingSession(generateQuoteChallenge('cat dog'));
    session.start();
    type('cax');
    const without = session.engine.getSnapshot();
    expect(onKeystroke).toHaveBeenCalledTimes(3);
    expect(withListener.charIndexInWord).toBe(without.charIndexInWord);
    expect(withListener.wordIndex).toBe(without.wordIndex);
  });
});
