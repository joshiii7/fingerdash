/**
 * The static fallback written into every prerendered page for visitors and
 * crawlers that don't run JavaScript. Pure, like head.ts. The About page's
 * fallback carries the real figures from the "By the numbers" strip.
 */
import { PAGES, type PageConfig } from '../config/pages.ts';
import { SITE_STATS } from '../config/stats.ts';
import { SITE_NAME } from '../config/site.ts';
import { escapeHtml } from './head.ts';

export const NOSCRIPT_START = '<!--noscript:start-->';
export const NOSCRIPT_END = '<!--noscript:end-->';

/** "5 test modes", the way a stat reads as plain text. */
export function statText(stat: { value: number; label: string }): string {
  return `${stat.value} ${stat.label}`;
}

export function buildNoscript(page: PageConfig): string {
  const stats =
    page.route === 'about'
      ? `<ul>${SITE_STATS.map((s) => `<li>${escapeHtml(statText(s))}</li>`).join('')}</ul>`
      : '';
  return [
    NOSCRIPT_START,
    '<noscript>',
    `<h1>${escapeHtml(page.title)}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
    stats,
    `<p>${SITE_NAME} runs in your browser and needs JavaScript turned on to work.</p>`,
    '</noscript>',
    NOSCRIPT_END,
  ].join('');
}

/** Replaces the marked fallback block in a built index.html with this page's. */
export function injectNoscript(html: string, page: PageConfig): string {
  const start = html.indexOf(NOSCRIPT_START);
  const end = html.indexOf(NOSCRIPT_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html has no noscript markers to replace');
  }
  return html.slice(0, start) + buildNoscript(page) + html.slice(end + NOSCRIPT_END.length);
}

/** Checks the written pages: every page has a fallback, and About's shows every real figure. */
export function validateNoscript(htmlByRoute: Record<string, string>, pages = PAGES): string[] {
  const problems: string[] = [];
  for (const page of pages) {
    const html = htmlByRoute[page.route] ?? '';
    if (!html.includes('<noscript>')) problems.push(`${page.route}: no <noscript> fallback`);
    if (page.route === 'about') {
      for (const stat of SITE_STATS) {
        if (!html.includes(statText(stat))) {
          problems.push(`about: static HTML is missing "${statText(stat)}"`);
        }
      }
    }
  }
  return problems;
}
