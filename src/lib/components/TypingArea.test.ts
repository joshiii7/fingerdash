import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import TypingArea from './TypingArea.svelte';
import { TypingEngine } from '../engine/typingEngine';
import { generateQuoteChallenge, generateCodeChallenge } from '../engine/challenge';

let component: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
  // The caret positions itself on the next frame; jsdom has no layout, so skip that.
  vi.stubGlobal('requestAnimationFrame', () => 0);
});

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
  vi.unstubAllGlobals();
});

function type(engine: TypingEngine, text: string) {
  let t = 0;
  for (const char of text) {
    engine.handleKey(char === '\n' ? 'Enter' : char, (t += 50));
  }
}

function render(engine: TypingEngine, showMistakes: boolean) {
  const snap = engine.getSnapshot();
  component = mount(TypingArea, {
    target,
    props: {
      words: snap.words,
      wordIndex: snap.wordIndex,
      charIndexInWord: snap.charIndexInWord,
      status: snap.status,
      kind: snap.kind,
      showMistakes,
    },
  });
  flushSync();
}

const labels = () => [...target.querySelectorAll('.mistake')];

describe('TypingArea mistake labels', () => {
  it('shows the typed key above the wrong letter, and nowhere else', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but cat'));
    type(engine, 'buy');
    render(engine, true);

    expect(labels().map((l) => l.textContent)).toEqual(['y']);
    // The label sits inside the character it is a mistake for: the "t".
    const wrong = target.querySelector('.char.incorrect')!;
    expect(wrong.querySelector('.mistake')?.textContent).toBe('y');
    expect(wrong.textContent).toBe('yt');
  });

  it('keeps upper and lower case exactly as typed', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    type(engine, 'bUx');
    render(engine, true);
    expect(labels().map((l) => l.textContent)).toEqual(['U', 'x']);
  });

  it('is decoration only: hidden from assistive technology', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    type(engine, 'buy');
    render(engine, true);
    for (const label of labels()) expect(label.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders no labels when the setting is off', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    type(engine, 'buy');
    render(engine, false);
    expect(labels()).toHaveLength(0);
    expect(target.querySelector('.typing-area')!.classList.contains('with-mistakes')).toBe(false);
  });

  it('reserves the extra spacing only while the setting is on', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    render(engine, true);
    expect(target.querySelector('.typing-area')!.classList.contains('with-mistakes')).toBe(true);
  });

  it('gives extra characters their own styling and no label', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    type(engine, 'catxx');
    render(engine, true);
    expect(labels()).toHaveLength(0);
    expect([...target.querySelectorAll('.char.extra')].map((c) => c.textContent)).toEqual([
      'x',
      'x',
    ]);
  });

  it('shows a symbol for a space, and Enter, instead of a blank', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab\ncd', false));
    type(engine, ' \n');
    render(engine, true);
    expect(labels().map((l) => l.textContent)).toEqual(['␣', '↵']);
  });

  it('works on every line of code', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab\ncd', false));
    type(engine, 'ax\ncy');
    render(engine, true);
    expect(labels().map((l) => l.textContent)).toEqual(['x', 'y']);
  });

  it('drops a label again when Backspace removes the mistake', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but cat'));
    type(engine, 'buy');
    engine.handleKey('Backspace', 1000);
    render(engine, true);
    expect(labels()).toHaveLength(0);
  });
});
