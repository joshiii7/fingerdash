import { activeSession, overlayOpen } from '../stores/palette';
import type { TypingSession } from '../engine/useTypingSession';

/**
 * Registers a view's typing session with the app shell and keeps it paused
 * while any modal overlay (the command palette or the custom-text dialog) is
 * open, so overlay keystrokes never reach the engine and time spent there
 * doesn't count toward the run. Returns a cleanup function.
 */
export function bindSessionToOverlays(session: TypingSession): () => void {
  activeSession.set(session);
  const unsubscribe = overlayOpen.subscribe((open) => {
    if (open) session.pause();
    else session.resume();
  });
  return () => {
    unsubscribe();
    activeSession.update((current) => (current === session ? null : current));
  };
}
