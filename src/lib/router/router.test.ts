import { describe, it, expect } from 'vitest';
import { hrefFor, isInternalNavigation, legacyHashRoute, routeFromPath } from './router';

describe('hrefFor', () => {
  it('builds root-relative page paths', () => {
    expect(hrefFor('home')).toBe('/');
    expect(hrefFor('about')).toBe('/about/');
    expect(hrefFor('tutorial')).toBe('/tutorial/');
  });
});

describe('routeFromPath', () => {
  it('maps each page URL to its route', () => {
    const cases = ['test', 'tutorial', 'about', 'accessibility', 'privacy'] as const;
    for (const route of cases) {
      expect(routeFromPath(`/${route}/`)).toBe(route);
    }
    expect(routeFromPath('/')).toBe('home');
  });

  it('tolerates a missing trailing slash and index.html', () => {
    expect(routeFromPath('/about')).toBe('about');
    expect(routeFromPath('/about/index.html')).toBe('about');
    expect(routeFromPath('/index.html')).toBe('home');
  });

  it('falls back to home for unknown paths', () => {
    expect(routeFromPath('/nope/')).toBe('home');
    expect(routeFromPath('/about/extra/')).toBe('home');
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
  const link = (href: string, extra: { target?: string; download?: boolean } = {}) => ({
    href,
    target: extra.target ?? '',
    hasAttribute: (name: string) => name === 'download' && !!extra.download,
  });

  it('handles links to app pages', () => {
    expect(isInternalNavigation(link(`${origin}/about/`), origin)).toBe('about');
    expect(isInternalNavigation(link(`${origin}/`), origin)).toBe('home');
  });

  it('leaves other origins, new tabs, downloads, and non-page paths alone', () => {
    expect(isInternalNavigation(link('https://github.com/x/y'), origin)).toBeNull();
    expect(isInternalNavigation(link(`${origin}/about/`, { target: '_blank' }), origin)).toBeNull();
    expect(isInternalNavigation(link(`${origin}/about/`, { download: true }), origin)).toBeNull();
    expect(isInternalNavigation(link(`${origin}/sitemap.xml`), origin)).toBeNull();
    expect(isInternalNavigation(link(`${origin}/elsewhere/about/`), origin)).toBeNull();
    expect(isInternalNavigation(link('not a url'), origin)).toBeNull();
  });
});
