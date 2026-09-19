/**
 * Every public page in one typed place: its URL, its search/social metadata, and
 * the kind of structured data it carries. The app's router, the build-time
 * prerenderer, the sitemap, and the tests all read this file.
 */

export type Route = 'home' | 'test' | 'tutorial' | 'about' | 'accessibility' | 'privacy';

/** Which JSON-LD the page carries. */
export type SchemaKind = 'home' | 'webpage' | 'about';

export interface PageConfig {
  route: Route;
  /** Path under the site base, with a trailing slash. Empty for the home page. */
  path: string;
  /** Short name for navigation, breadcrumbs, and the browser tab. */
  label: string;
  /** Unique <title>. */
  title: string;
  /** Unique meta description, 150 to 160 characters. */
  description: string;
  schema: SchemaKind;
}

export const PAGES: readonly PageConfig[] = [
  {
    route: 'home',
    path: '',
    label: 'Home',
    title: 'Fingerdash | Free Touch-Typing Tutorial and Typing Test',
    description:
      'Fingerdash is a free touch-typing tutorial and typing test that runs in your browser. Learn every key, then test your speed. No accounts and no tracking.',
    schema: 'home',
  },
  {
    route: 'tutorial',
    path: 'tutorial/',
    label: 'Tutorial',
    title: 'Fingerdash Tutorial | Learn Touch Typing Key by Key',
    description:
      'Learn touch typing one row at a time, from the home row to numbers and punctuation. An on-screen keyboard and hands guide show which finger presses each key.',
    schema: 'webpage',
  },
  {
    route: 'test',
    path: 'test/',
    label: 'Test',
    title: 'Fingerdash Typing Test | Time, Words, Quotes and Code',
    description:
      'Test your typing speed with timed and word-count tests, quotes, your own custom text, or code in nine languages. See your WPM, accuracy and consistency.',
    schema: 'webpage',
  },
  {
    route: 'about',
    path: 'about/',
    label: 'About',
    title: 'About Fingerdash | Free, Open-Source Typing Practice',
    description:
      'Fingerdash is a free, open-source typing tutorial and test made by a typist. Learn why it was built, how it works, and how to report a bug or contribute.',
    schema: 'about',
  },
  {
    route: 'accessibility',
    path: 'accessibility/',
    label: 'Accessibility',
    title: 'Fingerdash Accessibility | Keyboard Support and Limits',
    description:
      'How Fingerdash supports keyboard use, visible focus, readable contrast and reduced motion, plus its known limitations and how to report an accessibility issue.',
    schema: 'webpage',
  },
  {
    route: 'privacy',
    path: 'privacy/',
    label: 'Privacy',
    title: 'Fingerdash Privacy | No Accounts, No Tracking',
    description:
      'Fingerdash has no accounts, no analytics and no tracking. Your settings and personal bests stay in your own browser, and you can clear them at any time.',
    schema: 'webpage',
  },
];

export function pageForRoute(route: Route): PageConfig {
  const page = PAGES.find((p) => p.route === route);
  if (!page) throw new Error(`No page config for route "${route}"`);
  return page;
}

export const ROUTES: readonly Route[] = PAGES.map((p) => p.route);
