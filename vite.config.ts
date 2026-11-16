import { defineConfig, type Plugin } from "vite";
import fs from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import mdx from "@mdx-js/rollup";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import { extractHeadings, remarkHeadingIds, type LessonHeading } from "./src/lib/headingIds.ts";
import { KATEX_SPEECH_OPTIONS, remarkMathSpeech } from "./src/lib/mathSpeech.ts";

const LESSONS_DIR = path.resolve(__dirname, "src/content/lessons");

/**
 * Provides `virtual:lesson-headings`, a small generated module mapping each
 * lesson's slug to its headings ({ id, title, depth }). The Section Review
 * quiz imports it to name the part of the lesson a student should reread,
 * without loading the whole lesson.
 */
function lessonHeadings(): Plugin {
  const publicId = "virtual:lesson-headings";
  const resolvedId = "\0" + publicId;
  return {
    name: "lesson-headings",
    resolveId(id) {
      if (id === publicId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      const map: Record<string, LessonHeading[]> = {};
      for (const file of fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".mdx"))) {
        const full = path.join(LESSONS_DIR, file);
        this.addWatchFile(full);
        const source = fs.readFileSync(full, "utf8");
        const slug = source.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m)?.[1];
        if (slug) map[slug] = extractHeadings(source);
      }
      return `export default ${JSON.stringify(map)};`;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/Quick-Stat/",
  plugins: [
    mdx({
      // remarkGfm adds GitHub-flavored markdown table support -- without
      // it, pipe-table syntax (`| a | b |`) isn't recognized as a table at
      // all and gets flattened into one squished paragraph instead.
      // remarkHeadingIds gives each ##/### heading an id so the quiz can
      // link to it (see src/lib/headingIds.ts).
      // remarkMathSpeech labels math symbols with how to say them (hover
      // tooltips; see src/lib/mathSpeech.ts).
      remarkPlugins: [remarkGfm, remarkMath, remarkFrontmatter, remarkMdxFrontmatter, remarkHeadingIds, remarkMathSpeech],
      rehypePlugins: [[rehypeKatex, KATEX_SPEECH_OPTIONS]],
    }),
    react(),
    tailwindcss(),
    lessonHeadings(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
