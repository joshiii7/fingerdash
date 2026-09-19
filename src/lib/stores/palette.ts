import { derived, writable } from 'svelte/store';
import type { ThemeName } from './settings';
import type { TypingSession } from '../engine/useTypingSession';

export const paletteOpen = writable(false);

/** How many modal dialogs are open right now. Each <Modal> counts itself in and out. */
export const openModalCount = writable(0);

/**
 * True while any modal is open: the typing session pauses, the typing keydown
 * listener stays off, and the page behind goes inert.
 */
export const overlayOpen = derived(openModalCount, (count) => count > 0);

/** Set by the command palette to ask the test view to open the custom-text dialog. */
export const customDialogRequest = writable(false);

/** Set by the command palette to ask the tutorial to reopen the current lesson's explanation. */
export const lessonWhyRequest = writable(false);

/** Theme shown while an option is highlighted; null means "use the saved theme". */
export const previewTheme = writable<ThemeName | null>(null);

/** The typing session of the mounted test/lesson view, if any. */
export const activeSession = writable<TypingSession | null>(null);

export function openPalette(): void {
  paletteOpen.set(true);
}
