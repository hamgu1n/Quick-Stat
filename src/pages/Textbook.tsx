import { Link, useParams } from "react-router-dom";
import React from "react";

type LessonModule = {
  default: React.ComponentType;
  frontmatter: {
    title: string;
    slug: string;
    unit: number;
    chapter: number;
  };
};

const lessons = import.meta.glob("../content/lessons/*.mdx", {
  eager: true,
}) as Record<string, LessonModule>;

const unitNames: Record<number, string> = {
  1: "Data Collection and Experimental Design",
  2: "Descriptive Statistics and Graphical Methods",
  3: "Probability and the Central Limit Theorem",
  4: "Statistical Inference",
  5: "Correlation and Regression",
};

export default function Textbook() {
  const { slug } = useParams();

  const lesson = Object.values(lessons).find(
    (lesson) => lesson.frontmatter.slug === slug,
  );

  if (!lesson) {
    const sorted = Object.values(lessons).sort((a, b) => {
      if (a.frontmatter.unit !== b.frontmatter.unit)
        return a.frontmatter.unit - b.frontmatter.unit;
      return a.frontmatter.chapter - b.frontmatter.chapter;
    });

    const byUnit = sorted.reduce<Record<number, typeof sorted>>(
      (acc, lesson) => {
        const u = lesson.frontmatter.unit;
        if (!acc[u]) acc[u] = [];
        acc[u].push(lesson);
        return acc;
      },
      {},
    );

    return (
      <div className="lesson-bank">
        <h1>Textbook</h1>
        {Object.entries(byUnit).map(([unit, unitLessons]) => (
          <div className="lesson-bank-unit" key={unit}>
            <h2>Unit {unit} — {unitNames[Number(unit)]}</h2>
            <ul>
              {unitLessons.map((lesson) => (
                <li key={lesson.frontmatter.slug}>
                  <Link to={`/textbook/${lesson.frontmatter.slug}`}>
                    {lesson.frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  const Lesson = lesson.default;

  return (
    <div className="lesson-prose">
      <Lesson />
    </div>
  );
}
