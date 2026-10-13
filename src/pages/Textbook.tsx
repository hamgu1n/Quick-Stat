import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";
import { COMPONENTS } from "@/lib/widgetRegistry";

type LessonModule = {
  default: React.ComponentType<{ components?: Record<string, React.ComponentType> }>;
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

const sorted = Object.values(lessons).sort((a, b) => {
  if (a.frontmatter.unit !== b.frontmatter.unit)
    return a.frontmatter.unit - b.frontmatter.unit;
  return a.frontmatter.chapter - b.frontmatter.chapter;
});

export default function Textbook() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const currentIndex = sorted.findIndex(l => l.frontmatter.slug === slug);
  const lesson = currentIndex >= 0 ? sorted[currentIndex] : null;

  // Default open on desktop, closed on mobile -- the sidebar becomes an
  // overlay drawer below the CSS breakpoint (see .toc-sidebar), so
  // defaulting it open there would cover the whole screen on first load.
  // Declared here (above the early return below) rather than down by the
  // lesson layout, since hooks can't be called conditionally -- the TOC
  // page returns before ever reaching a hook declared further down.
  const [tocOpen, setTocOpen] = useState(() =>
    typeof window === "undefined" || window.innerWidth > 860,
  );

  if (!lesson) {
    const byUnit = sorted.reduce<Record<number, typeof sorted>>(
      (acc, l) => {
        const u = l.frontmatter.unit;
        if (!acc[u]) acc[u] = [];
        acc[u].push(l);
        return acc;
      },
      {},
    );

    return (
      <div className="lesson-bank">
        <h1>Textbook</h1>
        <p className="textbook-byline">Written by Haytham R. Hlioui</p>
        {Object.entries(byUnit).map(([unit, unitLessons]) => (
          <div className="lesson-bank-unit" key={unit}>
            <h2>Unit {unit} - {unitNames[Number(unit)]}</h2>
            <ul>
              {unitLessons.map((l) => (
                <li key={l.frontmatter.slug}>
                  <Link to={`/textbook/${l.frontmatter.slug}`}>
                    {l.frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const next = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
  const Lesson = lesson.default;

  const byUnit = sorted.reduce<Record<number, typeof sorted>>((acc, l) => {
    const u = l.frontmatter.unit;
    if (!acc[u]) acc[u] = [];
    acc[u].push(l);
    return acc;
  }, {});

  return (
    <div className="lesson-layout">
      <aside className={`toc-sidebar${tocOpen ? "" : " toc-sidebar--collapsed"}`}>
        <button
          className="toc-toggle"
          onClick={() => setTocOpen(o => !o)}
          title={tocOpen ? "Collapse contents" : "Open contents"}
        >
          {tocOpen ? "✕" : "☰"}
        </button>

        {tocOpen && (
          <nav className="toc-nav">
            <Link to="/textbook" className="toc-home">All chapters</Link>
            {Object.entries(byUnit).map(([unit, unitLessons]) => (
              <div key={unit} className="toc-unit">
                <span className="toc-unit__label">Unit {unit}</span>
                <ul className="toc-unit__list">
                  {unitLessons.map(l => (
                    <li key={l.frontmatter.slug}>
                      <Link
                        to={`/textbook/${l.frontmatter.slug}`}
                        className={`toc-link${l.frontmatter.slug === slug ? " toc-link--active" : ""}`}
                      >
                        {l.frontmatter.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}
      </aside>

      <div className="lesson-prose">
        {/* Desktop gets the sidebar; on mobile that's hidden entirely (see
            .toc-sidebar's media query) and this dropdown takes over as the
            chapter picker instead, right at the top of the page. */}
        <label className="mobile-chapter-select">
          <span className="sr-only">Jump to chapter</span>
          <select
            value={slug}
            onChange={(e) => navigate(`/textbook/${e.target.value}`)}
          >
            {Object.entries(byUnit).map(([unit, unitLessons]) => (
              <optgroup key={unit} label={`Unit ${unit}: ${unitNames[Number(unit)]}`}>
                {unitLessons.map((l) => (
                  <option key={l.frontmatter.slug} value={l.frontmatter.slug}>
                    {l.frontmatter.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <Lesson components={COMPONENTS} />

        <nav className="chapter-nav chapter-nav--bottom">
          {prev ? (
            <Link to={`/textbook/${prev.frontmatter.slug}`} className="chapter-nav__prev">
              <span className="chapter-nav__label">← Previous</span>
              <span className="chapter-nav__title">{prev.frontmatter.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/textbook/${next.frontmatter.slug}`} className="chapter-nav__next">
              <span className="chapter-nav__label">Next →</span>
              <span className="chapter-nav__title">{next.frontmatter.title}</span>
            </Link>
          ) : <div />}
        </nav>
      </div>
    </div>
  );
}
