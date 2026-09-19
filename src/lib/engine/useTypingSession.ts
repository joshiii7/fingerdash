import { writable, type Readable } from 'svelte/store';
import { TypingEngine, type EngineSnapshot } from './typingEngine';
import type { Challenge } from './challenge';
import { isTextEntryTarget } from '../palette/openRules';

export interface TypingSessionOptions {
  pollIntervalMs?: number;
  onFinish?: (engine: TypingEngine) => void;
}

export interface TypingSession {
  snapshot: Readable<EngineSnapshot>;
  engine: TypingEngine;
  start(): void;
  stop(): void;
  reset(challenge: Challenge): void;
  /** Detach the key listener and freeze the run's clock (e.g. while a modal is open). */
  pause(): void;
  resume(): void;
  extendWords(words: string[]): void;
  forceFinish(): void;
  destroy(): void;
}

/** Navigation keys that a focused <select> (or other form control) uses itself. */
const FORM_CONTROL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

const KEYS_THAT_SCROLL = new Set([
  ' ',
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

/**
 * Wires a TypingEngine to a document-level keydown listener and a throttled
 * poll loop, exposing a Svelte store for the UI. The engine's own hot path
 * (handleKey) is untouched by Svelte reactivity — only the poll pushes
 * snapshots into the store.
 */
export function createTypingSession(
  challenge: Challenge,
  options: TypingSessionOptions = {},
): TypingSession {
  const pollIntervalMs = options.pollIntervalMs ?? 150;
  const engine = new TypingEngine(challenge);
  const store = writable<EngineSnapshot>(engine.getSnapshot());

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let listening = false;

  function pushSnapshot() {
    store.set(engine.getSnapshot(performance.now()));
  }

  function startPolling() {
    if (intervalId !== null) return;
    intervalId = setInterval(pushSnapshot, pollIntervalMs);
  }

  function stopPolling() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function onKeydown(event: KeyboardEvent) {
    // Ctrl+Backspace (Option+Backspace on a Mac) deletes a whole word, so it is the one
    // modified key the session handles. Every other shortcut belongs to the browser.
    const wordDelete =
      event.key === 'Backspace' && (event.ctrlKey || event.altKey) && !event.metaKey;
    if ((event.ctrlKey || event.metaKey || event.altKey) && !wordDelete) return;
    // Don't swallow arrow/page keys a focused dropdown needs to change its value.
    const controlNeedsKey = FORM_CONTROL_KEYS.has(event.key) && isTextEntryTarget(event.target);
    if (KEYS_THAT_SCROLL.has(event.key) && !controlNeedsKey) event.preventDefault();

    const wasFinished = engine.isFinished();
    const consumed = engine.handleKey(event.key, performance.now(), wordDelete);
    if (consumed) event.preventDefault();

    if (!wasFinished && engine.isFinished()) {
      pushSnapshot();
      stopPolling();
      options.onFinish?.(engine);
    }
  }

  function start() {
    if (listening) return;
    listening = true;
    document.addEventListener('keydown', onKeydown);
    if (!engine.isFinished()) startPolling();
  }

  function stop() {
    if (!listening) return;
    listening = false;
    document.removeEventListener('keydown', onKeydown);
    stopPolling();
  }

  function pause() {
    engine.pause(performance.now());
    stop();
  }

  function resume() {
    if (listening) return;
    engine.resume(performance.now());
    start();
  }

  function reset(newChallenge: Challenge) {
    engine.reset(newChallenge);
    pushSnapshot();
    startPolling();
  }

  function extendWords(words: string[]) {
    engine.extend(words);
    pushSnapshot();
  }

  function forceFinish() {
    if (engine.isFinished()) return;
    engine.finish(performance.now());
    pushSnapshot();
    stopPolling();
    options.onFinish?.(engine);
  }

  function destroy() {
    stop();
  }

  return {
    snapshot: store,
    engine,
    start,
    stop,
    reset,
    pause,
    resume,
    extendWords,
    forceFinish,
    destroy,
  };
}
