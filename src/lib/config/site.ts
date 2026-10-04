/** The author's GitHub profile. Every general "GitHub" link on the site points here. */
export const GITHUB_PROFILE_URL = 'https://github.com/joshiii7';

/** The author's Codewars profile. */
export const CODEWARS_URL = 'https://www.codewars.com/users/joshiii7';

/** The author's CodePen profile. */
export const CODEPEN_URL = 'https://codepen.io/joshiii7';

/** WhatsApp chat with the author (a wa.me link, so it opens WhatsApp or WhatsApp Web). */
export const WHATSAPP_URL = 'https://wa.me/639382943739';

/** The author's Facebook profile. */
export const FACEBOOK_URL = 'https://www.facebook.com/joshi.adlawan/';

/** The repository. Used only to build the Issues link, which has to point at the repo. */
export const REPO_URL = 'https://github.com/joshiii7/fingerdash';
export const ISSUES_URL = `${REPO_URL}/issues`;

// The contact address is stored in pieces and only joined at runtime, so it
// never appears as one contiguous string in the HTML or the JS bundle.
const CONTACT_USER = 'adlawanjoshiangelo';
const CONTACT_DOMAIN_PARTS = ['gmail', 'com'];

export function buildContactEmail(): string {
  return `${CONTACT_USER}@${CONTACT_DOMAIN_PARTS.join('.')}`;
}

export const SITE_NAME = 'Fingerdash';
export const SITE_LOCALE = 'en_US';
export const THEME_COLOR = '#0d1117';

// ---------------------------------------------------------------------------
// PLACEHOLDERS: fill these in before publishing. The build prints a warning
// listing any that are still unset (see unfilledPlaceholders below).
// ---------------------------------------------------------------------------

/** The author's name, used in <meta name="author">, the About page, and structured data. */
export const AUTHOR_NAME = 'Joshi Angelo Z. Adlawan';

/**
 * The public portfolio URL. It is the author's name link in the footer, the Portfolio link on the
 * About page, and the author's url in structured data. Leave empty to hide all three.
 */
export const PORTFOLIO_URL: string = 'https://joshiii7-portfolio.vercel.app/';

/**
 * The public site URL, ending in "/". Canonicals, Open Graph tags, JSON-LD, the sitemap, and
 * robots.txt are all built from it. To build for a different domain, set the SITE_URL environment
 * variable at build time instead of editing code.
 */
export const DEFAULT_SITE_URL = 'https://fingerdash.vercel.app/';

/** Which placeholders above are still unfilled, for the build-time warning. */
export function unfilledPlaceholders(siteUrl: string): string[] {
  const missing: string[] = [];
  if (AUTHOR_NAME.startsWith('TODO')) missing.push('AUTHOR_NAME (src/lib/config/site.ts)');
  if (PORTFOLIO_URL === '') missing.push('PORTFOLIO_URL (src/lib/config/site.ts)');
  if (siteUrl.includes('TODO')) missing.push('site URL (set the SITE_URL environment variable)');
  return missing;
}
