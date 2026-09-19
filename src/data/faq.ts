/**
 * The homepage FAQ. This one list renders the visible accordion and the FAQPage
 * JSON-LD, so what people read and what search engines read always match. Answers are
 * plain text (schema.org needs text), and each was checked against how the app works.
 */
import { CODE_LANGUAGES } from './code/languages.ts';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** "PHP, JavaScript, and C#" style list, from the languages the app really offers. */
function listWithAnd(items: readonly string[]): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const CODE_LANGUAGE_LIST = listWithAnd(CODE_LANGUAGES.map((language) => language.label));

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'what-is-fingerdash',
    question: 'What is Fingerdash?',
    answer:
      'Fingerdash is a free typing tutorial and typing speed test that runs in your browser. Learn touch typing with guided lessons that show which finger to use, then test your speed and accuracy.',
  },
  {
    id: 'account',
    question: 'Do I need an account?',
    answer: "No. There's nothing to sign up for or log in to.",
  },
  {
    id: 'progress-saved',
    question: 'Where is my progress saved?',
    answer:
      'In your browser\'s local storage, on your own device. Nothing is sent to a server. Clearing your browser data, or switching to a different browser or device, resets it. The Privacy page has a "Clear my data" button.',
  },
  {
    id: 'speed-calculation',
    question: 'How is my speed calculated?',
    answer:
      'Your speed in words per minute (WPM) is the number of correct characters divided by 5, divided by the minutes elapsed. Raw WPM counts every character you have typed, correct or not. Accuracy is the share of your typed characters that are correct. Characters you delete and retype are not counted against you, so accuracy reflects what is left on screen.',
  },
  {
    id: 'test-modes',
    question: 'What test modes are there?',
    answer: `Time, words, quote, custom text, and code (${CODE_LANGUAGE_LIST}). Time and words tests also have punctuation and numbers options.`,
  },
  {
    id: 'custom-text',
    question: 'Can I practice my own text?',
    answer:
      'Yes. Choose custom mode, press Change, and type or paste your text. It is tidied so every character can be typed on a US keyboard, and it is saved in your browser for next time.',
  },
  {
    id: 'keyboard',
    question: 'Do I need a special keyboard?',
    answer:
      "No special keyboard is needed, but Fingerdash is designed for a physical keyboard. Phones and tablets that only have an on-screen keyboard generally can't run a test.",
  },
  {
    id: 'free-open-source',
    question: 'Is Fingerdash free and open source?',
    answer: "Yes. It's free to use, and its source code is public on GitHub.",
  },
];
