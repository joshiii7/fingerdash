import { describe, it, expect } from 'vitest';
import { defaultSettings, sanitizeSettings } from './settings';
import { DEFAULT_CUSTOM_TEXT } from '../text/customText';

describe('sanitizeSettings', () => {
  it('returns the defaults for nothing, junk, or a non-object', () => {
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings);
    expect(sanitizeSettings(null)).toEqual(defaultSettings);
    expect(sanitizeSettings('nope')).toEqual(defaultSettings);
    expect(sanitizeSettings([])).toEqual(defaultSettings);
  });

  it('fills in fields that settings saved by an older version do not have', () => {
    const old = {
      theme: 'nord',
      mode: 'time',
      timeDuration: 60,
      wordCount: 50,
      punctuation: true,
      numbers: true,
    };
    const result = sanitizeSettings(old);
    expect(result.theme).toBe('nord');
    expect(result.mode).toBe('time');
    expect(result.punctuation).toBe(true);
    expect(result.codeLanguage).toBe(defaultSettings.codeLanguage);
    expect(result.quoteLength).toBe('all');
    expect(result.customText).toBe(DEFAULT_CUSTOM_TEXT);
    expect(result.skipIndent).toBe(true);
  });

  it('keeps valid values for every new mode, option, and language', () => {
    const saved = {
      ...defaultSettings,
      mode: 'code',
      codeLanguage: 'csharp',
      quoteLength: 'long',
      skipIndent: false,
      customText: 'my own text',
    };
    expect(sanitizeSettings(saved)).toEqual(saved);
    expect(sanitizeSettings({ ...saved, mode: 'quote' }).mode).toBe('quote');
    expect(sanitizeSettings({ ...saved, mode: 'custom' }).mode).toBe('custom');
  });

  it('replaces invalid values with defaults', () => {
    const result = sanitizeSettings({
      theme: 'neon',
      mode: 'zen',
      timeDuration: 7,
      wordCount: 'many',
      punctuation: 'yes',
      quoteLength: 'huge',
      codeLanguage: 'cobol',
      skipIndent: 1,
    });
    expect(result).toEqual(defaultSettings);
  });

  it('normalizes saved custom text and falls back when it is empty', () => {
    expect(sanitizeSettings({ customText: '  two   words\n' }).customText).toBe('two words');
    expect(sanitizeSettings({ customText: '   ' }).customText).toBe(DEFAULT_CUSTOM_TEXT);
    expect(sanitizeSettings({ customText: 42 }).customText).toBe(DEFAULT_CUSTOM_TEXT);
  });
});
