/** Label for the palette shortcut on the current platform: "Cmd+K" on macOS, otherwise "Ctrl+K". */
export function paletteShortcutLabel(): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  return isMac ? 'Cmd+K' : 'Ctrl+K';
}
