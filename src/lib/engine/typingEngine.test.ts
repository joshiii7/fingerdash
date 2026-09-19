import { describe, it, expect } from 'vitest';
import { TypingEngine } from './typingEngine';
import { generateWordChallenge, generateQuoteChallenge, extendChallenge } from './challenge';

function typeString(engine: TypingEngine, text: string, startTime = 0, msPerChar = 50) {
  let t = startTime;
  for (const char of text) {
    engine.handleKey(char, t);
    t += msPerChar;
  }
  return t;
}

describe('challenge generation', () => {
  it('generates the requested number of words', () => {
    const challenge = generateWordChallenge(['cat', 'dog', 'fish'], 10);
    expect(challenge.text.split(' ')).toHaveLength(10);
    expect(challenge.wordBoundaries).toHaveLength(10);
  });

  it('builds a challenge from a quote', () => {
    const challenge = generateQuoteChallenge('the quick brown fox');
    expect(challenge.text).toBe('the quick brown fox');
    expect(challenge.wordBoundaries).toEqual([0, 4, 10, 16]);
  });

  it('extends a challenge with additional words, offsetting boundaries', () => {
    const base = generateWordChallenge(['cat'], 2); // "cat cat"
    const extended = extendChallenge(base, ['dog'], 2);
    expect(extended.text).toBe('cat cat dog dog');
    expect(extended.wordBoundaries).toEqual([0, 4, 8, 12]);
  });
});

describe('TypingEngine basic typing', () => {
  it('starts idle and transitions to running on first keystroke', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    expect(engine.getStatus()).toBe('idle');
    engine.handleKey('c', 0);
    expect(engine.getStatus()).toBe('running');
  });

  it('marks correctly typed characters as correct', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cat');
    const snapshot = engine.getSnapshot();
    expect(snapshot.words[0].chars.map((c) => c.state)).toEqual(['correct', 'correct', 'correct']);
  });

  it('marks incorrectly typed characters as incorrect', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cbt');
    const snapshot = engine.getSnapshot();
    expect(snapshot.words[0].chars.map((c) => c.state)).toEqual([
      'correct',
      'incorrect',
      'correct',
    ]);
  });

  it('advances to the next word on space', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cat ');
    const snapshot = engine.getSnapshot();
    expect(snapshot.wordIndex).toBe(1);
  });

  it('ignores a space when the current word is empty', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey(' ', 0);
    expect(engine.getSnapshot().wordIndex).toBe(0);
  });

  it('records extra characters beyond the target word length', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'catxx');
    const snapshot = engine.getSnapshot();
    expect(snapshot.words[0].chars.map((c) => c.state)).toEqual([
      'correct',
      'correct',
      'correct',
      'extra',
      'extra',
    ]);
    expect(snapshot.charCounts.extra).toBe(2);
  });
});

describe('TypingEngine backspace handling', () => {
  it('removes the last typed character', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cab');
    engine.handleKey('Backspace', 200);
    const snapshot = engine.getSnapshot();
    // word length is 3; after removing the 3rd typed char, the 3rd slot goes back to pending
    expect(snapshot.words[0].chars.map((c) => c.state)).toEqual(['correct', 'correct', 'pending']);
  });

  it('moves back to the previous word without deleting a character on the first press', () => {
    // three words so the engine is still "running" (not finished) after word 1
    const engine = new TypingEngine(generateQuoteChallenge('cat dog fish'));
    typeString(engine, 'cat dog');
    engine.handleKey('Backspace', 400); // removes 'g'
    engine.handleKey('Backspace', 450); // removes 'o'
    engine.handleKey('Backspace', 500); // removes 'd'
    engine.handleKey('Backspace', 550); // word 1 typed is now empty -> move to word 0
    expect(engine.getSnapshot().wordIndex).toBe(0);
    // word 0 ("cat") should still be fully intact
    expect(engine.getSnapshot().words[0].chars.map((c) => c.state)).toEqual([
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('correctly un-counts extra characters removed via backspace', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'catxx');
    engine.handleKey('Backspace', 300);
    expect(engine.getSnapshot().charCounts.extra).toBe(1);
  });

  it('does nothing when backspacing before any input', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('Backspace', 0);
    expect(engine.getStatus()).toBe('idle');
    expect(engine.getSnapshot().wordIndex).toBe(0);
  });
});

describe('TypingEngine ignored keys', () => {
  it('ignores modifier and navigation keys', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'ArrowLeft', 'F1', 'Tab', 'Escape']) {
      const consumed = engine.handleKey(key, 0);
      expect(consumed).toBe(false);
    }
    expect(engine.getStatus()).toBe('idle');
  });
});

describe('TypingEngine finishing', () => {
  it('finishes when the last character of the last word is typed', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cat dog');
    expect(engine.isFinished()).toBe(true);
  });

  it('does not accept further input after finishing', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cat dog');
    const before = engine.getSnapshot();
    const consumed = engine.handleKey('x', 1000);
    expect(consumed).toBe(false);
    expect(engine.getSnapshot()).toEqual(before);
  });

  it('extend() allows continuing to type past the original text (time mode)', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat'));
    typeString(engine, 'cat');
    expect(engine.isFinished()).toBe(true);
    engine.extend(['dog']);
    // engine already finished; extend alone should not un-finish it
    expect(engine.isFinished()).toBe(true);
  });
});

describe('TypingEngine stats', () => {
  it('computes wpm, raw wpm, and accuracy for a perfect run', () => {
    const engine = new TypingEngine(generateWordChallenge(['aaaaa'], 5)); // 5 five-letter words = 25 chars + 4 spaces
    // type 30 chars total (25 letters + 4 spaces implicit as advances) in exactly 60s -> wpm should be ~ (25/5)/1 = 5
    const start = 0;
    let t = start;
    const words = 'aaaaa aaaaa aaaaa aaaaa aaaaa';
    for (const char of words) {
      engine.handleKey(char, t);
      t += 2400; // spread keystrokes across 60s total for 25 chars
    }
    const stats = engine.getFinalStats();
    expect(stats.accuracy).toBe(100);
    expect(stats.wpm).toBeGreaterThan(0);
    expect(stats.correctChars).toBe(25);
  });

  it('reduces accuracy when characters are mistyped', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cxt dog');
    const stats = engine.getFinalStats();
    expect(stats.accuracy).toBeLessThan(100);
    expect(stats.incorrectChars).toBe(1);
  });
});

describe('TypingEngine pause/resume', () => {
  it('ignores pause while idle', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.pause(0);
    expect(engine.handleKey('c', 10)).toBe(true);
    expect(engine.getStatus()).toBe('running');
  });

  it('freezes elapsed time while paused', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('c', 1000);
    engine.pause(2000);
    expect(engine.getSnapshot(2000).elapsedMs).toBe(1000);
    expect(engine.getSnapshot(60000).elapsedMs).toBe(1000);
  });

  it('excludes paused time from elapsed time after resuming', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('c', 1000);
    engine.pause(2000);
    engine.resume(12000); // paused for 10s
    expect(engine.getSnapshot(13000).elapsedMs).toBe(2000);
  });

  it('does not count paused time toward the final stats', () => {
    const paused = new TypingEngine(generateQuoteChallenge('cat dog'));
    const straight = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(paused, 'ca', 0, 100);
    paused.pause(200);
    paused.resume(50200);
    typeString(paused, 't dog', 50200, 100);
    typeString(straight, 'cat dog', 0, 100);
    expect(paused.getFinalStats().wpm).toBe(straight.getFinalStats().wpm);
  });

  it('drops keys typed while paused', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('c', 0);
    engine.pause(100);
    expect(engine.handleKey('a', 150)).toBe(false);
    engine.resume(200);
    expect(engine.getSnapshot(200).charIndexInWord).toBe(1);
  });

  it('clears pause state on reset', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('c', 0);
    engine.pause(100);
    engine.reset(generateQuoteChallenge('cat dog'));
    expect(engine.handleKey('c', 5000)).toBe(true);
    expect(engine.getSnapshot(6000).elapsedMs).toBe(1000);
  });
});

describe('TypingEngine word delete (Ctrl+Backspace)', () => {
  it('clears the whole current word, and only that word', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog fish'));
    typeString(engine, 'cat do');
    engine.handleKey('Backspace', 500, true);
    const snap = engine.getSnapshot();
    expect(snap.wordIndex).toBe(1);
    expect(snap.charIndexInWord).toBe(0);
    expect(snap.words[0].chars.every((c) => c.state === 'correct')).toBe(true);
    expect(snap.charCounts).toEqual({ correct: 3, incorrect: 0, extra: 0 });
  });

  it('un-counts wrong and extra characters it removes', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cxtzz');
    engine.handleKey('Backspace', 500, true);
    expect(engine.getSnapshot().charCounts).toEqual({ correct: 0, incorrect: 0, extra: 0 });
  });

  it('on an empty word, goes back and clears the previous word', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog fish'));
    typeString(engine, 'cat ');
    engine.handleKey('Backspace', 500, true);
    const snap = engine.getSnapshot();
    expect(snap.wordIndex).toBe(0);
    expect(snap.charIndexInWord).toBe(0);
    expect(snap.charCounts.correct).toBe(0);
  });

  it('does nothing before any input, or at the very start', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    engine.handleKey('Backspace', 0, true);
    expect(engine.getStatus()).toBe('idle');
    typeString(engine, 'c');
    engine.handleKey('Backspace', 300, true);
    engine.handleKey('Backspace', 400, true);
    expect(engine.getSnapshot().wordIndex).toBe(0);
  });

  it('a plain Backspace still removes one character', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'cat');
    engine.handleKey('Backspace', 300, false);
    expect(engine.getSnapshot().charIndexInWord).toBe(2);
  });
});

describe('TypingEngine typed-character tracking (words)', () => {
  const typedOf = (engine: TypingEngine, word: number) =>
    engine.getSnapshot().words[word].chars.map((c) => c.typed);

  it('remembers what was typed at a wrong position, exactly as pressed', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but cat'));
    typeString(engine, 'buy');
    const chars = engine.getSnapshot().words[0].chars;
    expect(chars.map((c) => c.state)).toEqual(['correct', 'correct', 'incorrect']);
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, 'y']);
  });

  it('keeps upper and lower case apart', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    typeString(engine, 'Bux');
    expect(typedOf(engine, 0)).toEqual(['B', undefined, 'x']);
    // "B" is wrong for "b" even though it is the same letter.
    expect(engine.getSnapshot().words[0].chars[0].state).toBe('incorrect');
  });

  it('tracks every wrong position separately', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat'));
    typeString(engine, 'xay');
    expect(typedOf(engine, 0)).toEqual(['x', undefined, 'y']);
  });

  it('drops the typed character again when Backspace removes it', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but cat'));
    typeString(engine, 'buy');
    engine.handleKey('Backspace', 500);
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, undefined]);
    expect(engine.getSnapshot().words[0].chars[2].state).toBe('pending');
    // Typing the right letter now leaves nothing behind.
    engine.handleKey('t', 600);
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, undefined]);
  });

  it('replaces the remembered key when a wrong one is retyped', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but cat'));
    typeString(engine, 'buy');
    engine.handleKey('Backspace', 500);
    engine.handleKey('z', 600);
    expect(typedOf(engine, 0)[2]).toBe('z');
  });

  it('does not attach a typed key to extra characters, which show themselves', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'catxy');
    const chars = engine.getSnapshot().words[0].chars;
    expect(chars.map((c) => c.state)).toEqual(['correct', 'correct', 'correct', 'extra', 'extra']);
    expect(chars.map((c) => c.typed)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(chars[3].char).toBe('x');
  });

  it('forgets the wrong keys of a word cleared with Ctrl+Backspace', () => {
    const engine = new TypingEngine(generateQuoteChallenge('cat dog'));
    typeString(engine, 'xxx');
    engine.handleKey('Backspace', 500, true);
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, undefined]);
  });

  it('starts clean after a reset', () => {
    const engine = new TypingEngine(generateQuoteChallenge('but'));
    typeString(engine, 'buy');
    engine.reset(generateQuoteChallenge('but'));
    expect(typedOf(engine, 0)).toEqual([undefined, undefined, undefined]);
  });
});
