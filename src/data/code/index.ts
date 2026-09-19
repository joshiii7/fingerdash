import { pickAvoidingRepeat } from '../../lib/engine/pick';
import type { CodeLanguage } from './languages';

export { CODE_LANGUAGES, codeLanguageLabel, type CodeLanguage } from './languages';

export interface CodeSnippet {
  id: string;
  /** Two-or-more-line source, newline-separated, indented with spaces only. */
  code: string;
}

// One JSON file per language, fetched on demand. Vite turns each into its own
// chunk, so a visitor only downloads the language they pick.
const loaders = import.meta.glob<{ default: CodeSnippet[] }>('./*.json');
const cache = new Map<CodeLanguage, CodeSnippet[]>();

export async function loadSnippets(language: CodeLanguage): Promise<CodeSnippet[]> {
  const cached = cache.get(language);
  if (cached) return cached;
  const load = loaders[`./${language}.json`];
  if (!load) throw new Error(`No code snippets for language "${language}"`);
  const snippets = (await load()).default;
  cache.set(language, snippets);
  return snippets;
}

/** A random snippet in the language, never the same one twice in a row. */
export async function pickSnippet(
  language: CodeLanguage,
  previousId: string | null,
  rng: () => number = Math.random,
): Promise<CodeSnippet> {
  return pickAvoidingRepeat(await loadSnippets(language), previousId, rng);
}
