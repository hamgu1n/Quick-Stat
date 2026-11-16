import { Fragment, useMemo } from "react";
import katex from "katex";
import { annotateTex, KATEX_SPEECH_OPTIONS } from "@/lib/mathSpeech";

type MathTextProps = {
  text: string;
};

// Splits a string into its math, bold, and plain-text pieces:
// $$display$$, $inline$, **bold**, and \$ for a literal dollar sign.
const TOKEN = /(\\\$|\$\$[\s\S]+?\$\$|\$[^$]+?\$|\*\*[^*]+?\*\*)/g;

function renderMath(tex: string, displayMode: boolean) {
  // annotateTex adds the pronunciation labels shown by MathTooltip.
  // throwOnError: false shows bad LaTeX in red instead of crashing the page.
  return katex.renderToString(annotateTex(tex), { ...KATEX_SPEECH_OPTIONS, displayMode, throwOnError: false });
}

/**
 * Renders a short string that may contain KaTeX math, the same `$...$`
 * syntax the lessons use. Used for quiz questions, choices, and headings
 * outside the MDX pipeline.
 */
export function MathText({ text }: MathTextProps) {
  const parts = useMemo(() => text.split(TOKEN).filter(Boolean), [text]);

  return (
    <>
      {parts.map((part, i) => {
        if (part === "\\$") return <Fragment key={i}>$</Fragment>;
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return (
            <span
              key={i}
              className="math-display"
              dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return (
            <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(part.slice(1, -1), false) }} />
          );
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
