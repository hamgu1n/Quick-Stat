# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: Intro Stats Web App

## Stack

- React 19 + TypeScript 6 + Vite 8
- shadcn/ui with radix-ui (component library)
- React Router v7 (`BrowserRouter` + `Routes`)
- Zustand v5 (state management)
- WebR v0.5 (R compiled to WASM, runs in browser)
- Tailwind v4 (no `tailwind.config.js` — uses `@tailwindcss/vite` plugin)

---

## Commands

```bash
npm run dev      # start dev server
npm run build    # type-check + production build
npm run lint     # ESLint
```

---

## Architecture

### Routing

`src/main.tsx` wraps the app in `<BrowserRouter>`. Routes are defined in `src/App.tsx`:

- `/analyzer` → `src/pages/Analyzer.tsx`
- `/textbook` → `src/pages/Textbook.tsx`

### Data flow (Analyzer)

`Analyzer` owns `dataset` state (`Dataset | null`). It passes `setDataset` down to `CsvUpload` as `onDatasetLoad`, and passes `dataset` to `DataTable`. State never goes through Zustand for the CSV flow — `datasetStore.ts` exists but is currently unused.

### Key types

`src/types/dataset.ts`:

```ts
type Dataset = { headers: string[]; rows: string[][] };
```

### WebR

`src/lib/webr.ts` exports a singleton `webR` instance and an `initPromise`. COOP/COEP headers are required in `vite.config.ts` for WebR's SharedArrayBuffer usage — do not remove them.

### Tailwind / shadcn

Tailwind v4 is configured entirely in `src/index.css` (no config file). shadcn components live in `src/components/ui/`. The `cn()` utility is in `src/lib/utils.ts`.

### Textbook (MDX)

The textbook content is fully written and implemented using MDX. The remaining work is embedding interactive R snippet widgets into each chapter. Do not rewrite or restructure chapter content — only add interactive components to existing MDX files.

### Interactive Widget Pattern

Textbook widgets and the Analyzer follow the same architectural pattern:

- **R does the math** — WebR runs statistical computation (`rnorm`, `t.test`, `lm`, etc.)
- **JavaScript does the display** — Recharts (or similar) renders the visualization
- **No RShiny** — everything runs in the browser, no server needed

Each textbook widget is a self-contained React component with:
1. Sliders for parameters (e.g. mean, SD, n)
2. A JavaScript chart that re-renders as sliders move
3. A "Show R Code" button that reveals the equivalent R code a student could run in RStudio
4. The displayed R code is a **template string** — current slider values are interpolated into it, so it stays in sync with what's shown

Widget components live in `src/components/widgets/`. They are imported and used directly in MDX files — no generic `RSnippet` executor; each widget is purpose-built for its statistical concept.

### Analyzer / Stats Playground

The Analyzer page (`/analyzer`) is the Minitab-style data exploration tool. Students upload a CSV and run statistical tests and charts against their own data. It is the same conceptual thing as the "stats playground" — not a separate page. The `datasetStore.ts` Zustand store exists to share dataset state across the app once the Analyzer is expanded.

---

## Project Goals & Milestone Order

Work happens in roughly this order (evenings/weekends alongside an IT internship):

**Weeks 1–2 (by ~Jun 22)**

- Establish the reusable interactive R snippet component pattern
- Embed R snippets into Chapters 1–2

**Weeks 3–4 (by ~Jul 6)**

- Embed R snippets into Chapters 3–4
- Refine WebR integration as needed

**Weeks 5–6 (by ~Jul 20)**

- Embed R snippets into Chapters 5–6

**Weeks 7–8 (by ~Aug 3)**

- Build the Stats Playground MVP (user input → run R test → display output)

**Week 9 (by ~Aug 10)**

- Polish playground
- Finish any remaining chapters

**Week 10 (by ~Aug 17)**

- Dr. Childers review / feedback round

**Week 11 (by ~Aug 24)**

- Final revisions and submission

> The highest-leverage work is Weeks 1–2: getting the reusable component right means the rest is mostly content work.

---

## How I Want to Work

### Teach first, code second

Before installing anything, writing any code, or making any changes:

1. Explain _what_ we're about to do in plain English
2. Explain _why_ — what problem does it solve?
3. Explain _how_ it fits into the existing project
4. Then ask me if I'm ready to proceed

### Don't write code for me unless I ask

- Guide me toward the solution with hints and questions
- If I'm stuck, give me the next small nudge — not the full answer
- If I ask "how do I do X?", explain the concept and let me try first
- Only write full code if I say something like "go ahead" or "write it for me"

### Break everything into small steps

- One concept or action at a time
- After each step, check that I understand before moving on
- If something could go wrong, warn me before I do it

### Explain errors like a mentor

- When I hit an error, don't just fix it — explain what caused it
- Ask me what I think the problem might be before revealing the answer
- Help me build the habit of reading error messages myself

### Use plain language

- I'm learning as I go — avoid jargon without explanation
- If you use a technical term, define it the first time
- Analogies and real-world comparisons are welcome

---

## Project Conventions

- Path aliases are configured (`@/` maps to `src/`)
- Use named exports for components
- TypeScript strict mode is on — explain type decisions
- Component files live in `src/components/`
- Pages live in `src/pages/`

---

## What NOT to Do

- Don't run ahead and implement multiple things at once
- Don't assume I know what a tool or library does — explain it
- Don't skip the "why" — understanding matters more than speed
- Don't paste large code blocks without walking through them line by line
