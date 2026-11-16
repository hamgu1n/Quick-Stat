import type { ReactNode } from "react";
import { useSettingsStore } from "@/store/settingsStore";

type AdvancedProps = {
  /** Short name of the topic, shown on the badge and in the hidden-state note. */
  title?: string;
  /**
   * For small pieces like a single Key Points bullet: render nothing at all
   * when hidden (instead of a placeholder note) so summary lists stay clean.
   */
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
  const setShowAdvanced = useSettingsStore((s) => s.setShowAdvanced);

  if (!showAdvanced) {
    if (compact) return null;
    return (
      <p className="advanced-hidden">
        <span>
          Advanced topic hidden{title ? `: ${title}` : ""}.
        </span>
        <button type="button" onClick={() => setShowAdvanced(true)}>
          Show advanced topics
        </button>
      </p>
    );
  }

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
