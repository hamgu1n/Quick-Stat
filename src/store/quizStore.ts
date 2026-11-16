import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A student's history on one Section Review quiz. */
export type QuizRecord = {
  /** Score on the most recent finished attempt. */
  last: number;
  /** Highest score on any finished attempt. */
  best: number;
  /** Number of questions in the quiz. */
  total: number;
  /** How many times the quiz has been finished. */
  attempts: number;
  /** When the last attempt was finished (ms since 1970). */
  finishedAt: number;
};

type QuizState = {
  results: Record<string, QuizRecord>;
  /** Saves a finished attempt for the lesson with this slug. */
  recordAttempt: (slug: string, score: number, total: number) => void;
};

/**
 * Section Review scores, saved in the browser (localStorage key
 * "quickstat-quiz-scores") so they're still there on the next visit.
 * Nothing leaves the student's device.
 */
export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      results: {},
      recordAttempt: (slug, score, total) =>
        set((state) => {
          const prev = state.results[slug];
          return {
            results: {
              ...state.results,
              [slug]: {
                last: score,
                best: Math.max(score, prev?.best ?? 0),
                total,
                attempts: (prev?.attempts ?? 0) + 1,
                finishedAt: Date.now(),
              },
            },
          };
        }),
    }),
    { name: "quickstat-quiz-scores" },
  ),
);
