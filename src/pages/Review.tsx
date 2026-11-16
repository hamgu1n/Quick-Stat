import { Link, useNavigate, useParams } from "react-router-dom";
import { Switch } from "radix-ui";
import { ArrowLeft } from "lucide-react";
import lessonHeadings from "virtual:lesson-headings";
import { LESSON_COMPONENTS, quizzes, sortedLessons } from "@/lib/lessons";
import { scrollToHeading } from "@/lib/scrollToHeading";
import { useSettingsStore } from "@/store/settingsStore";
import { Quiz } from "@/components/Quiz";
import { AdvancedLessonNotice } from "@/components/Advanced";
import { useQuizStore } from "@/store/quizStore";

/**
 * The Section Review page for one lesson (/textbook/:slug/review).
 *
 * By default the quiz has the page to itself, and a "Review" link takes the
 * student back to the lesson, scrolled to the right heading. With
 * "Show lesson side by side" on, the lesson sits in a scrollable pane next
 * to the quiz, and Review links scroll that pane instead of leaving the page.
 */
export default function Review() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const sideBySide = useSettingsStore((s) => s.reviewSideBySide);
  const setSideBySide = useSettingsStore((s) => s.setReviewSideBySide);
  const showAdvanced = useSettingsStore((s) => s.showAdvanced);
  const hideQuizScores = useSettingsStore((s) => s.hideQuizScores);
  const savedRecord = useQuizStore((s) => s.results[slug]);
  const record = hideQuizScores ? undefined : savedRecord;
  const recordAttempt = useQuizStore((s) => s.recordAttempt);

  const index = sortedLessons.findIndex((l) => l.frontmatter.slug === slug);
  const lesson = index >= 0 ? sortedLessons[index] : null;
  const questions = quizzes[slug];

  if (!lesson || !questions) {
    return (
      <div className="review-missing">
        <h1>No review here yet</h1>
        <p>
          <Link to="/textbook">Back to the textbook</Link>
        </p>
      </div>
    );
  }

  if (lesson.frontmatter.advanced && !showAdvanced) {
    return (
      <div className="review-missing">
        <AdvancedLessonNotice title={lesson.frontmatter.title} />
      </div>
    );
  }

  const Lesson = lesson.default;
  // The next lesson in reading order, skipping hidden advanced ones.
  const next = sortedLessons.slice(index + 1).find((l) => showAdvanced || !l.frontmatter.advanced);

  function handleReview(id: string) {
    // In side-by-side mode the heading is already on the page, so just
    // scroll the lesson pane. Otherwise go back to the full lesson.
    if (sideBySide && scrollToHeading(id)) return;
    navigate(`/textbook/${slug}?at=${encodeURIComponent(id)}`);
  }

  return (
    <div className={`review-page${sideBySide ? " review-page--split" : ""}`}>
      {sideBySide && (
        <div className="review-lesson-pane" aria-label="Lesson">
          <div className="lesson-prose">
            <Lesson components={LESSON_COMPONENTS} />
          </div>
        </div>
      )}

      <div className="review-quiz-pane">
        <div className="review-quiz-inner">
          <Link to={`/textbook/${slug}`} className="review-back">
            <ArrowLeft size={16} aria-hidden="true" /> Back to the lesson
          </Link>

          <p className="review-eyebrow">Section Review</p>
          <h1 className="review-title">{lesson.frontmatter.title}</h1>

          {record && (
            <p className="review-score">
              Best score: <strong>{record.best}/{record.total}</strong> · Last: {record.last}/{record.total} ·{" "}
              {record.attempts} {record.attempts === 1 ? "attempt" : "attempts"}
            </p>
          )}

          <div className="review-toggle">
            <label htmlFor="review-side-by-side">Show lesson side by side</label>
            <Switch.Root
              id="review-side-by-side"
              className="settings-switch"
              checked={sideBySide}
              onCheckedChange={setSideBySide}
            >
              <Switch.Thumb className="settings-switch__thumb" />
            </Switch.Root>
          </div>

          {/* key resets the answers when moving to a different lesson's quiz */}
          <Quiz
            key={slug}
            questions={questions}
            headings={lessonHeadings[slug] ?? []}
            onReview={handleReview}
            onComplete={(score) => recordAttempt(slug, score, questions.length)}
          />

          {next && (
            <Link to={`/textbook/${next.frontmatter.slug}`} className="review-next">
              Next section: {next.frontmatter.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
