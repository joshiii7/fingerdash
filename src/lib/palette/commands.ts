import { ROUTE_LABELS, type Route } from '../router/router';
import {
  TEST_MODES,
  THEMES,
  TIME_OPTIONS,
  WORD_OPTIONS,
  type Settings,
  type ThemeName,
} from '../stores/settings';
import { CODE_LANGUAGES } from '../../data/code';
import { QUOTE_LENGTH_OPTIONS } from '../../data/quotes';
import { WEAPONS, type WeaponId } from '../gun/weapons';
import type { GunAction } from '../gun/gunController';

interface BaseCommand {
  id: string;
  label: string;
  keywords: string[];
}

export type Command =
  | (BaseCommand & { kind: 'theme'; themeId: ThemeName })
  | (BaseCommand & { kind: 'navigate'; route: Route })
  /** Changes test settings, then shows the test page. `announce` is read to screen readers. */
  | (BaseCommand & { kind: 'setting'; patch: Partial<Settings>; announce: string })
  | (BaseCommand & { kind: 'action'; action: 'edit-custom-text' })
  /** Opens the tutorial and reopens the explanation for the lesson you are on. */
  | (BaseCommand & { kind: 'lesson-why' })
  /** Gun Mode controls: the keyboard route to the volume and weapon, since Tab restarts the test. */
  | (BaseCommand & { kind: 'gun'; action: GunAction; weapon?: WeaponId });

const NAVIGATE_ROUTES: Route[] = ['test', 'tutorial', 'about', 'accessibility', 'privacy', 'home'];

function setting(
  id: string,
  label: string,
  patch: Partial<Settings>,
  announce: string,
  keywords: string[],
): Command {
  return { id, kind: 'setting', label, patch, announce, keywords: ['test', ...keywords] };
}

function themeCommands(): Command[] {
  return THEMES.map((theme) => ({
    id: `theme-${theme.id}`,
    kind: 'theme',
    label: `Theme: ${theme.label}`,
    keywords: ['change', 'theme', 'color', 'colour', theme.id],
    themeId: theme.id,
  }));
}

/** Quick commands for the test: they give keyboard users a route to every control. */
function testCommands(): Command[] {
  const modes = TEST_MODES.map((m) =>
    setting(`mode-${m.id}`, `Test mode: ${m.label}`, { mode: m.id }, `Mode: ${m.label}.`, [
      'mode',
      'switch',
      m.id,
    ]),
  );
  const languages = CODE_LANGUAGES.map((l) =>
    setting(
      `code-${l.id}`,
      `Code language: ${l.label}`,
      { mode: 'code', codeLanguage: l.id },
      `Code mode, ${l.label}.`,
      ['code', 'language', 'programming', l.id],
    ),
  );
  const quoteLengths = QUOTE_LENGTH_OPTIONS.map((o) =>
    setting(
      `quote-${o.id}`,
      `Quote length: ${o.label}`,
      { mode: 'quote', quoteLength: o.id },
      `Quote mode, ${o.label.toLowerCase()}.`,
      ['quote', 'length', o.id],
    ),
  );
  const times = TIME_OPTIONS.map((t) =>
    setting(
      `time-${t}`,
      `Time limit: ${t} seconds`,
      { mode: 'time', timeDuration: t },
      `Time mode, ${t} seconds.`,
      ['time', 'seconds', 'duration', String(t)],
    ),
  );
  const words = WORD_OPTIONS.map((w) =>
    setting(
      `words-${w}`,
      `Word count: ${w} words`,
      { mode: 'words', wordCount: w },
      `Words mode, ${w} words.`,
      ['words', 'count', String(w)],
    ),
  );
  const toggles: Command[] = [
    setting('punctuation-on', 'Punctuation: on', { punctuation: true }, 'Punctuation on.', [
      'punctuation',
      'sentences',
      'enable',
    ]),
    setting('punctuation-off', 'Punctuation: off', { punctuation: false }, 'Punctuation off.', [
      'punctuation',
      'sentences',
      'disable',
    ]),
    setting('numbers-on', 'Numbers: on', { numbers: true }, 'Numbers on.', ['numbers', 'enable']),
    setting('numbers-off', 'Numbers: off', { numbers: false }, 'Numbers off.', [
      'numbers',
      'disable',
    ]),
    setting(
      'mistakes-on',
      'Show typed mistakes: on',
      { showMistakes: true },
      'Typed mistakes shown.',
      ['mistakes', 'errors', 'wrong', 'letters', 'enable'],
    ),
    setting(
      'mistakes-off',
      'Show typed mistakes: off',
      { showMistakes: false },
      'Typed mistakes hidden.',
      ['mistakes', 'errors', 'wrong', 'letters', 'disable'],
    ),
    setting(
      'indent-skip',
      'Code indentation: skip for me',
      { skipIndent: true },
      'Indentation is skipped for you.',
      ['code', 'indentation', 'indent', 'skip', 'spaces'],
    ),
    setting(
      'indent-type',
      'Code indentation: I type it',
      { skipIndent: false },
      'Indentation is typed by you.',
      ['code', 'indentation', 'indent', 'type', 'spaces'],
    ),
  ];
  const edit: Command = {
    id: 'custom-edit',
    kind: 'action',
    action: 'edit-custom-text',
    label: 'Custom text: edit',
    keywords: ['test', 'custom', 'text', 'change', 'paste', 'own'],
  };
  return [...modes, ...languages, ...quoteLengths, ...times, ...words, ...toggles, edit];
}

/** A keyboard route to the lesson explanation, since Tab restarts a lesson instead of moving focus. */
function tutorialCommands(): Command[] {
  return [
    {
      id: 'lesson-why',
      kind: 'lesson-why',
      label: 'Tutorial: Why this lesson?',
      keywords: ['tutorial', 'lesson', 'why', 'explain', 'explanation', 'intro', 'help'],
    },
  ];
}

function gunCommands(): Command[] {
  const gun = (
    id: string,
    label: string,
    action: GunAction,
    keywords: string[],
    weapon?: WeaponId,
  ): Command => ({
    id: `gun-${id}`,
    kind: 'gun',
    label,
    action,
    weapon,
    keywords: ['gun', 'mode', 'game', 'shoot', ...keywords],
  });
  return [
    gun('toggle', 'Gun Mode: toggle', 'toggle', ['on', 'off', 'enable', 'disable']),
    gun('mute', 'Gun Mode: mute or unmute sounds', 'mute', ['sound', 'audio', 'silence']),
    gun('volume-up', 'Gun Mode: volume up', 'volume-up', ['sound', 'audio', 'louder']),
    gun('volume-down', 'Gun Mode: volume down', 'volume-down', ['sound', 'audio', 'quieter']),
    ...WEAPONS.map((w) =>
      gun(`weapon-${w.id}`, `Gun Mode: weapon ${w.label}`, 'weapon', ['weapon', w.id], w.id),
    ),
  ];
}

function pageCommands(): Command[] {
  return NAVIGATE_ROUTES.map((route) => ({
    id: `go-${route}`,
    kind: 'navigate',
    label: `Go to ${ROUTE_LABELS[route]}`,
    keywords: ['navigate', 'open', 'page'],
    route,
  }));
}

export function buildCommands(): Command[] {
  return [
    ...themeCommands(),
    ...testCommands(),
    ...gunCommands(),
    ...tutorialCommands(),
    ...pageCommands(),
  ];
}

/** Every whitespace-separated word in the query must appear in the label or keywords. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;
  return commands.filter((command) => {
    const haystack = [command.label, ...command.keywords].join(' ').toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
