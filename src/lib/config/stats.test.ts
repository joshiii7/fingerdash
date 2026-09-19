import { describe, it, expect } from 'vitest';
import { SITE_STATS } from './stats';
import { TEST_MODES } from './modes';
import { CODE_LANGUAGES } from '../../data/code/languages';
import { lessons } from '../../data/lessons';
import { PAGES } from './pages';
import {
  NOSCRIPT_END,
  NOSCRIPT_START,
  buildNoscript,
  injectNoscript,
  statText,
  validateNoscript,
} from '../seo/noscript';

describe('SITE_STATS', () => {
  const byLabel = Object.fromEntries(SITE_STATS.map((s) => [s.label, s.value]));

  it('counts real project data, not typed-in figures', () => {
    expect(byLabel['test modes']).toBe(TEST_MODES.length);
    expect(byLabel['code languages']).toBe(CODE_LANGUAGES.length);
    expect(byLabel['tutorial lessons']).toBe(lessons.length);
  });

  it('reports zero accounts', () => {
    expect(byLabel['accounts required']).toBe(0);
  });

  it('has four stats with distinct labels', () => {
    expect(SITE_STATS).toHaveLength(4);
    expect(new Set(SITE_STATS.map((s) => s.label)).size).toBe(4);
  });

  it('matches what the app offers today', () => {
    expect(byLabel['test modes']).toBe(5);
    expect(byLabel['code languages']).toBe(9);
    expect(byLabel['tutorial lessons']).toBeGreaterThan(0);
  });
});

describe('noscript fallback', () => {
  const about = PAGES.find((p) => p.route === 'about')!;
  const home = PAGES.find((p) => p.route === 'home')!;

  it('writes every real figure into the About page, as plain text', () => {
    const html = buildNoscript(about);
    for (const stat of SITE_STATS) expect(html).toContain(`<li>${statText(stat)}</li>`);
  });

  it('gives other pages a fallback without the stats', () => {
    const html = buildNoscript(home);
    expect(html).toContain('<noscript>');
    expect(html).not.toContain('<li>');
    expect(html).toContain(home.description);
  });

  it('swaps the marked block and leaves the rest alone', () => {
    const template = `<body>${NOSCRIPT_START}<noscript>old</noscript>${NOSCRIPT_END}<div id="app"></div></body>`;
    const out = injectNoscript(template, about);
    expect(out).not.toContain('>old<');
    expect(out).toContain('<div id="app"></div>');
    expect(out).toContain(statText(SITE_STATS[0]));
  });

  it('refuses a template without markers', () => {
    expect(() => injectNoscript('<body></body>', about)).toThrow(/noscript markers/);
  });

  it('validates a good build and catches a missing figure or fallback', () => {
    const good = Object.fromEntries(PAGES.map((p) => [p.route, buildNoscript(p)]));
    expect(validateNoscript(good)).toEqual([]);
    const missingStat = { ...good, about: good.about.replace(statText(SITE_STATS[1]), '') };
    expect(validateNoscript(missingStat).some((p) => p.includes(SITE_STATS[1].label))).toBe(true);
    expect(validateNoscript({ ...good, privacy: '' })).toContain('privacy: no <noscript> fallback');
  });
});
