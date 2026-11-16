import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { MathText } from "@/components/MathText";
import type { QuizQuestion } from "@/lib/quiz";
import type { LessonHeading } from "@/lib/headingIds";

type QuizProps = {
  questions: QuizQuestion[];
  /** The lesson's headings, used to name the part to reread. */
  headings: LessonHeading[];
  /** Called when the student clicks a "Review" link for a heading id. */
  onReview: (headingId: string) => void;
  /** Called with the score when a full attempt is finished (not a retry of missed questions). */
  onComplete?: (score: number) => void;
};

/**
 * A multiple-choice quiz. The student picks an answer and presses Check;
 * a wrong answer shows the explanation plus a link to the part of the lesson
 * that covers it. Once every question is checked, a score appears with a
 * list of everything worth rereading.
 */
export function Quiz({ questions, headings, onReview, onComplete }: QuizProps) {
  // One entry per question: the chosen choice index (or null), and whether
  // it has been checked yet. Checked answers are locked in.
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  // True while re-answering only the missed questions. Those attempts are
  // practice, so they don't change the saved score.
  const [retryingMissed, setRetryingMissed] = useState(false);

  const titleFor = (id: string) => headings.find((h) => h.id === id)?.title ?? "this section";

  const doneCount = checked.filter(Boolean).length;
  const correctCount = questions.filter((q, i) => checked[i] && selected[i] === q.answer).length;
  const allDone = doneCount === questions.length;

  // Every section the student missed a question on, in lesson order.
  const missedSections = headings.filter((h) =>
    questions.some((q, i) => checked[i] && selected[i] !== q.answer && q.section === h.id),
  );

  function check(qi: number) {
    const nextChecked = checked.map((v, i) => (i === qi ? true : v));
    setChecked(nextChecked);
    if (nextChecked.every(Boolean) && !retryingMissed) {
      onComplete?.(questions.filter((q, i) => selected[i] === q.answer).length);
    }
  }

  /** Start the whole quiz over. */
  function reset() {
    setSelected(questions.map(() => null));
    setChecked(questions.map(() => false));
    setRetryingMissed(false);
  }

  /** Clear only the questions answered wrong, keeping the right ones. */
  function retryMissed() {
    const right = questions.map((q, i) => selected[i] === q.answer);
    setSelected((s) => s.map((v, i) => (right[i] ? v : null)));
    setChecked(right);
    setRetryingMissed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="quiz">
      <p className="quiz-progress" aria-live="polite">
        {doneCount} of {questions.length} answered · {correctCount} correct
      </p>

      <ol className="quiz-list">
        {questions.map((q, qi) => {
          const isChecked = checked[qi];
          const isCorrect = isChecked && selected[qi] === q.answer;
          const name = `quiz-q${qi}`;
          return (
            <li
              key={qi}
              className={`quiz-question${isChecked ? (isCorrect ? " quiz-question--right" : " quiz-question--wrong") : ""}`}
            >
              <fieldset disabled={isChecked}>
                <legend className="quiz-prompt">
                  <span className="quiz-number">{qi + 1}.</span>
                  <MathText text={q.prompt} />
                </legend>

                <div className="quiz-choices">
                  {q.choices.map((choice, ci) => {
                    let state = "";
                    if (isChecked && ci === q.answer) state = " quiz-choice--answer";
                    else if (isChecked && ci === selected[qi]) state = " quiz-choice--picked-wrong";
                    return (
                      <label key={ci} className={`quiz-choice${state}`}>
                        <input
                          type="radio"
                          name={name}
                          checked={selected[qi] === ci}
                          onChange={() =>
                            setSelected((s) => s.map((v, i) => (i === qi ? ci : v)))
                          }
                        />
                        <span>
                          <MathText text={choice} />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {!isChecked ? (
                <button
                  type="button"
                  className="quiz-check"
                  disabled={selected[qi] === null}
                  onClick={() => check(qi)}
                >
                  Check
                </button>
              ) : (
                <div className="quiz-feedback" role="status">
                  <p className="quiz-verdict">
                    {isCorrect ? (
                      <>
                        <Check size={16} aria-hidden="true" /> Correct
                      </>
                    ) : (
                      <>
                        <X size={16} aria-hidden="true" /> Not quite
                      </>
                    )}
                  </p>
                  {q.explanation && (
                    <p className="quiz-explanation">
                      <MathText text={q.explanation} />
                    </p>
                  )}
                  {!isCorrect && (
                    <button type="button" className="quiz-review-link" onClick={() => onReview(q.section)}>
                      Review: <MathText text={titleFor(q.section)} /> →
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="quiz-summary">
          <p className="quiz-score">
            {retryingMissed
              ? `After retrying: ${correctCount} out of ${questions.length}.`
              : `You got ${correctCount} out of ${questions.length}.`}
          </p>
          {retryingMissed && (
            <p className="quiz-summary-note">Retries are practice, so your saved score is from your last full attempt.</p>
          )}
          {missedSections.length > 0 ? (
            <>
              <p>Before moving on, reread these parts of the lesson:</p>
              <ul className="quiz-summary-list">
                {missedSections.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="quiz-review-link" onClick={() => onReview(h.id)}>
                      <MathText text={h.title} /> →
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Perfect score. You're ready for the next section.</p>
          )}
          <div className="quiz-summary-actions">
            {missedSections.length > 0 && (
              <button type="button" className="quiz-check" onClick={retryMissed}>
                <RotateCcw size={14} aria-hidden="true" /> Retry missed questions
              </button>
            )}
            <button type="button" className="quiz-check quiz-check--secondary" onClick={reset}>
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
