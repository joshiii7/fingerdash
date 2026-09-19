import { writable, get } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';

export interface LessonScore {
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  date: string;
}

export interface TutorialProgressState {
  lessons: Record<string, LessonScore>;
}

const STORAGE_KEY = 'fingerdash:tutorial-progress';
const defaultState: TutorialProgressState = { lessons: {} };

function createTutorialProgressStore() {
  const initial = readStorage<TutorialProgressState>(STORAGE_KEY, defaultState);
  const { subscribe, update, set } = writable<TutorialProgressState>(initial);

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    reset() {
      set(defaultState);
    },
    getLesson(lessonId: string): LessonScore | null {
      return get({ subscribe }).lessons[lessonId] ?? null;
    },
    /** Records an attempt; marks the lesson complete if it passed the thresholds. */
    recordAttempt(lessonId: string, wpm: number, accuracy: number, passed: boolean): void {
      update((state) => {
        const previous = state.lessons[lessonId];
        const bestWpm = Math.max(previous?.bestWpm ?? 0, wpm);
        const bestAccuracy = Math.max(previous?.bestAccuracy ?? 0, accuracy);
        return {
          lessons: {
            ...state.lessons,
            [lessonId]: {
              completed: previous?.completed || passed,
              bestWpm,
              bestAccuracy,
              date: new Date().toISOString(),
            },
          },
        };
      });
    },
  };
}

export const tutorialProgress = createTutorialProgressStore();
