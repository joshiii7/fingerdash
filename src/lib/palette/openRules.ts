export type RunStatus = 'none' | 'idle' | 'running' | 'finished';

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface OpenContext extends KeyLike {
  isComposing?: boolean;
  defaultPrevented?: boolean;
  target: EventTarget | null;
  /** State of the mounted typing session; 'none' when no test/lesson is on screen. */
  runStatus: RunStatus;
  paletteOpen: boolean;
}

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** True when a keystroke aimed at this element would enter text. */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!target || !('tagName' in target)) return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag === 'input') return !NON_TEXT_INPUT_TYPES.has((el as HTMLInputElement).type);
  if (el.isContentEditable) return true;
  return el.closest?.('[role="textbox"], [role="combobox"]') != null;
}

/** Ctrl+K, or Cmd+K on macOS. */
export function isPaletteShortcut(e: KeyLike): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k';
}

/**
 * Decides whether a keydown should open the command palette.
 *
 * - Ctrl/Cmd+K always opens it, even mid-run or from a text field. The run is
 *   paused by the caller.
 * - "/" opens it only when it can't be a typed character: never while a test
 *   or lesson is idle or running (a "/" may be the very next character to
 *   type), and never while a text field has focus.
 */
export function shouldOpenPalette(ctx: OpenContext): boolean {
  if (ctx.paletteOpen || ctx.defaultPrevented || ctx.isComposing) return false;

  if (isPaletteShortcut(ctx)) return true;

  if (ctx.key !== '/') return false;
  if (ctx.ctrlKey || ctx.metaKey || ctx.altKey) return false;
  if (ctx.runStatus === 'idle' || ctx.runStatus === 'running') return false;
  return !isTextEntryTarget(ctx.target);
}
