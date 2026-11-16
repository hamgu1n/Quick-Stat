/**
 * Heading IDs for the textbook.
 *
 * Every `##` and `###` heading in a lesson gets an `id` built from its text,
 * e.g. "### The Median" -> id="the-median". The quiz uses these IDs to send a
 * student straight to the part of the lesson they should reread.
 *
 * This file is used at build time (by vite.config.ts), so it can't use any
 * browser-only code or the `@/` path alias.
 */

/** Turns heading text into a URL-safe id: "The 68-95-99.7 Rule" -> "the-68-95-99-7-rule". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\\([a-z]+)/g, "$1") // LaTeX commands: "\sigma" -> "sigma"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** One heading in a lesson, as the quiz sees it. */
export type LessonHeading = { id: string; title: string; depth: number };

/** Gives repeated headings unique ids: "key-points", "key-points-1", ... */
function makeIdCounter() {
  const seen = new Map<string, number>();
  return (base: string) => {
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/**
 * Reads the `##`/`###` headings out of raw MDX source. Comment blocks
 * (`{/* ... *\/}`, where the hidden R code lives) are skipped so a `#` comment
 * in R isn't mistaken for a heading. Uses the same slugify and counting rules
 * as the remark plugin below, so the ids always match what's on the page.
 */
export function extractHeadings(source: string): LessonHeading[] {
  const withoutComments = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  const nextId = makeIdCounter();
  const headings: LessonHeading[] = [];
  for (const match of withoutComments.matchAll(/^(#{2,3})\s+(.+?)\s*$/gm)) {
    const title = match[2];
    headings.push({ id: nextId(slugify(title)), title, depth: match[1].length });
  }
  return headings;
}

// Just enough of the Markdown syntax tree shape for what we need here.
type MdNode = {
  type: string;
  value?: string;
  depth?: number;
  children?: MdNode[];
  data?: { hProperties?: Record<string, unknown> };
};

function plainText(node: MdNode): string {
  // Math nodes store their LaTeX without the dollar signs, which slugify
  // handles the same way as the "$...$" text extractHeadings sees.
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

/** Remark plugin: adds an `id` to every `##`/`###` heading. */
export function remarkHeadingIds() {
  return (tree: MdNode) => {
    const nextId = makeIdCounter();
    const visit = (node: MdNode) => {
      if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
        const id = nextId(slugify(plainText(node)));
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
