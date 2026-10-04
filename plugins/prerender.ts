/**
 * Build-time prerendering for a static host that serves one file per URL.
 *
 * The app is a single-page app, so `vite build` produces one index.html. After
 * the build this plugin writes a copy for every page (dist/about/index.html and
 * so on) whose static <head> carries that page's own title, description,
 * canonical, Open Graph, Twitter, and JSON-LD tags, so a direct load or a crawler
 * sees the right metadata without running any JavaScript. It also writes
 * sitemap.xml, robots.txt, and 404.html, and fails the build if any page's head
 * is wrong or two pages share a canonical.
 *
 * In dev it injects the matching head into the page being served.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { PAGES, type PageConfig } from '../src/lib/config/pages.ts';
import { DEFAULT_SITE_URL, unfilledPlaceholders } from '../src/lib/config/site.ts';
import {
  SEO_END,
  SEO_START,
  build404,
  buildHead,
  buildRobots,
  buildSitemap,
  injectHead,
  validateHeads,
  type SeoContext,
} from '../src/lib/seo/head.ts';
import { injectNoscript, validateNoscript } from '../src/lib/seo/noscript.ts';

export interface PrerenderOptions {
  /** Absolute public site URL. Defaults to the SITE_URL environment variable, then a marked TODO. */
  siteUrl?: string;
  ogImagePath?: string;
  ogImageAlt?: string;
}

function withTrailingSlash(url: string): string {
  return url.replace(/\/*$/, '/');
}

function extractHead(html: string): string {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1) return '';
  return html.slice(start, end + SEO_END.length);
}

/** Finds the page for a request path such as /about/. */
function pageForRequest(path: string): PageConfig {
  const relative = path.split('?')[0].replace(/^\/+/, '');
  return PAGES.find((p) => p.path !== '' && relative.startsWith(p.path)) ?? PAGES[0];
}

export function prerender(options: PrerenderOptions = {}): Plugin {
  let config: ResolvedConfig;

  const seo = (): SeoContext => ({
    siteUrl: withTrailingSlash(options.siteUrl || process.env.SITE_URL || DEFAULT_SITE_URL),
    ogImagePath: options.ogImagePath ?? 'og-image.jpg',
    ogImageAlt:
      options.ogImageAlt ?? 'A dark desk with hands typing on a keyboard, with the Fingerdash logo',
  });

  return {
    name: 'fingerdash-prerender',

    configResolved(resolved) {
      config = resolved;
    },

    transformIndexHtml(html, context) {
      const request = context.originalUrl ?? context.path;
      const page = config.command === 'serve' ? pageForRequest(request) : PAGES[0];
      return injectNoscript(injectHead(html, page, seo()), page);
    },

    closeBundle() {
      if (config.command !== 'build') return;
      const ctx = seo();
      const outDir = resolve(config.root, config.build.outDir);
      const template = readFileSync(join(outDir, 'index.html'), 'utf8');

      const written: Record<string, string> = {};
      for (const page of PAGES) {
        const html = injectNoscript(injectHead(template, page, ctx), page);
        const dir = page.path ? join(outDir, page.path) : outDir;
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), html);
        written[page.route] = buildHead(page, ctx);
      }

      // Read every page back from disk and check what was actually written.
      const onDisk: Record<string, string> = {};
      const fullHtml: Record<string, string> = {};
      for (const page of PAGES) {
        const file = join(page.path ? join(outDir, page.path) : outDir, 'index.html');
        fullHtml[page.route] = readFileSync(file, 'utf8');
        onDisk[page.route] = extractHead(fullHtml[page.route]);
      }
      const problems = [...validateHeads(onDisk, ctx), ...validateNoscript(fullHtml)];
      if (problems.length > 0) {
        throw new Error(`Prerender check failed:\n  ${problems.join('\n  ')}`);
      }

      const lastmod = new Date().toISOString().slice(0, 10);
      writeFileSync(join(outDir, 'sitemap.xml'), buildSitemap(ctx, lastmod));
      writeFileSync(join(outDir, 'robots.txt'), buildRobots(ctx));
      writeFileSync(join(outDir, '404.html'), build404());

      config.logger.info(
        `prerender: wrote ${PAGES.length} pages, sitemap.xml, robots.txt, and 404.html for ${ctx.siteUrl}`,
      );
      const missing = unfilledPlaceholders(ctx.siteUrl);
      if (missing.length > 0) {
        config.logger.warn(
          `prerender: placeholders still unfilled (TODO before publishing):\n  - ${missing.join('\n  - ')}`,
        );
      }
    },
  };
}
