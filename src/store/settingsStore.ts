import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Reader preferences that apply across the whole site.
 *
 * `persist` saves the state to localStorage under "quickstat-settings",
 * so a student's choice survives page reloads and return visits. If
 * storage is unavailable (private browsing, blocked site data), the
 * middleware falls back to the in-memory defaults below.
 */
type SettingsState = {
  /**
   * When false, content wrapped in <Advanced> in the textbook (topics that
   * go beyond the HNRS 240 syllabus) is hidden and replaced by a short note.
   */
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  /** When true, the Section Review page shows the lesson next to the quiz. */
  reviewSideBySide: boolean;
  setReviewSideBySide: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showAdvanced: false,
      setShowAdvanced: (value) => set({ showAdvanced: value }),
      reviewSideBySide: false,
      setReviewSideBySide: (value) => set({ reviewSideBySide: value }),
    }),
    { name: "quickstat-settings" },
  ),
);
