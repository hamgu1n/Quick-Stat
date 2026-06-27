import { Link, useParams } from "react-router-dom";
import React, { useState } from "react";
import { NormalDistWidget } from "@/components/widgets/NormalDistWidget";
import { MeanMedianWidget } from "@/components/widgets/MeanMedianWidget";
import { ZScoreWidget } from "@/components/widgets/ZScoreWidget";
import { SkewnessWidget } from "@/components/widgets/SkewnessWidget";
import { BarChartWidget } from "@/components/widgets/BarChartWidget";
import { HistogramWidget } from "@/components/widgets/HistogramWidget";
import { BoxplotWidget } from "@/components/widgets/BoxplotWidget";
import { ScatterplotWidget } from "@/components/widgets/ScatterplotWidget";
import { SamplingMethodWidget } from "@/components/widgets/SamplingMethodWidget";
import { RandomizationWidget } from "@/components/widgets/RandomizationWidget";
import { ProbabilityVennWidget } from "@/components/widgets/ProbabilityVennWidget";
import { BayesWidget } from "@/components/widgets/BayesWidget";
import { PermCombWidget } from "@/components/widgets/PermCombWidget";
import { SamplingDistWidget } from "@/components/widgets/SamplingDistWidget";
import { CLTWidget } from "@/components/widgets/CLTWidget";
import { ConfidenceIntervalWidget } from "@/components/widgets/ConfidenceIntervalWidget";
import { ZTestWidget } from "@/components/widgets/ZTestWidget";
import { TDistWidget } from "@/components/widgets/TDistWidget";
import { TTestWidget } from "@/components/widgets/TTestWidget";
import { TypeErrorPowerWidget } from "@/components/widgets/TypeErrorPowerWidget";
import { ChiSquareWidget } from "@/components/widgets/ChiSquareWidget";
import { AnovaWidget } from "@/components/widgets/AnovaWidget";
import { PostHocWidget } from "@/components/widgets/PostHocWidget";
import { CorrelationWidget } from "@/components/widgets/CorrelationWidget";
import { OutlierCorrelationWidget } from "@/components/widgets/OutlierCorrelationWidget";
import { RegressionWidget } from "@/components/widgets/RegressionWidget";
import { ResidualWidget } from "@/components/widgets/ResidualWidget";

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

const COMPONENTS = {
  NormalDistWidget, MeanMedianWidget, ZScoreWidget, SkewnessWidget,
  BarChartWidget, HistogramWidget, BoxplotWidget, ScatterplotWidget,
  SamplingMethodWidget, RandomizationWidget,
  ProbabilityVennWidget, BayesWidget, PermCombWidget,
  SamplingDistWidget, CLTWidget,
  ConfidenceIntervalWidget,
  ZTestWidget, TDistWidget, TTestWidget, TypeErrorPowerWidget, ChiSquareWidget,
  AnovaWidget, PostHocWidget,
  CorrelationWidget, OutlierCorrelationWidget,
  RegressionWidget, ResidualWidget,
};

export default function Textbook() {
  const { slug } = useParams();

  const currentIndex = sorted.findIndex(l => l.frontmatter.slug === slug);
  const lesson = currentIndex >= 0 ? sorted[currentIndex] : null;

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
        {Object.entries(byUnit).map(([unit, unitLessons]) => (
          <div className="lesson-bank-unit" key={unit}>
            <h2>Unit {unit} — {unitNames[Number(unit)]}</h2>
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

  const [tocOpen, setTocOpen] = useState(true);

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
