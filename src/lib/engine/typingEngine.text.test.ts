import { describe, it, expect } from 'vitest';
import { TypingEngine } from './typingEngine';
import { generateCodeChallenge } from './challenge';

/** Feeds keys the way the session does: Enter arrives as the key name "Enter". */
function type(engine: TypingEngine, text: string, start = 0, step = 100): number {
  let t = start;
  for (const ch of text) {
    engine.handleKey(ch === '\n' ? 'Enter' : ch, t);
    t += step;
  }
  return t;
}

const CODE = 'if (x) {\n    run();\n}';

describe('generateCodeChallenge', () => {
  it('marks the challenge as text and records where each line starts', () => {
    const c = generateCodeChallenge(CODE);
    expect(c.kind).toBe('text');
    expect(c.wordBoundaries).toEqual([0, 9, 20]);
    expect(c.skipIndent).toBe(true);
  });

  it('can turn indentation skipping off', () => {
    expect(generateCodeChallenge(CODE, false).skipIndent).toBe(false);
  });
});

describe('text kind: Enter and characters', () => {
  it('treats Enter as a newline character', () => {
    const engine = new TypingEngine(generateCodeChallenge('a\nb', false));
    type(engine, 'a\nb');
    expect(engine.isFinished()).toBe(true);
    expect(engine.getFinalStats().correctChars).toBe(3);
    expect(engine.getFinalStats().incorrectChars).toBe(0);
  });

  it('consumes Enter so the caller prevents its default action', () => {
    const engine = new TypingEngine(generateCodeChallenge('a\nb', false));
    engine.handleKey('a', 0);
    expect(engine.handleKey('Enter', 10)).toBe(true);
  });

  it('marks Enter as incorrect when a normal character was expected', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    engine.handleKey('Enter', 0);
    const snap = engine.getSnapshot();
    expect(snap.words[0].chars[0].state).toBe('incorrect');
    expect(snap.charIndexInWord).toBe(1);
  });

  it('marks a wrong key as incorrect where a newline was expected, and still advances', () => {
    const engine = new TypingEngine(generateCodeChallenge('a\nb', false));
    type(engine, 'ax');
    const snap = engine.getSnapshot();
    expect(snap.words[0].chars[1]).toEqual({ char: '\n', state: 'incorrect', typed: 'x' });
    expect(snap.wordIndex).toBe(1);
    expect(snap.charIndexInWord).toBe(0);
  });

  it('does not split on spaces: Space is an ordinary character', () => {
    const engine = new TypingEngine(generateCodeChallenge('a b', false));
    type(engine, 'a b');
    expect(engine.isFinished()).toBe(true);
    expect(engine.getFinalStats().correctChars).toBe(3);
  });

  it('ignores keys that are not characters (Tab, Escape, Shift)', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    expect(engine.handleKey('Tab', 0)).toBe(false);
    expect(engine.handleKey('Escape', 1)).toBe(false);
    expect(engine.handleKey('Shift', 2)).toBe(false);
    expect(engine.getStatus()).toBe('idle');
  });

  it('accepts every symbol used in code, including ones that need Shift', () => {
    const symbols = '{}[]()<>;:"\'`$#&|\\/';
    const engine = new TypingEngine(generateCodeChallenge(symbols, false));
    type(engine, symbols);
    expect(engine.isFinished()).toBe(true);
    expect(engine.getFinalStats().correctChars).toBe(symbols.length);
    expect(engine.getFinalStats().incorrectChars).toBe(0);
  });

  it('ignores input once the snippet is complete', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    type(engine, 'ab');
    expect(engine.handleKey('c', 500)).toBe(false);
  });

  it('does nothing for an empty snippet', () => {
    const engine = new TypingEngine(generateCodeChallenge('', false));
    expect(engine.handleKey('a', 0)).toBe(false);
    expect(engine.getStatus()).toBe('idle');
  });
});

describe('text kind: indentation', () => {
  it("skips the next line's leading spaces after Enter", () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\n');
    const snap = engine.getSnapshot();
    expect(snap.wordIndex).toBe(1);
    expect(snap.charIndexInWord).toBe(4); // caret is past the four spaces
    expect(snap.words[1].chars.slice(0, 4).every((c) => c.state === 'skipped')).toBe(true);
  });

  it('lets the user type only the real code, and finishes the snippet', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\nrun();\n}');
    expect(engine.isFinished()).toBe(true);
    expect(engine.getFinalStats().incorrectChars).toBe(0);
  });

  it('does not count skipped indentation as typed characters', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\nrun();\n}');
    // 17 non-indent characters: "if (x) {" 8 + Enter + "run();" 6 + Enter + "}" 1
    expect(engine.getFinalStats().correctChars).toBe(17);
  });

  it('requires the indentation to be typed when skipping is off', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, false));
    type(engine, 'if (x) {\n');
    const snap = engine.getSnapshot();
    expect(snap.charIndexInWord).toBe(0);
    engine.handleKey('r', 2000); // wrong: a space was expected
    expect(engine.getSnapshot().words[1].chars[0].state).toBe('incorrect');
  });

  it('backspace over the indentation returns to before the newline', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\n');
    engine.handleKey('Backspace', 5000);
    const snap = engine.getSnapshot();
    expect(snap.wordIndex).toBe(0);
    expect(snap.charIndexInWord).toBe(8); // caret sits on the newline again
    expect(snap.words[0].chars[8].state).toBe('pending');
    expect(snap.words[1].chars.slice(0, 4).every((c) => c.state === 'pending')).toBe(true);
    expect(snap.charCounts.correct).toBe(8);
  });

  it('re-skips the indentation after retyping Enter', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\n');
    engine.handleKey('Backspace', 5000);
    engine.handleKey('Enter', 5100);
    expect(engine.getSnapshot().charIndexInWord).toBe(4);
  });

  it('backspace within a line removes one character and its count', () => {
    const engine = new TypingEngine(generateCodeChallenge('abc', false));
    type(engine, 'ax');
    engine.handleKey('Backspace', 1000);
    const snap = engine.getSnapshot();
    expect(snap.charIndexInWord).toBe(1);
    expect(snap.charCounts).toEqual({ correct: 1, incorrect: 0, extra: 0 });
  });

  it('ignores backspace before typing has started', () => {
    const engine = new TypingEngine(generateCodeChallenge('abc', false));
    engine.handleKey('Backspace', 0);
    expect(engine.getStatus()).toBe('idle');
  });
});

describe('text kind: snapshot and timing', () => {
  it('reports the kind and one entry per line, newline included', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    const snap = engine.getSnapshot();
    expect(snap.kind).toBe('text');
    expect(snap.words).toHaveLength(3);
    expect(snap.words[0].chars.at(-1)?.char).toBe('\n');
    expect(snap.words[2].chars.map((c) => c.char).join('')).toBe('}');
  });

  it('uses the same characters / 5 formula for WPM', () => {
    const engine = new TypingEngine(generateCodeChallenge('abcdefghij', false));
    // 10 correct characters over 12 seconds -> (10 / 5) / 0.2 min = 10 wpm
    let t = 0;
    for (const ch of 'abcdefghi') {
      engine.handleKey(ch, t);
      t += 1000;
    }
    engine.handleKey('j', 12000);
    expect(engine.getFinalStats().wpm).toBe(10);
  });

  it('excludes paused time from a text run', () => {
    const engine = new TypingEngine(generateCodeChallenge('abcd', false));
    engine.handleKey('a', 0);
    engine.pause(100);
    expect(engine.handleKey('b', 200)).toBe(false);
    engine.resume(10100);
    expect(engine.getSnapshot(10200).elapsedMs).toBe(200);
  });

  it('resets between snippets, including switching kinds', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    type(engine, 'ab');
    engine.reset({ text: 'cat dog', wordBoundaries: [0, 4] });
    expect(engine.getSnapshot().kind).toBe('words');
    engine.reset(generateCodeChallenge('xy', false));
    expect(engine.getSnapshot().kind).toBe('text');
    expect(engine.getStatus()).toBe('idle');
  });

  it('ignores extend() for text challenges', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    engine.extend(['cd']);
    type(engine, 'ab');
    expect(engine.isFinished()).toBe(true);
  });
});

describe('text kind: word delete (Ctrl+Backspace)', () => {
  it('removes the word before the cursor', () => {
    const engine = new TypingEngine(generateCodeChallenge('one two three', false));
    type(engine, 'one tw');
    engine.handleKey('Backspace', 9000, true);
    const snap = engine.getSnapshot();
    expect(snap.charIndexInWord).toBe(4); // just after "one "
    expect(snap.charCounts).toEqual({ correct: 4, incorrect: 0, extra: 0 });
  });

  it('removes the spaces first, then the word behind them', () => {
    const engine = new TypingEngine(generateCodeChallenge('one two three', false));
    type(engine, 'one ');
    engine.handleKey('Backspace', 9000, true);
    expect(engine.getSnapshot().charIndexInWord).toBe(0);
  });

  it('stops at the start of the text', () => {
    const engine = new TypingEngine(generateCodeChallenge('abc', false));
    type(engine, 'ab');
    engine.handleKey('Backspace', 9000, true);
    engine.handleKey('Backspace', 9100, true);
    expect(engine.getSnapshot().charIndexInWord).toBe(0);
    expect(engine.getSnapshot().charCounts).toEqual({ correct: 0, incorrect: 0, extra: 0 });
  });

  it('crosses a newline and restores skipped indentation', () => {
    const engine = new TypingEngine(generateCodeChallenge(CODE, true));
    type(engine, 'if (x) {\n');
    engine.handleKey('Backspace', 9000, true);
    // The newline goes, then the brace: the cursor is back after "if (x) ".
    expect(engine.getSnapshot().charIndexInWord).toBe(7);
    expect(
      engine
        .getSnapshot()
        .words[1].chars.slice(0, 4)
        .every((c) => c.state === 'pending'),
    ).toBe(true);
  });
});

describe('text kind: typed-character tracking', () => {
  const typedOf = (engine: TypingEngine, line: number) =>
    engine.getSnapshot().words[line].chars.map((c) => c.typed);

  it('remembers the wrong key at each position, on any line', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab\ncd', false));
    type(engine, 'ax\ncy');
    expect(typedOf(engine, 0)).toEqual([undefined, 'x', undefined]);
    expect(typedOf(engine, 1)).toEqual([undefined, 'y']);
  });

  it('records a space typed for a letter, and Enter typed for a letter, as they were pressed', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    type(engine, ' \n');
    expect(typedOf(engine, 0)).toEqual([' ', '\n']);
  });

  it('remembers a letter typed where the newline was expected', () => {
    const engine = new TypingEngine(generateCodeChallenge('a\nb', false));
    type(engine, 'ax');
    expect(engine.getSnapshot().words[0].chars[1].state).toBe('incorrect');
    expect(typedOf(engine, 0)[1]).toBe('x');
  });

  it('drops it again on Backspace', () => {
    const engine = new TypingEngine(generateCodeChallenge('abc', false));
    type(engine, 'ax');
    engine.handleKey('Backspace', 9000);
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, undefined]);
  });

  it('drops the keys of a word removed with Ctrl+Backspace', () => {
    const engine = new TypingEngine(generateCodeChallenge('abc def', false));
    type(engine, 'xyz');
    engine.handleKey('Backspace', 9000, true);
    expect(typedOf(engine, 0).every((t) => t === undefined)).toBe(true);
  });

  it('keeps case exactly as typed', () => {
    const engine = new TypingEngine(generateCodeChallenge('ab', false));
    type(engine, 'AB');
    expect(typedOf(engine, 0)).toEqual(['A', 'B']);
  });
});
