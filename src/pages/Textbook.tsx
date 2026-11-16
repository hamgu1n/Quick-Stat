import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookA, ClipboardCheck } from "lucide-react";
import {
  LESSON_COMPONENTS,
  lessonsByUnit,
  quizzes,
  sortedLessons as sorted,
  unitNames,
  visibleLessons,
} from "@/lib/lessons";
import { scrollToHeading } from "@/lib/scrollToHeading";
import { useSettingsStore } from "@/store/settingsStore";
import { AdvancedLessonNotice } from "@/components/Advanced";
import Glossary from "@/pages/Glossary";
import { useQuizStore } from "@/store/quizStore";

export default function Textbook() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // ?at=<heading id> scrolls to that part of the lesson. The Section Review
  // quiz uses it to send a student back to what they should reread.
  const [searchParams] = useSearchParams();
  const at = searchParams.get("at");

  useEffect(() => {
    if (!at) return;
    // Wait a frame so the lesson has rendered (and ScrollToTop has run)
    // before scrolling to the heading.
    const frame = requestAnimationFrame(() => scrollToHeading(at));
    return () => cancelAnimationFrame(frame);
  }, [slug, at]);

  const currentIndex = sorted.findIndex(l => l.frontmatter.slug === slug);
  const lesson = currentIndex >= 0 ? sorted[currentIndex] : null;
  // /textbook/glossary shows the Glossary inside the textbook layout.
  const isGlossary = slug === "glossary";

  // Default open on desktop, closed on mobile -- the sidebar becomes an
  // overlay drawer below the CSS breakpoint (see .toc-sidebar), so
  // defaulting it open there would cover the whole screen on first load.
  // Declared here (above the early return below) rather than down by the
  // lesson layout, since hooks can't be called conditionally -- the TOC
  // page returns before ever reaching a hook declared further down.
  const showAdvanced = useSettingsStore((st) => st.showAdvanced);
  const hideQuizScores = useSettingsStore((st) => st.hideQuizScores);
  const allQuizResults = useQuizStore((st) => st.results);
  // With "Hide quiz scores" on, act as if there are no saved scores.
  const quizResults = hideQuizScores ? {} : allQuizResults;

  const [tocOpen, setTocOpen] = useState(() =>
    typeof window === "undefined" || window.innerWidth > 860,
  );

  if (!lesson && !isGlossary) {
    const byUnit = lessonsByUnit(visibleLessons(showAdvanced));

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
                    {quizResults[l.frontmatter.slug] && (
                      <span
                        className={`toc-score${quizResults[l.frontmatter.slug].best === quizResults[l.frontmatter.slug].total ? " toc-score--perfect" : ""}`}
                        title="Best Section Review score"
                      >
                        {quizResults[l.frontmatter.slug].best}/{quizResults[l.frontmatter.slug].total}
                      </span>
                    )}
                    {l.frontmatter.advanced && <span className="toc-advanced-tag">Advanced</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="lesson-bank-unit">
          <h2>Reference</h2>
          <ul>
            <li>
              <Link to="/textbook/glossary" className="lesson-bank-glossary">
                <BookA size={16} aria-hidden="true" />
                Glossary of Vocabulary and Math Symbols
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Previous/Next skip hidden advanced lessons. If the reader opened a hidden
  // one directly (e.g. from a link), it stays in the list so its neighbors work.
  // The Glossary has no Previous/Next.
  const navList = lesson
    ? sorted.filter((l) => showAdvanced || !l.frontmatter.advanced || l === lesson)
    : [];
  const navIndex = lesson ? navList.indexOf(lesson) : -1;
  const prev = navIndex > 0 ? navList[navIndex - 1] : null;
  const next = navIndex >= 0 && navIndex < navList.length - 1 ? navList[navIndex + 1] : null;

  const byUnit = lessonsByUnit(visibleLessons(showAdvanced));

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
            <Link
              to="/textbook/glossary"
              className={`toc-link toc-glossary${isGlossary ? " toc-link--active" : ""}`}
            >
              Glossary
            </Link>
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
            <optgroup label="Reference">
              <option value="glossary">Glossary</option>
            </optgroup>
          </select>
        </label>

        {isGlossary || !lesson ? (
          <Glossary />
        ) : lesson.frontmatter.advanced && !showAdvanced ? (
          <AdvancedLessonNotice title={lesson.frontmatter.title} />
        ) : (
          <>
            {lesson.frontmatter.advanced && (
              <p className="advanced-lesson-banner">
                <span className="advanced-badge">Beyond the course</span>
                This whole section goes beyond the intro course.
              </p>
            )}
            <lesson.default components={LESSON_COMPONENTS} />

            {quizzes[lesson.frontmatter.slug] && (
              <Link to={`/textbook/${lesson.frontmatter.slug}/review`} className="review-cta">
                <ClipboardCheck size={22} aria-hidden="true" className="review-cta__icon" />
                <span className="review-cta__text">
                  <span className="review-cta__title">Section Review</span>
                  <span className="review-cta__hint">
                    {quizResults[lesson.frontmatter.slug]
                      ? `Best score ${quizResults[lesson.frontmatter.slug].best}/${quizResults[lesson.frontmatter.slug].total} · Retake the quiz`
                      : `${quizzes[lesson.frontmatter.slug].length} questions to check your understanding`}
                  </span>
                </span>
                <span className="review-cta__arrow" aria-hidden="true">→</span>
              </Link>
            )}
          </>
        )}

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
