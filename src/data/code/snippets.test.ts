import { describe, it, expect } from 'vitest';
import { CODE_LANGUAGES, codeLanguageLabel, loadSnippets, pickSnippet } from './index';
import { TypingEngine } from '../../lib/engine/typingEngine';
import { generateCodeChallenge } from '../../lib/engine/challenge';

/** Types text the way a user does: Enter for newlines. Returns the engine. */
function typeAll(code: string, skipIndent: boolean, typed: string): TypingEngine {
  const engine = new TypingEngine(generateCodeChallenge(code, skipIndent));
  let t = 0;
  for (const ch of typed) {
    engine.handleKey(ch === '\n' ? 'Enter' : ch, t);
    t += 50;
  }
  return engine;
}

describe('code snippet files', () => {
  it('covers PHP, JavaScript, Python, Java, HTML, CSS, C++, C, and C#', () => {
    expect(CODE_LANGUAGES.map((l) => l.label)).toEqual([
      'PHP',
      'JavaScript',
      'Python',
      'Java',
      'HTML',
      'CSS',
      'C++',
      'C',
      'C#',
    ]);
  });

  for (const { id, label } of CODE_LANGUAGES) {
    describe(label, () => {
      it('has at least 15 snippets of 3 to 10 lines, in plain ASCII, indented with spaces', async () => {
        const snippets = await loadSnippets(id);
        expect(snippets.length).toBeGreaterThanOrEqual(15);
        const seen = new Set<string>();
        for (const { id: snippetId, code } of snippets) {
          const lines = code.split('\n');
          expect(lines.length, `${snippetId} line count`).toBeGreaterThanOrEqual(3);
          expect(lines.length, `${snippetId} line count`).toBeLessThanOrEqual(10);
          expect(code, `${snippetId} tab`).not.toMatch(/\t/);
          expect(code, `${snippetId} ascii`).toMatch(/^[\x20-\x7e\n]+$/);
          expect(code, `${snippetId} trailing newline`).toBe(code.trimEnd());
          expect(code, `${snippetId} leading blank`).not.toMatch(/^\s*\n/);
          for (const line of lines)
            expect(line, `${snippetId} trailing space`).toBe(line.trimEnd());
          expect(seen.has(snippetId), `${snippetId} duplicate id`).toBe(false);
          seen.add(snippetId);
        }
      });

      it('can be typed perfectly, with and without indentation skipping', async () => {
        for (const { id: snippetId, code } of await loadSnippets(id)) {
          const withoutIndent = code.replace(/\n +/g, '\n');
          const skipping = typeAll(code, true, withoutIndent);
          expect(skipping.isFinished(), `${snippetId} skip finished`).toBe(true);
          expect(skipping.getFinalStats().incorrectChars, `${snippetId} skip errors`).toBe(0);

          const typing = typeAll(code, false, code);
          expect(typing.isFinished(), `${snippetId} full finished`).toBe(true);
          expect(typing.getFinalStats().incorrectChars, `${snippetId} full errors`).toBe(0);
          expect(typing.getFinalStats().correctChars).toBe(code.length);
        }
      });
    });
  }

  it('together use every symbol the code mode has to handle', async () => {
    const all = (await Promise.all(CODE_LANGUAGES.map((l) => loadSnippets(l.id))))
      .flat()
      .map((s) => s.code)
      .join('\n');
    for (const symbol of [...'{}[]()<>;:"\'`$#&|\\/']) {
      expect(all.includes(symbol), `missing ${symbol}`).toBe(true);
    }
  });

  it('rejects an unknown language', async () => {
    // @ts-expect-error deliberately invalid
    await expect(loadSnippets('cobol')).rejects.toThrow(/No code snippets/);
  });
});

describe('pickSnippet', () => {
  it('never returns the previous snippet', async () => {
    const snippets = await loadSnippets('python');
    const previous = snippets[0].id;
    for (let i = 0; i < 50; i++) {
      expect((await pickSnippet('python', previous)).id).not.toBe(previous);
    }
  });
});

describe('codeLanguageLabel', () => {
  it('maps ids to display names', () => {
    expect(codeLanguageLabel('csharp')).toBe('C#');
    expect(codeLanguageLabel('cpp')).toBe('C++');
  });
});
