import type { ReactNode } from "react";
import { useSettingsStore } from "@/store/settingsStore";

type AdvancedProps = {
  /** Short name of the topic, shown on the badge and in the hidden-state note. */
  title?: string;
  /** For small pieces like a single Key Points bullet: no badge when shown. */
  compact?: boolean;
  children: ReactNode;
};

/**
 * Wraps textbook content that goes beyond the course syllabus.
 *
 * Usage in MDX (the blank lines are required so MDX parses the inside
 * as Markdown rather than plain text):
 *
 *   <Advanced title="Testing a correlation">
 *
 *   ### Some Subsection
 *   ...markdown, math, examples...
 *
 *   </Advanced>
 */
export function Advanced({ title, compact = false, children }: AdvancedProps) {
  const showAdvanced = useSettingsStore((s) => s.showAdvanced);

  // Hidden completely when advanced topics are off: no placeholder note, so
  // the lesson reads as if the material weren't there. (The switch lives in
  // the gear menu, and the About page explains it.)
  if (!showAdvanced) return null;

  return (
    <div className={`advanced${compact ? " advanced--compact" : ""}`}>
      {!compact && (
        <span className="advanced-badge">
          Beyond the course{title ? ` · ${title}` : ""}
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * Shown in place of a whole lesson marked `advanced: true` in its
 * frontmatter while advanced topics are turned off.
 */
export function AdvancedLessonNotice({ title }: { title: string }) {
  const setShowAdvanced = useSettingsStore((s) => s.setShowAdvanced);
  return (
    <div className="advanced-lesson-hidden">
      <span className="advanced-badge">Beyond the course</span>
      <h1>{title}</h1>
      <p>
        This section goes beyond the intro course, so it's hidden by default.
        You can turn advanced topics on here or any time from the gear menu.
      </p>
      <button type="button" onClick={() => setShowAdvanced(true)}>
        Show advanced topics
      </button>
    </div>
  );
}
