import { afterEach, describe, expect, it, vi } from 'vitest';
import { paletteShortcutLabel } from './shortcut';

function withUserAgent(userAgent: string): void {
  vi.stubGlobal('navigator', { userAgent });
}

describe('paletteShortcutLabel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('says Cmd+K on macOS', () => {
    withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
    expect(paletteShortcutLabel()).toBe('Cmd+K');
  });

  it('says Ctrl+K on Windows and Linux', () => {
    withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120');
    expect(paletteShortcutLabel()).toBe('Ctrl+K');
    withUserAgent('Mozilla/5.0 (X11; Linux x86_64) Firefox/120');
    expect(paletteShortcutLabel()).toBe('Ctrl+K');
  });
});
