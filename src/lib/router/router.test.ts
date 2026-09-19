import { describe, it, expect } from 'vitest';
import { hrefFor, isInternalNavigation, legacyHashRoute, routeFromPath } from './router';

describe('hrefFor', () => {
  it('builds real paths under the base', () => {
    expect(hrefFor('home', '/fingerdash/')).toBe('/fingerdash/');
    expect(hrefFor('about', '/fingerdash/')).toBe('/fingerdash/about/');
    expect(hrefFor('tutorial', '/')).toBe('/tutorial/');
  });
});

describe('routeFromPath', () => {
  it('maps each page URL to its route', () => {
    const cases = ['test', 'tutorial', 'about', 'accessibility', 'privacy'] as const;
    for (const route of cases) {
      expect(routeFromPath(`/fingerdash/${route}/`, '/fingerdash/')).toBe(route);
    }
    expect(routeFromPath('/fingerdash/', '/fingerdash/')).toBe('home');
  });

  it('tolerates a missing trailing slash and index.html', () => {
    expect(routeFromPath('/fingerdash/about', '/fingerdash/')).toBe('about');
    expect(routeFromPath('/fingerdash/about/index.html', '/fingerdash/')).toBe('about');
    expect(routeFromPath('/fingerdash/index.html', '/fingerdash/')).toBe('home');
  });

  it('works at the site root too', () => {
    expect(routeFromPath('/privacy/', '/')).toBe('privacy');
    expect(routeFromPath('/', '/')).toBe('home');
  });

  it('falls back to home for unknown paths', () => {
    expect(routeFromPath('/fingerdash/nope/', '/fingerdash/')).toBe('home');
    expect(routeFromPath('/fingerdash/about/extra/', '/fingerdash/')).toBe('home');
  });

  it('does not treat the base path name as a page', () => {
    expect(routeFromPath('/fingerdash/fingerdash/', '/fingerdash/')).toBe('home');
  });
});

describe('legacyHashRoute', () => {
  it('reads old hash URLs', () => {
    expect(legacyHashRoute('#/about')).toBe('about');
    expect(legacyHashRoute('#/tutorial')).toBe('tutorial');
    expect(legacyHashRoute('#/privacy/')).toBe('privacy');
  });

  it('ignores anything else, including in-page anchors', () => {
    expect(legacyHashRoute('')).toBeNull();
    expect(legacyHashRoute('#/')).toBeNull();
    expect(legacyHashRoute('#main-content')).toBeNull();
    expect(legacyHashRoute('#/nope')).toBeNull();
  });
});

describe('isInternalNavigation', () => {
  const origin = 'https://site.test';
  const base = '/fingerdash/';
  const link = (href: string, extra: { target?: string; download?: boolean } = {}) => ({
    href,
    target: extra.target ?? '',
    hasAttribute: (name: string) => name === 'download' && !!extra.download,
  });

  it('handles links to app pages under the base', () => {
    expect(isInternalNavigation(link(`${origin}/fingerdash/about/`), origin, base)).toBe('about');
    expect(isInternalNavigation(link(`${origin}/fingerdash/`), origin, base)).toBe('home');
  });

  it('leaves other origins, new tabs, downloads, and non-page paths alone', () => {
    expect(isInternalNavigation(link('https://github.com/x/y'), origin, base)).toBeNull();
    expect(
      isInternalNavigation(link(`${origin}/fingerdash/about/`, { target: '_blank' }), origin, base),
    ).toBeNull();
    expect(
      isInternalNavigation(link(`${origin}/fingerdash/about/`, { download: true }), origin, base),
    ).toBeNull();
    expect(isInternalNavigation(link(`${origin}/fingerdash/sitemap.xml`), origin, base)).toBeNull();
    expect(isInternalNavigation(link(`${origin}/elsewhere/about/`), origin, base)).toBeNull();
    expect(isInternalNavigation(link('not a url'), origin, base)).toBeNull();
  });
});
