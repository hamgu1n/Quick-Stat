import type React from "react";
import type { MDXComponents } from "mdx/types";
import { COMPONENTS } from "@/lib/widgetRegistry";
import { Advanced } from "@/components/Advanced";
import { Solution } from "@/components/Solution";
import { parseQuiz, type QuizQuestion } from "@/lib/quiz";

// Everything an MDX lesson can use as a tag: every registered widget, plus
// the <Advanced> wrapper for beyond-the-course content and the <Solution>
// answer toggle. Built once at module load so the object identity is stable
// across renders.
export const LESSON_COMPONENTS: MDXComponents = { ...COMPONENTS, Advanced, Solution };

export type LessonModule = {
  default: React.ComponentType<{ components?: MDXComponents }>;
  frontmatter: {
    title: string;
    slug: string;
    unit: number;
    chapter: number;
    /** True when the whole section goes beyond the course (hidden unless advanced topics are on). */
    advanced?: boolean;
  };
};

const lessons = import.meta.glob("../content/lessons/*.mdx", {
  eager: true,
}) as Record<string, LessonModule>;

export const unitNames: Record<number, string> = {
  1: "Data Collection and Experimental Design",
  2: "Descriptive Statistics and Graphical Methods",
  3: "Probability and the Central Limit Theorem",
  4: "Statistical Inference",
  5: "Correlation and Regression",
};

/** All lessons in reading order: by unit, then chapter, then file name. */
export const sortedLessons = Object.entries(lessons)
  .sort(([pathA, a], [pathB, b]) => {
    if (a.frontmatter.unit !== b.frontmatter.unit)
      return a.frontmatter.unit - b.frontmatter.unit;
    if (a.frontmatter.chapter !== b.frontmatter.chapter)
      return a.frontmatter.chapter - b.frontmatter.chapter;
    return pathA.localeCompare(pathB);
  })
  .map(([, lesson]) => lesson);

/**
 * The lessons a reader should see in chapter lists and Previous/Next links.
 * Lessons marked `advanced: true` only appear when advanced topics are on.
 */
export function visibleLessons(showAdvanced: boolean) {
  return showAdvanced ? sortedLessons : sortedLessons.filter((l) => !l.frontmatter.advanced);
}

/** Groups lessons by unit number, keeping reading order within each unit. */
export function lessonsByUnit(list: LessonModule[] = sortedLessons) {
  return list.reduce<Record<number, LessonModule[]>>((acc, l) => {
    const u = l.frontmatter.unit;
    if (!acc[u]) acc[u] = [];
    acc[u].push(l);
    return acc;
  }, {});
}

// Quiz files are plain text (see src/lib/quiz.ts), imported as raw strings.
const quizSources = import.meta.glob("../content/quizzes/*.txt", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** Section Review questions for each lesson, keyed by lesson slug. */
export const quizzes: Record<string, QuizQuestion[]> = Object.fromEntries(
  Object.entries(quizSources).map(([path, source]) => {
    const slug = path.split("/").pop()!.replace(/\.txt$/, "");
    return [slug, parseQuiz(source)];
  }),
);
