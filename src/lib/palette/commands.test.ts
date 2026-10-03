import { describe, it, expect } from 'vitest';
import { buildCommands, filterCommands } from './commands';
import { THEMES } from '../stores/settings';
import { CODE_LANGUAGES } from '../../data/code';

describe('buildCommands', () => {
  const commands = buildCommands();

  it('has one theme command per theme, including GitHub Dark and GitHub Light', () => {
    const themes = commands.filter((c) => c.kind === 'theme');
    expect(themes).toHaveLength(THEMES.length);
    const labels = themes.map((c) => c.label);
    expect(labels).toContain('Theme: GitHub Dark');
    expect(labels).toContain('Theme: GitHub Light');
  });

  it('offers navigation to Test, Tutorial, About, Accessibility, and Privacy', () => {
    const routes = commands.flatMap((c) => (c.kind === 'navigate' ? [c.route] : []));
    for (const route of ['test', 'tutorial', 'about', 'accessibility', 'privacy']) {
      expect(routes).toContain(route);
    }
  });

  it('gives every command a unique id', () => {
    const ids = commands.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('filterCommands', () => {
  const commands = buildCommands();

  it('returns everything for an empty or whitespace query', () => {
    expect(filterCommands(commands, '')).toHaveLength(commands.length);
    expect(filterCommands(commands, '   ')).toHaveLength(commands.length);
  });

  it('matches case-insensitively on the label', () => {
    expect(filterCommands(commands, 'NORD').map((c) => c.label)).toEqual(['Theme: Nord']);
  });

  it('requires every word to match, in any order', () => {
    expect(filterCommands(commands, 'github light').map((c) => c.label)).toEqual([
      'Theme: GitHub Light',
    ]);
    expect(filterCommands(commands, 'light github')).toHaveLength(1);
  });

  it('matches keywords, not only labels', () => {
    expect(filterCommands(commands, 'colour')).toHaveLength(THEMES.length);
  });

  it('returns nothing when no command matches', () => {
    expect(filterCommands(commands, 'zzzz')).toEqual([]);
  });
});

describe('test commands', () => {
  const commands = buildCommands();
  const byId = (id: string) => commands.find((c) => c.id === id);

  it('can switch to every test mode', () => {
    for (const mode of ['time', 'words', 'quote', 'custom', 'code']) {
      const command = byId(`mode-${mode}`);
      expect(command?.kind).toBe('setting');
      expect(command?.kind === 'setting' && command.patch).toEqual({ mode });
    }
  });

  it('can choose each code language, which also switches to code mode', () => {
    for (const { id } of CODE_LANGUAGES) {
      const command = byId(`code-${id}`);
      expect(command?.kind === 'setting' && command.patch).toEqual({
        mode: 'code',
        codeLanguage: id,
      });
    }
    expect(CODE_LANGUAGES).toHaveLength(9);
  });

  it('can choose each quote length, which also switches to quote mode', () => {
    expect(byId('quote-short')?.kind === 'setting' && byId('quote-short')).toMatchObject({
      patch: { mode: 'quote', quoteLength: 'short' },
    });
    expect(byId('quote-all')).toBeDefined();
  });

  it('can turn code indentation skipping on and off', () => {
    const on = byId('indent-skip');
    const off = byId('indent-type');
    expect(on?.kind === 'setting' && on.patch).toEqual({ skipIndent: true });
    expect(off?.kind === 'setting' && off.patch).toEqual({ skipIndent: false });
  });

  it('can open the custom text editor', () => {
    expect(byId('custom-edit')).toMatchObject({ kind: 'action', action: 'edit-custom-text' });
  });

  it('is found by searching for the language or the word "language"', () => {
    expect(filterCommands(commands, 'python').map((c) => c.id)).toContain('code-python');
    expect(filterCommands(commands, 'c++').map((c) => c.id)).toContain('code-cpp');
    expect(filterCommands(commands, 'code language').length).toBeGreaterThanOrEqual(9);
  });

  it('gives every setting command a screen reader message', () => {
    for (const command of commands) {
      if (command.kind === 'setting') expect(command.announce.length).toBeGreaterThan(3);
    }
  });
});

describe('Gun Mode commands', () => {
  const commands = buildCommands();

  it('has a command for toggling, muting, volume, and each weapon', () => {
    const ids = commands.filter((c) => c.kind === 'gun').map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'gun-toggle',
        'gun-mute',
        'gun-volume-up',
        'gun-volume-down',
        'gun-weapon-rakrak',
        'gun-weapon-smg',
        'gun-weapon-shotgun',
        'gun-weapon-pistol',
        'gun-weapon-revolver',
      ]),
    );
  });

  it('is found by searching for "gun" or "volume"', () => {
    expect(filterCommands(commands, 'gun').length).toBeGreaterThanOrEqual(8);
    expect(filterCommands(commands, 'gun volume').map((c) => c.id)).toContain('gun-volume-up');
  });
});
