/**
 * Pure builders for everything the prerenderer writes into each page's static
 * <head>, plus the sitemap, robots.txt, and 404 page. Nothing here touches the
 * DOM or the file system, so it is all unit-tested. The Vite plugin
 * (plugins/prerender.ts) calls these at build time.
 */
import { PAGES, type PageConfig } from '../config/pages.ts';
import {
  AUTHOR_NAME,
  GITHUB_PROFILE_URL,
  PORTFOLIO_URL,
  SITE_LOCALE,
  SITE_NAME,
} from '../config/site.ts';
import { FAQ_ITEMS } from '../../data/faq.ts';

export interface SeoContext {
  /** Absolute site URL ending in "/", for example https://user.github.io/fingerdash/. */
  siteUrl: string;
  /** Social preview image, relative to the site root. */
  ogImagePath: string;
  ogImageAlt: string;
}

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const SEO_START = '<!--seo:start-->';
export const SEO_END = '<!--seo:end-->';

export function absoluteUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/*$/, '/')}${path.replace(/^\/+/, '')}`;
}

export function pageUrl(page: PageConfig, ctx: SeoContext): string {
  return absoluteUrl(ctx.siteUrl, page.path);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type JsonObject = Record<string, unknown>;

function websiteNode(ctx: SeoContext): JsonObject {
  return { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl(ctx.siteUrl, '') };
}

function breadcrumb(page: PageConfig, ctx: SeoContext): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(ctx.siteUrl, '') },
      { '@type': 'ListItem', position: 2, name: page.label, item: pageUrl(page, ctx) },
    ],
  };
}

/** Structured data for a page. Only facts that are true of the site: no ratings, reviews, or contact details. */
export function buildJsonLd(page: PageConfig, ctx: SeoContext): JsonObject[] {
  const url = pageUrl(page, ctx);
  const base = { '@context': 'https://schema.org' };

  if (page.schema === 'home') {
    return [
      { ...base, ...websiteNode(ctx), description: page.description, inLanguage: 'en' },
      {
        ...base,
        '@type': 'WebApplication',
        name: SITE_NAME,
        url,
        description: page.description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      // Built from the same list as the visible FAQ accordion, so they always match.
      {
        ...base,
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ];
  }

  const webPage: JsonObject = {
    ...base,
    '@type': page.schema === 'about' ? 'AboutPage' : 'WebPage',
    name: page.title,
    description: page.description,
    url,
    isPartOf: websiteNode(ctx),
  };

  if (page.schema === 'about') {
    webPage.author = {
      '@type': 'Person',
      name: AUTHOR_NAME,
      ...(PORTFOLIO_URL ? { url: PORTFOLIO_URL } : {}),
      sameAs: [GITHUB_PROFILE_URL],
    };
  }

  return [webPage, breadcrumb(page, ctx)];
}

/** Serializes JSON-LD safely for an inline <script> (no raw "<" that could end the tag early). */
function jsonLdScript(data: JsonObject): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/** The page-specific part of <head>, between the SEO markers. */
export function buildHead(page: PageConfig, ctx: SeoContext): string {
  const url = pageUrl(page, ctx);
  const image = absoluteUrl(ctx.siteUrl, ctx.ogImagePath);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const imageAlt = escapeHtml(ctx.ogImageAlt);

  const lines = [
    SEO_START,
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    ...buildJsonLd(page, ctx).map(jsonLdScript),
    SEO_END,
  ];
  return lines.join('\n    ');
}

/** Replaces the SEO block in a built index.html with this page's head tags. */
export function injectHead(html: string, page: PageConfig, ctx: SeoContext): string {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html has no SEO markers to replace');
  }
  return html.slice(0, start) + buildHead(page, ctx) + html.slice(end + SEO_END.length);
}

export function buildSitemap(ctx: SeoContext, lastmod: string, pages = PAGES): string {
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeHtml(pageUrl(page, ctx))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobots(ctx: SeoContext): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl(ctx.siteUrl, 'sitemap.xml')}\n`;
}

/** A static 404 that sends any unknown URL back to the home page. `base` is the site's base path. */
export function build404(base: string): string {
  const home = base.replace(/\/*$/, '/');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${home}" />
    <title>Page not found | ${SITE_NAME}</title>
    <script>
      location.replace(${JSON.stringify(home)});
    </script>
  </head>
  <body>
    <p>That page doesn't exist. <a href="${home}">Go to the ${SITE_NAME} home page</a>.</p>
  </body>
</html>
`;
}

function attr(head: string, pattern: RegExp): string | null {
  return head.match(pattern)?.[1] ?? null;
}

/**
 * Checks the generated heads: each page has its own title, description,
 * canonical, Open Graph, Twitter, and JSON-LD tags, and no two pages share a
 * title, description, or canonical. Returns a list of problems (empty when fine).
 */
export function validateHeads(
  heads: Record<string, string>,
  ctx: SeoContext,
  pages = PAGES,
): string[] {
  const problems: string[] = [];
  const seen = {
    title: new Map<string, string>(),
    description: new Map<string, string>(),
    canonical: new Map<string, string>(),
  };

  for (const page of pages) {
    const head = heads[page.route];
    const name = page.route;
    if (!head) {
      problems.push(`${name}: no head was generated`);
      continue;
    }
    const title = attr(head, /<title>([^<]*)<\/title>/);
    const description = attr(head, /<meta name="description" content="([^"]*)"/);
    const canonical = attr(head, /<link rel="canonical" href="([^"]*)"/);
    const expectedUrl = pageUrl(page, ctx);

    if (title !== escapeHtml(page.title)) problems.push(`${name}: wrong or missing <title>`);
    if (description !== escapeHtml(page.description))
      problems.push(`${name}: wrong or missing description`);
    if (canonical !== expectedUrl)
      problems.push(`${name}: canonical is ${canonical}, expected ${expectedUrl}`);

    for (const property of [
      'og:type',
      'og:site_name',
      'og:title',
      'og:description',
      'og:url',
      'og:image',
      'og:image:alt',
      'og:locale',
    ]) {
      if (!head.includes(`<meta property="${property}" content="`))
        problems.push(`${name}: missing ${property}`);
    }
    if (attr(head, /<meta property="og:url" content="([^"]*)"/) !== expectedUrl) {
      problems.push(`${name}: og:url does not match the canonical`);
    }
    for (const tag of [
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'twitter:image:alt',
    ]) {
      if (!head.includes(`<meta name="${tag}" content="`)) problems.push(`${name}: missing ${tag}`);
    }
    if (!head.includes('<meta name="author" content="')) problems.push(`${name}: missing author`);

    const scripts = [...head.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)];
    if (scripts.length === 0) problems.push(`${name}: no JSON-LD`);
    for (const script of scripts) {
      try {
        JSON.parse(script[1]);
      } catch {
        problems.push(`${name}: invalid JSON-LD`);
      }
    }

    for (const [key, value] of [
      ['title', title],
      ['description', description],
      ['canonical', canonical],
    ] as const) {
      if (value === null) continue;
      const earlier = seen[key].get(value);
      if (earlier) problems.push(`${name}: shares its ${key} with ${earlier}`);
      else seen[key].set(value, name);
    }
  }
  return problems;
}
