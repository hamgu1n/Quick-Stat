# Quick Stat

An interactive intro-stats web app: a full textbook with embedded interactive widgets (each with equivalent R code you could run yourself), a standalone gallery of those widgets, and a Minitab-style data analyzer — all running in the browser, no server required.

Deployed at `/Quick-Stat/` on GitHub Pages.

## Stack

- React 19 + TypeScript + Vite
- shadcn/ui with radix-ui
- React Router v7 (`HashRouter`)
- Recharts (chart rendering)
- Tailwind v4 (configured entirely in `src/index.css`, no config file)
- MDX (`@mdx-js/rollup`) with `remark-math` + `rehype-katex` for math, `remark-gfm` for tables, and `remark-mdx-frontmatter` for lesson metadata

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # ESLint
```

## What's in the app

### Textbook (`/textbook`)

11 chapters across 5 units, written in MDX (`src/content/lessons/`), from populations & sampling through regression diagnostics. Math renders via KaTeX; each chapter embeds one or more purpose-built interactive widgets (`src/components/widgets/`) — sliders drive a live chart, with a "Show R Code" toggle revealing the equivalent R a student could run in RStudio. No R actually executes in the browser: the computation is JS, styled to match R's output/plotting conventions.

### Applets (`/applets`)

Every textbook widget in one searchable gallery. Cards show a frozen preview (the real widget, non-interactive); clicking one opens it as an interactive modal above the page.

### Analyzer (`/analyzer`)

Upload a CSV and explore it across five tabs:

- **Data** — raw table with inferred column types
- **Summary** — per-column stats (mean, median, SD, mode, missing count, ...)
- **Stat** — run a statistical test (t-tests, z-test, ANOVA, chi-square, correlation, regression), with a recommendation banner suggesting tests that fit the dataset's shape, R-console-style output, and a result chart (distribution with rejection region, boxplot, or scatter + fit line)
- **Graph** — histogram, boxplot, grouped boxplot, scatterplot, line/trend, bar, and pie charts, with the best-fit chart type highlighted for the current dataset
- **Dashboard** — a live summary combining the dataset overview, summary stats, the currently-selected graph, and every test run this session

Every test and every graph has a "Show R Code" toggle with both base R and ggplot2 versions. A handful of sample datasets (`public/sample-data/`) are built in for trying it out without your own CSV.

## Architecture notes

- Path alias `@/` → `src/`
- `src/lib/testRunners.ts` computes test statistics; `src/lib/stats.ts` holds the underlying distribution math (pnorm/pt/pchisq/pf and their quantile inverses)
- `src/lib/columnStats.ts` infers column types and handles missing-value markers (blank, `NA`, `N/A`, etc.) consistently across the Analyzer
- `src/lib/widgetRegistry.ts` is the single source of truth for textbook widgets — used by both `Textbook.tsx` (resolving MDX component references) and `Applets.tsx` (the gallery)
