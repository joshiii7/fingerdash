// The code-mode languages. Pure data (no Vite features), so the build can count them too.

export const CODE_LANGUAGES = [
  { id: 'php', label: 'PHP' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#' },
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number]['id'];

export function codeLanguageLabel(language: CodeLanguage): string {
  return CODE_LANGUAGES.find((l) => l.id === language)?.label ?? language;
}
