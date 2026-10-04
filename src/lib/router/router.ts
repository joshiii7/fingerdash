import { tick } from 'svelte';
import { writable } from 'svelte/store';
import { PAGES, ROUTES, pageForRoute, type Route } from '../config/pages';

export type { Route };

export const ROUTE_LABELS = Object.fromEntries(PAGES.map((p) => [p.route, p.label])) as Record<
  Route,
  string
>;

/** The URL path of a page, e.g. /about/. The site is served from the domain root. */
export function hrefFor(route: Route): string {
  return `/${pageForRoute(route).path}`;
}

/**
 * Which page a URL path belongs to. Unknown paths fall back to home.
 * Tolerates a missing trailing slash and index.html.
 */
export function routeFromPath(pathname: string): Route {
  const cleaned = pathname
    .replace(/^\/+/, '')
    .replace(/index\.html$/, '')
    .replace(/\/+$/, '');
  const page = PAGES.find((p) => p.path !== '' && p.path.replace(/\/$/, '') === cleaned);
  return page?.route ?? 'home';
}

/** Old hash URLs (#/about) map to a route so existing bookmarks keep working. */
export function legacyHashRoute(hash: string): Route | null {
  const name = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return ROUTES.find((route) => route !== 'home' && route === name) ?? null;
}

/** Whether a click on this link should be handled in-app instead of loading a new page. */
export function isInternalNavigation(
  anchor: Pick<HTMLAnchorElement, 'href' | 'target' | 'hasAttribute'>,
  origin: string,
): Route | null {
  if (anchor.hasAttribute('download')) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const route = routeFromPath(url.pathname);
  // Only exact page URLs count; anything else (an asset, a typo) loads normally.
  return hrefFor(route) === url.pathname ? route : null;
}

function createRouter() {
  const inBrowser = typeof window !== 'undefined';

  // Old bookmarks used #/about. Send them to the real URL (without adding a history entry)
  // before the first route is read.
  if (inBrowser) {
    const legacy = legacyHashRoute(location.hash);
    if (legacy) history.replaceState(null, '', hrefFor(legacy));
  }

  const { subscribe, set } = writable<Route>(inBrowser ? routeFromPath(location.pathname) : 'home');

  /** Remember how far this history entry was scrolled, so Back can return to the same spot. */
  function rememberScroll(): void {
    history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '');
  }

  /** Going to a page starts at the top of it. */
  function navigate(route: Route): void {
    if (inBrowser) {
      const target = hrefFor(route);
      if (location.pathname !== target) {
        rememberScroll();
        history.pushState(null, '', target);
      }
      window.scrollTo(0, 0);
    }
    set(route);
  }

  if (inBrowser) {
    // The browser's Back and Forward buttons restore the scroll position that page had,
    // once the page has rendered (the browser's own restore can run before that).
    window.addEventListener('popstate', (event: PopStateEvent) => {
      const saved = typeof event.state?.scrollY === 'number' ? event.state.scrollY : 0;
      set(routeFromPath(location.pathname));
      void tick().then(() => requestAnimationFrame(() => window.scrollTo(0, saved)));
    });

    // Turn ordinary link clicks into in-app navigation, so every link can be a real <a href>.
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;
      const route = isInternalNavigation(anchor, location.origin);
      if (route === null) return;
      event.preventDefault();
      navigate(route);
    });
  }

  return { subscribe, navigate };
}

export const router = createRouter();
