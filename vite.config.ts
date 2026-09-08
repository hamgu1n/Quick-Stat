import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import mdx from "@mdx-js/rollup";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";

// https://vite.dev/config/
export default defineConfig({
  base: "/Quick-Stat/",
  plugins: [
    mdx({
      // remarkGfm adds GitHub-flavored markdown table support -- without
      // it, pipe-table syntax (`| a | b |`) isn't recognized as a table at
      // all and gets flattened into one squished paragraph instead.
      remarkPlugins: [remarkGfm, remarkMath, remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
