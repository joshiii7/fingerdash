import type { KeyLike } from '../palette/openRules';

/**
 * Gun Mode shortcuts. Both use Ctrl (Cmd on a Mac), which the typing session ignores, so they
 * can never be typed by accident. Ctrl+G is also the browser's "find next", which the page
 * overrides only on the Test page.
 */
export function isGunToggleShortcut(e: KeyLike): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'g';
}

/** Moves keyboard focus to the volume slider, since Tab can't reach it (Tab restarts the test). */
export function isVolumeFocusShortcut(e: KeyLike): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && e.shiftKey && e.key.toLowerCase() === 'v';
}

function modifier(): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  return isMac ? 'Cmd' : 'Ctrl';
}

export function gunShortcutLabel(): string {
  return `${modifier()}+G`;
}

export function volumeShortcutLabel(): string {
  return `${modifier()}+Shift+V`;
}
