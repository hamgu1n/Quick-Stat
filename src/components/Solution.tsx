import { useId, useState, type ReactNode } from "react";

type SolutionProps = {
  children: ReactNode;
};

/**
 * A collapsible worked answer placed at the bottom of an example box.
 *
 * Usage in MDX (blank lines inside the tags are required so the contents
 * are parsed as Markdown, which lets answers use math and lists):
 *
 *   <div className="example">
 *   **Example 3.1.1 – ...**
 *   ...the problem...
 *
 *   <Solution>
 *
 *   ...the worked answer...
 *
 *   </Solution>
 *   </div>
 */
export function Solution({ children }: SolutionProps) {
  const [open, setOpen] = useState(false);
  // useId gives each answer a unique id so the button can point to the
  // region it controls (aria-controls), which screen readers announce.
  const id = useId();

  return (
    <div className="solution">
      <button
        type="button"
        className="solution-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
      >
        {open ? "Hide answer" : "Show answer"}
      </button>
      {open && (
        <div id={id} className="solution-body">
          {children}
        </div>
      )}
    </div>
  );
}
