import type { Challenge, ChallengeKind } from './challenge';
import type { Keystroke, CharCounts, TypingStats } from './stats';
import { calculateStats } from './stats';

/** `skipped`: indentation the engine jumped past for the user (never counted). */
export type CharState = 'pending' | 'correct' | 'incorrect' | 'extra' | 'skipped';
export type EngineStatus = 'idle' | 'running' | 'finished';

export interface RenderChar {
  char: string;
  state: CharState;
  /**
   * On an `incorrect` character: what was actually typed there, exactly as the key was
   * pressed ("y" and "Y" differ; a space is " " and Enter is a newline). It is gone again
   * after Backspace.
   */
  typed?: string;
}

export interface RenderWord {
  chars: RenderChar[];
}

export interface EngineSnapshot {
  /** Words kind: the words. Text kind: the lines (each ending in a "\n" char except the last). */
  words: RenderWord[];
  kind: ChallengeKind;
  wordIndex: number;
  charIndexInWord: number;
  status: EngineStatus;
  startTime: number | null;
  endTime: number | null;
  elapsedMs: number;
  charCounts: CharCounts;
  liveWpm: number;
  liveRawWpm: number;
}

const IGNORED_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'Escape',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Insert',
  'Delete',
  'ContextMenu',
]);

function isPrintableKey(key: string): boolean {
  if (IGNORED_KEYS.has(key)) return false;
  if (key.length !== 1) return false; // excludes F1-F12, 'Dead', etc.
  return true;
}

/**
 * Framework-independent typing engine. Owns no DOM/timer state — callers
 * (Svelte components) feed it keydown events via `handleKey` and poll
 * `getSnapshot` on a throttled interval to render the UI.
 */
export class TypingEngine {
  private words: string[] = [];
  private typed: string[][] = [];
  private wordIndex = 0;
  private status: EngineStatus = 'idle';
  private startTime: number | null = null;
  private endTime: number | null = null;
  private keystrokes: Keystroke[] = [];
  private charCounts: CharCounts = { correct: 0, incorrect: 0, extra: 0 };
  // Time spent paused is subtracted from every timestamp, so a pause never
  // counts toward elapsed time, WPM, or consistency.
  private pausedAt: number | null = null;
  private pausedTotal = 0;
  // Text-kind state: one entry per target character, plus the cursor.
  private kind: ChallengeKind = 'words';
  private skipIndent = false;
  private chars: string[] = [];
  private states: CharState[] = [];
  /** Text kind: the key typed at each position, so a mistake can show what was pressed. */
  private typedAt: (string | undefined)[] = [];
  private pos = 0;

  constructor(challenge: Challenge) {
    this.load(challenge);
  }

  private load(challenge: Challenge): void {
    this.kind = challenge.kind ?? 'words';
    this.skipIndent = challenge.skipIndent ?? false;
    if (this.kind === 'text') {
      this.words = [];
      this.typed = [];
      this.chars = [...challenge.text];
      this.states = this.chars.map(() => 'pending');
      this.typedAt = this.chars.map(() => undefined);
    } else {
      this.words = challenge.text.length > 0 ? challenge.text.split(' ') : [];
      this.typed = this.words.map(() => []);
      this.chars = [];
      this.states = [];
      this.typedAt = [];
    }
    this.pos = 0;
  }

  reset(challenge: Challenge): void {
    this.load(challenge);
    this.wordIndex = 0;
    this.status = 'idle';
    this.startTime = null;
    this.endTime = null;
    this.keystrokes = [];
    this.charCounts = { correct: 0, incorrect: 0, extra: 0 };
    this.pausedAt = null;
    this.pausedTotal = 0;
  }

  /** Freeze the clock while a run is in progress. No-op unless running. */
  pause(timestamp: number): void {
    if (this.status !== 'running' || this.pausedAt !== null) return;
    this.pausedAt = timestamp;
  }

  /** Resume a paused run; the paused interval is excluded from timing. */
  resume(timestamp: number): void {
    if (this.pausedAt === null) return;
    this.pausedTotal += timestamp - this.pausedAt;
    this.pausedAt = null;
  }

  /** Append more words to the tail of the challenge (used by time-mode). */
  extend(words: string[]): void {
    if (this.kind === 'text') return; // code snippets are fixed-length
    this.words.push(...words);
    this.typed.push(...words.map(() => []));
  }

  isFinished(): boolean {
    return this.status === 'finished';
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  /**
   * Process a single keydown event. `key` should be `event.key` as-is.
   * Returns true if the key was consumed (caller should preventDefault).
   * `wordDelete` is true when Backspace came with Ctrl (or Alt): it removes a whole word.
   */
  handleKey(key: string, timestamp: number, wordDelete = false): boolean {
    if (this.status === 'finished' || this.pausedAt !== null || this.isEmpty()) return false;

    const adjusted = timestamp - this.pausedTotal;

    if (this.kind === 'text') return this.handleKeyText(key, adjusted, wordDelete);

    if (key === 'Backspace') {
      if (wordDelete) this.deleteWord();
      else this.handleBackspace();
      return true;
    }

    if (!isPrintableKey(key)) return false;

    if (this.status === 'idle') {
      this.status = 'running';
      this.startTime = adjusted;
    }

    if (key === ' ') {
      this.handleSpace();
      return true;
    }

    this.handleChar(key, adjusted);
    return true;
  }

  private isEmpty(): boolean {
    return this.kind === 'text' ? this.chars.length === 0 : this.words.length === 0;
  }

  /**
   * Text kind: every key is a character in order. Enter types a newline, Space is
   * an ordinary character, and a wrong key is marked incorrect and still advances
   * (there are no "extra" characters). `adjusted` is already pause-corrected.
   */
  private handleKeyText(key: string, adjusted: number, wordDelete: boolean): boolean {
    if (key === 'Backspace') {
      if (wordDelete) this.deleteWordText();
      else this.backspaceText();
      return true;
    }

    const isEnter = key === 'Enter';
    if (!isEnter && !isPrintableKey(key)) return false;
    const typedChar = isEnter ? '\n' : key;

    if (this.status === 'idle') {
      this.status = 'running';
      this.startTime = adjusted;
    }

    const target = this.chars[this.pos];
    const correct = typedChar === target;
    this.states[this.pos] = correct ? 'correct' : 'incorrect';
    this.typedAt[this.pos] = correct ? undefined : typedChar;
    if (correct) this.charCounts.correct += 1;
    else this.charCounts.incorrect += 1;
    this.keystrokes.push({ char: typedChar, timestamp: adjusted, correct });
    this.pos += 1;

    if (this.skipIndent && target === '\n') this.skipLeadingSpaces();
    if (this.pos >= this.chars.length) this.finishAt(adjusted);
    return true;
  }

  /** Jump the cursor past the spaces at the start of the line it just entered. */
  private skipLeadingSpaces(): void {
    while (this.pos < this.chars.length && this.chars[this.pos] === ' ') {
      this.states[this.pos] = 'skipped';
      this.pos += 1;
    }
  }

  private backspaceText(): void {
    if (this.status !== 'running' || this.pos === 0) return;
    // Step back over auto-skipped indentation so it becomes untyped again, then
    // undo the last character the user actually typed.
    let p = this.pos - 1;
    while (p > 0 && this.states[p] === 'skipped') {
      this.states[p] = 'pending';
      p -= 1;
    }
    const state = this.states[p];
    if (state === 'correct') {
      this.charCounts.correct = Math.max(0, this.charCounts.correct - 1);
    } else if (state === 'incorrect') {
      this.charCounts.incorrect = Math.max(0, this.charCounts.incorrect - 1);
    }
    this.states[p] = 'pending';
    this.typedAt[p] = undefined;
    this.pos = p;
  }

  /** Text kind: one RenderWord per line. */
  private renderLines(): RenderWord[] {
    const lines: RenderWord[] = [];
    let current: RenderChar[] = [];
    this.chars.forEach((char, i) => {
      const state = this.states[i];
      const typed = state === 'incorrect' ? this.typedAt[i] : undefined;
      current.push(typed === undefined ? { char, state } : { char, state, typed });
      if (char === '\n') {
        lines.push({ chars: current });
        current = [];
      }
    });
    lines.push({ chars: current });
    return lines;
  }

  /** Text kind: the cursor as a line and a column within that line. */
  private textCursor(): { line: number; column: number } {
    let line = 0;
    let column = 0;
    const end = Math.min(this.pos, this.chars.length);
    for (let i = 0; i < end; i++) {
      if (this.chars[i] === '\n') {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
    }
    return { line, column };
  }

  /**
   * Ctrl+Backspace in a word test: clears everything typed in the current word. If the current
   * word is empty it steps back to the previous word and clears that one, like a text editor.
   */
  private deleteWord(): void {
    if (this.status !== 'running') return;

    if (this.typed[this.wordIndex].length === 0) {
      if (this.wordIndex === 0) return;
      this.wordIndex -= 1;
    }
    const current = this.typed[this.wordIndex];
    while (current.length > 0) {
      const removed = current.pop()!;
      this.uncountChar(this.wordIndex, current.length, removed);
    }
  }

  /**
   * Ctrl+Backspace in code or custom text: removes the spaces just before the cursor, then the
   * run of characters before them, the same as a text editor.
   */
  private deleteWordText(): void {
    const isSpace = (char: string | undefined) => char === ' ' || char === '\n' || char === '\t';
    while (this.pos > 0 && isSpace(this.chars[this.pos - 1])) {
      const before = this.pos;
      this.backspaceText();
      if (this.pos === before) return;
    }
    while (this.pos > 0 && !isSpace(this.chars[this.pos - 1])) {
      const before = this.pos;
      this.backspaceText();
      if (this.pos === before) return;
    }
  }

  private handleBackspace(): void {
    if (this.status !== 'running') return;

    const current = this.typed[this.wordIndex];
    if (current.length > 0) {
      const removed = current.pop()!;
      this.uncountChar(this.wordIndex, current.length, removed);
    } else if (this.wordIndex > 0) {
      this.wordIndex -= 1;
    }
  }

  private handleSpace(): void {
    const current = this.typed[this.wordIndex];
    if (current.length === 0) return; // ignore leading/double spaces
    if (this.wordIndex >= this.words.length - 1) return; // no next word to advance to
    this.wordIndex += 1;
  }

  private handleChar(key: string, timestamp: number): void {
    const wordIndex = this.wordIndex;
    const target = this.words[wordIndex] ?? '';
    const position = this.typed[wordIndex].length;
    this.typed[wordIndex].push(key);

    const isExtra = position >= target.length;
    const isCorrect = !isExtra && target[position] === key;

    if (isExtra) {
      this.charCounts.extra += 1;
    } else if (isCorrect) {
      this.charCounts.correct += 1;
    } else {
      this.charCounts.incorrect += 1;
    }

    this.keystrokes.push({ char: key, timestamp, correct: isCorrect });

    const isLastWord = wordIndex === this.words.length - 1;
    if (isLastWord && this.typed[wordIndex].length >= target.length) {
      this.finishAt(timestamp);
    }
  }

  private uncountChar(wordIndex: number, position: number, char: string): void {
    const target = this.words[wordIndex] ?? '';
    const isExtra = position >= target.length;
    const isCorrect = !isExtra && target[position] === char;

    if (isExtra) {
      this.charCounts.extra = Math.max(0, this.charCounts.extra - 1);
    } else if (isCorrect) {
      this.charCounts.correct = Math.max(0, this.charCounts.correct - 1);
    } else {
      this.charCounts.incorrect = Math.max(0, this.charCounts.incorrect - 1);
    }
  }

  finish(timestamp: number): void {
    this.finishAt(timestamp - this.pausedTotal);
  }

  /** `timestamp` is already adjusted for paused time. */
  private finishAt(timestamp: number): void {
    if (this.status === 'finished') return;
    this.status = 'finished';
    this.pausedAt = null;
    this.endTime = timestamp;
    if (this.startTime === null) this.startTime = timestamp;
  }

  getFinalStats(): TypingStats {
    const start = this.startTime ?? 0;
    const end = this.endTime ?? start;
    return calculateStats(this.keystrokes, this.charCounts, start, end);
  }

  /** Index of the word being typed. A cheap read, unlike a full snapshot. */
  getWordIndex(): number {
    return this.wordIndex;
  }

  getKeystrokes(): readonly Keystroke[] {
    return this.keystrokes;
  }

  getSnapshot(nowTimestamp?: number): EngineSnapshot {
    const cursor = this.kind === 'text' ? this.textCursor() : null;
    const words: RenderWord[] = cursor
      ? this.renderLines()
      : this.words.map((word, wIdx) => {
          const typedWord = this.typed[wIdx];
          const chars: RenderChar[] = [];

          const len = Math.max(word.length, typedWord.length);
          for (let i = 0; i < len; i++) {
            if (i < word.length && i < typedWord.length) {
              chars.push(
                word[i] === typedWord[i]
                  ? { char: word[i], state: 'correct' }
                  : { char: word[i], state: 'incorrect', typed: typedWord[i] },
              );
            } else if (i < word.length) {
              chars.push({ char: word[i], state: 'pending' });
            } else {
              chars.push({ char: typedWord[i], state: 'extra' });
            }
          }
          return { chars };
        });

    const now = this.pausedAt ?? nowTimestamp;
    const adjustedNow = now === undefined ? undefined : now - this.pausedTotal;
    const elapsedMs =
      this.startTime === null
        ? 0
        : (this.endTime ?? adjustedNow ?? this.startTime) - this.startTime;

    return {
      words,
      kind: this.kind,
      wordIndex: cursor ? cursor.line : this.wordIndex,
      charIndexInWord: cursor ? cursor.column : (this.typed[this.wordIndex]?.length ?? 0),
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      elapsedMs,
      charCounts: { ...this.charCounts },
      liveWpm:
        elapsedMs > 0
          ? Math.round((this.charCounts.correct / 5 / (elapsedMs / 60000)) * 10) / 10
          : 0,
      liveRawWpm:
        elapsedMs > 0
          ? Math.round(
              ((this.charCounts.correct + this.charCounts.incorrect + this.charCounts.extra) /
                5 /
                (elapsedMs / 60000)) *
                10,
            ) / 10
          : 0,
    };
  }
}
