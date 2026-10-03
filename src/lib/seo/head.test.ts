import { describe, it, expect } from 'vitest';
import { PAGES, ROUTES, pageForRoute } from '../config/pages';
import { AUTHOR_NAME, unfilledPlaceholders } from '../config/site';
import { FAQ_ITEMS } from '../../data/faq';
import {
  SEO_END,
  SEO_START,
  absoluteUrl,
  build404,
  buildHead,
  buildJsonLd,
  buildRobots,
  buildSitemap,
  escapeHtml,
  injectHead,
  pageUrl,
  validateHeads,
  type SeoContext,
} from './head';

const ctx: SeoContext = {
  siteUrl: 'https://example.github.io/fingerdash/',
  ogImagePath: 'og-image.jpg',
  ogImageAlt: 'A dark keyboard with hands typing',
};

const heads = Object.fromEntries(PAGES.map((p) => [p.route, buildHead(p, ctx)]));

function jsonLd(head: string): Record<string, unknown>[] {
  return [...head.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );
}

describe('pages config', () => {
  it('lists the six public pages', () => {
    expect([...ROUTES].sort()).toEqual(
      ['about', 'accessibility', 'home', 'privacy', 'test', 'tutorial'].sort(),
    );
  });

  it('gives every page a unique title, description, and path', () => {
    for (const key of ['title', 'description', 'path'] as const) {
      const values = PAGES.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(PAGES.length);
    }
  });

  it('keeps each description between 150 and 160 characters', () => {
    for (const page of PAGES) {
      expect(page.description.length, page.route).toBeGreaterThanOrEqual(150);
      expect(page.description.length, page.route).toBeLessThanOrEqual(160);
    }
  });

  it('uses trailing-slash paths, empty only for home', () => {
    for (const page of PAGES) {
      if (page.route === 'home') expect(page.path).toBe('');
      else expect(page.path).toMatch(/^[a-z]+\/$/);
    }
  });

  it('looks pages up by route', () => {
    expect(pageForRoute('about').label).toBe('About');
  });
});

describe('absoluteUrl', () => {
  it('joins the site URL and a path without doubling slashes', () => {
    expect(absoluteUrl('https://x.io/app/', 'about/')).toBe('https://x.io/app/about/');
    expect(absoluteUrl('https://x.io/app', '/about/')).toBe('https://x.io/app/about/');
    expect(absoluteUrl('https://x.io/app/', '')).toBe('https://x.io/app/');
  });
});

describe('buildHead', () => {
  it('gives every page its own title, description, and canonical', () => {
    for (const page of PAGES) {
      const head = heads[page.route];
      expect(head).toContain(`<title>${escapeHtml(page.title)}</title>`);
      expect(head).toContain(
        `<meta name="description" content="${escapeHtml(page.description)}" />`,
      );
      expect(head).toContain(`<link rel="canonical" href="${pageUrl(page, ctx)}" />`);
    }
  });

  it('never shares a canonical between pages', () => {
    const canonicals = PAGES.map((p) => pageUrl(p, ctx));
    expect(new Set(canonicals).size).toBe(PAGES.length);
    expect(canonicals.every((c) => c.startsWith('https://example.github.io/fingerdash/'))).toBe(
      true,
    );
  });

  it('includes the author, Open Graph, and Twitter tags on every page', () => {
    for (const page of PAGES) {
      const head = heads[page.route];
      expect(head).toContain(`<meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />`);
      for (const p of [
        'og:type',
        'og:site_name',
        'og:title',
        'og:description',
        'og:url',
        'og:image',
        'og:image:alt',
        'og:locale',
      ]) {
        expect(head, `${page.route} ${p}`).toContain(`property="${p}"`);
      }
      expect(head).toContain('property="og:site_name" content="Fingerdash"');
      expect(head).toContain('name="twitter:card" content="summary_large_image"');
      expect(head).toContain(`content="https://example.github.io/fingerdash/og-image.jpg"`);
    }
  });

  it('mirrors the Open Graph title and description in the Twitter tags', () => {
    for (const page of PAGES) {
      const head = heads[page.route];
      expect(head).toContain(`name="twitter:title" content="${escapeHtml(page.title)}"`);
      expect(head).toContain(
        `name="twitter:description" content="${escapeHtml(page.description)}"`,
      );
    }
  });

  it('is wrapped in markers so it can be swapped per page', () => {
    for (const page of PAGES) {
      expect(heads[page.route].startsWith(SEO_START)).toBe(true);
      expect(heads[page.route].endsWith(SEO_END)).toBe(true);
    }
  });

  it('escapes HTML in attribute values', () => {
    expect(escapeHtml('a "b" & <c>')).toBe('a &quot;b&quot; &amp; &lt;c&gt;');
  });
});

describe('injectHead', () => {
  const template = `<head>\n    <meta charset="UTF-8" />\n    ${SEO_START}\n    <title>old</title>\n    ${SEO_END}\n    <link rel="icon" href="/f.ico" />\n  </head>`;

  it('swaps the marked block and leaves the rest of the head alone', () => {
    const out = injectHead(template, pageForRoute('about'), ctx);
    expect(out).toContain('<title>About Fingerdash');
    expect(out).not.toContain('<title>old</title>');
    expect(out).toContain('<meta charset="UTF-8" />');
    expect(out).toContain('<link rel="icon" href="/f.ico" />');
  });

  it('refuses a template without markers', () => {
    expect(() => injectHead('<head></head>', pageForRoute('home'), ctx)).toThrow(/SEO markers/);
  });
});

describe('JSON-LD', () => {
  it('gives the home page a WebSite and a free EducationalApplication WebApplication', () => {
    const nodes = jsonLd(heads.home);
    const types = nodes.map((n) => n['@type']);
    expect(types).toEqual(['WebSite', 'WebApplication', 'FAQPage']);
    const app = nodes[1] as Record<string, unknown>;
    expect(app.applicationCategory).toBe('EducationalApplication');
    expect(app.operatingSystem).toBe('Any');
    expect(app.offers).toMatchObject({ '@type': 'Offer', price: '0' });
    expect(app.url).toBe('https://example.github.io/fingerdash/');
  });

  it('gives inner pages a WebPage (AboutPage for About) and a BreadcrumbList', () => {
    for (const route of ['test', 'tutorial', 'about', 'accessibility', 'privacy'] as const) {
      const nodes = jsonLd(heads[route]);
      expect(nodes[0]['@type'], route).toBe(route === 'about' ? 'AboutPage' : 'WebPage');
      expect(nodes[1]['@type'], route).toBe('BreadcrumbList');
    }
  });

  it('builds a two-step breadcrumb ending at the page itself', () => {
    const crumb = jsonLd(heads.privacy)[1] as {
      itemListElement: { name: string; item: string; position: number }[];
    };
    expect(crumb.itemListElement.map((i) => i.name)).toEqual(['Home', 'Privacy']);
    expect(crumb.itemListElement[1].item).toBe('https://example.github.io/fingerdash/privacy/');
    expect(crumb.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it('names the author on the About page as a Person linked to their GitHub profile', () => {
    const about = jsonLd(heads.about)[0] as {
      author: { '@type': string; name: string; sameAs: string[] };
    };
    expect(about.author['@type']).toBe('Person');
    expect(about.author.name).toBe('Joshi Angelo Z. Adlawan');
    expect(about.author.name).toBe(AUTHOR_NAME);
    expect(about.author.sameAs).toEqual(['https://github.com/joshiii7']);
  });

  it('builds the home FAQPage from the same data as the visible FAQ', () => {
    const faq = jsonLd(heads.home)[2] as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity).toHaveLength(FAQ_ITEMS.length);
    FAQ_ITEMS.forEach((item, i) => {
      expect(faq.mainEntity[i].name).toBe(item.question);
      expect(faq.mainEntity[i].acceptedAnswer.text).toBe(item.answer);
    });
  });

  it('has no Home breadcrumb, and no invented ratings, reviews, or contact details', () => {
    for (const page of PAGES) {
      const text = JSON.stringify(buildJsonLd(page, ctx));
      for (const banned of [
        'aggregateRating',
        'review',
        'telephone',
        'address',
        'email',
        'ratingValue',
      ]) {
        expect(text, `${page.route} ${banned}`).not.toContain(banned);
      }
    }
    expect(jsonLd(heads.home).some((n) => n['@type'] === 'BreadcrumbList')).toBe(false);
  });

  it('cannot end the script tag early', () => {
    for (const page of PAGES) {
      const scripts = [
        ...heads[page.route].matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g),
      ];
      for (const script of scripts) expect(script[1]).not.toContain('<');
    }
  });
});

describe('sitemap and robots', () => {
  const sitemap = buildSitemap(ctx, '2026-09-19');

  it('lists every page with an absolute URL and a lastmod', () => {
    for (const page of PAGES) expect(sitemap).toContain(`<loc>${pageUrl(page, ctx)}</loc>`);
    expect(sitemap.match(/<lastmod>2026-09-19<\/lastmod>/g)).toHaveLength(PAGES.length);
    expect(sitemap).toContain('<loc>https://example.github.io/fingerdash/</loc>');
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it('points robots.txt at the sitemap and allows everything', () => {
    const robots = buildRobots(ctx);
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://example.github.io/fingerdash/sitemap.xml');
    expect(robots).not.toContain('Disallow');
  });
});

describe('build404', () => {
  it('sends visitors to the home page under the base path, with and without JavaScript', () => {
    const html = build404('/fingerdash/');
    expect(html).toContain('location.replace("/fingerdash/")');
    expect(html).toContain('http-equiv="refresh" content="0; url=/fingerdash/"');
    expect(html).toContain('href="/fingerdash/"');
    expect(html).toContain('noindex');
  });

  it('normalizes a base path without a trailing slash', () => {
    expect(build404('/app')).toContain('location.replace("/app/")');
  });
});

describe('validateHeads', () => {
  it('finds nothing wrong with correct output', () => {
    expect(validateHeads(heads, ctx)).toEqual([]);
  });

  it('catches two pages sharing a canonical', () => {
    const broken = {
      ...heads,
      privacy: heads.privacy.replace(
        pageUrl(pageForRoute('privacy'), ctx),
        pageUrl(pageForRoute('about'), ctx),
      ),
    };
    const problems = validateHeads(broken, ctx);
    expect(problems.some((p) => p.includes('canonical'))).toBe(true);
  });

  it('catches a page with a missing head or missing tags', () => {
    expect(validateHeads({ ...heads, test: '' }, ctx).some((p) => p.startsWith('test:'))).toBe(
      true,
    );
    const noOg = { ...heads, about: heads.about.replace(/<meta property="og:image"[^>]*>/, '') };
    expect(validateHeads(noOg, ctx)).toContain('about: missing og:image');
  });

  it('catches invalid JSON-LD', () => {
    const broken = { ...heads, home: heads.home.replace('"@type":"WebSite"', '"@type":WebSite') };
    expect(validateHeads(broken, ctx)).toContain('home: invalid JSON-LD');
  });
});

describe('unfilledPlaceholders', () => {
  it('reports the site URL until it is set, but not the filled-in author and portfolio', () => {
    const list = unfilledPlaceholders('https://TODO-set-site-url.example/fingerdash/');
    expect(list.join(' ')).not.toContain('AUTHOR_NAME');
    expect(list.join(' ')).not.toContain('PORTFOLIO_URL');
    expect(list.join(' ')).toContain('site URL');
  });

  it('does not report the site URL once a real one is given', () => {
    const list = unfilledPlaceholders('https://example.github.io/fingerdash/');
    expect(list.join(' ')).not.toContain('site URL');
  });
});
