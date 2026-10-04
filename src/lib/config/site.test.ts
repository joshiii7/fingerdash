import { describe, it, expect } from 'vitest';
import { buildContactEmail, DEFAULT_SITE_URL, ISSUES_URL, REPO_URL } from './site';

describe('site config', () => {
  it('serves the site from the domain root with a trailing slash', () => {
    expect(DEFAULT_SITE_URL).toBe('https://fingerdash.vercel.app/');
  });

  it('builds a well-formed contact address at runtime', () => {
    expect(buildContactEmail()).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  it('derives the issues link from the repo URL', () => {
    expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
  });
});
