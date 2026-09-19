import { describe, it, expect } from 'vitest';
import { buildContactEmail, ISSUES_URL, REPO_URL } from './site';

describe('site config', () => {
  it('builds a well-formed contact address at runtime', () => {
    expect(buildContactEmail()).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  it('derives the issues link from the repo URL', () => {
    expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
  });
});
