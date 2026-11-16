import { Link } from "react-router-dom";
import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  Code,
  Eye,
  LayoutGrid,
  Lock,
  MessageCircleQuestion,
  Settings,
} from "lucide-react";
import lessonHeadings from "virtual:lesson-headings";
import { quizzes, unitNames } from "@/lib/lessons";
import { APPLETS } from "@/lib/widgetRegistry";
import { MathText } from "@/components/MathText";

// Counted from the content itself, so the numbers stay right as the
// textbook grows.
const SECTION_COUNT = Object.values(lessonHeadings)
  .flat()
  .filter((h) => h.depth === 2 && h.title.startsWith("Section")).length;
const UNIT_COUNT = Object.keys(unitNames).length;
const QUESTION_COUNT = Object.values(quizzes).reduce((n, q) => n + q.length, 0);

// A few symbols for the tooltip demo. Each one is hoverable.
const TOOLTIP_DEMO = String.raw`$\bar{x}$ · $\hat{p}$ · $\mu$ · $\sigma^2$ · $H_0$ · $z^*$ · $\pm$ · $\chi^2$ · $\binom{n}{k}$`;

const FEATURES = [
  {
    icon: Eye,
    title: "Show answer on every example",
    body: "Each worked example and practice problem has a Show answer button with a full worked solution, so you can try it yourself first and check your thinking after.",
  },
  {
    icon: ClipboardCheck,
    title: "Section Review quizzes",
    body: `Every section ends with a Section Review: ${QUESTION_COUNT} questions in all. Miss one and you get an explanation plus a Review link that takes you to the exact part of the lesson to reread. Turn on "Show lesson side by side" to keep the lesson open next to the quiz. Your best score is saved in your browser, and you can retry just the questions you missed.`,
  },
  {
    icon: MessageCircleQuestion,
    title: "How to say the math",
    body: "Hover over (or tap) any symbol in a formula to see how it's read aloud, like x-bar, p-hat, or H-naught. From the keyboard, Tab to a formula and use the arrow keys. New symbols are also spelled out in the text the first time they appear.",
    demo: true,
  },
  {
    icon: LayoutGrid,
    title: "Interactive applets",
    body: `${APPLETS.length} applets let you move sliders and watch the statistics respond: drag a normal curve, add an outlier, run a simulated A/B test. Each one is embedded in its lesson and also listed on the Applets page.`,
  },
  {
    icon: Code,
    title: "Show R Code",
    body: "Every applet has a Show R Code button with the R code that produces the same result. It updates as you move the sliders, so you can copy it straight into RStudio.",
  },
  {
    icon: Settings,
    title: "Advanced topics switch",
    body: "Some material goes beyond the intro course. It's hidden by default; turn on Show advanced topics in the gear menu at the top right to read it.",
  },
];

/** The About page (/about): what Quick Stat is for and what it can do. */
export default function About() {
  return (
    <div className="about-page">
      <p className="about-eyebrow">About</p>
      <h1 className="about-title">A statistics textbook you can interact with</h1>
      <p className="about-lead">
        Quick Stat is a free, interactive textbook for an introductory statistics
        course. It covers the full first course, from collecting data through
        regression, and lets you experiment with every idea instead of only
        reading about it.
      </p>

      <div className="about-stats">
        <div><strong>{UNIT_COUNT}</strong><span>units</span></div>
        <div><strong>{SECTION_COUNT}</strong><span>sections</span></div>
        <div><strong>{APPLETS.length}</strong><span>applets</span></div>
        <div><strong>{QUESTION_COUNT}</strong><span>review questions</span></div>
      </div>

      <h2>Why it exists</h2>
      <p>
        Statistics is easier to understand when you can see it happen. A
        printed textbook can tell you that one outlier drags the mean but not
        the median; here you can add the outlier yourself and watch it
        happen. The textbook follows the order of Roanoke College's
        introductory statistics course, with every section numbered by unit
        (Section 2.3 is the third section of Unit 2), so it's easy to read
        along with class.
      </p>

      <h2>What's here</h2>
      <div className="about-tools">
        <Link to="/textbook" className="about-tool">
          <BookOpen size={20} aria-hidden="true" />
          <span>
            <strong>Textbook</strong>
            {UNIT_COUNT} units of lessons with worked examples, key points, and
            a review at the end of each section, plus a glossary of every key
            term and math symbol.
          </span>
        </Link>
        <Link to="/applets" className="about-tool">
          <LayoutGrid size={20} aria-hidden="true" />
          <span>
            <strong>Applets</strong>
            Every interactive applet in one searchable place. Search by topic
            or section number.
          </span>
        </Link>
        <Link to="/analyzer" className="about-tool">
          <ChartColumn size={20} aria-hidden="true" />
          <span>
            <strong>Analyzer</strong>
            Upload a CSV (or pick a sample dataset) and make graphs, get summary
            statistics, and run t-tests, z-tests, proportion tests, ANOVA,
            chi-square tests, nonparametric tests, correlation, and
            regression. It suggests tests that fit your data.
          </span>
        </Link>
      </div>

      <h2>Built-in study features</h2>
      <ul className="about-features">
        {FEATURES.map(({ icon: Icon, title, body, demo }) => (
          <li key={title}>
            <Icon size={20} aria-hidden="true" className="about-feature-icon" />
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
              {demo && (
                <p className="about-demo">
                  Try it: <MathText text={TOOLTIP_DEMO} />
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2>A suggested way to study</h2>
      <ol className="about-steps">
        <li>Read a section and try each example before opening its answer.</li>
        <li>Play with the applet in that section until the idea clicks.</li>
        <li>Take the Section Review, and follow the Review links for anything you miss.</li>
        <li>Use the Analyzer to try the same methods on real data.</li>
      </ol>

      <h2>
        <Lock size={18} aria-hidden="true" className="about-inline-icon" />
        Your data stays with you
      </h2>
      <p>
        Everything runs in your browser. Files you open in the Analyzer are never
        uploaded anywhere, there are no accounts, and your settings (like the
        advanced-topics switch) are saved only in your own browser.
      </p>

      <p className="about-byline">Written and built by Haytham R. Hlioui.</p>
    </div>
  );
}
