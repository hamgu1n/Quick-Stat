import type { ComponentType } from "react";
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

/**
 * Single source of truth for every interactive textbook widget.
 *
 * - `Textbook.tsx` uses `COMPONENTS` (derived below) to resolve widgets
 *   referenced by name inside MDX lessons.
 * - `Applets.tsx` uses `APPLETS` directly to render the searchable card grid.
 *
 * `tags` are not shown in the UI — they only back the Applets search box,
 * so instructors can find a widget by test name, concept, or chapter without
 * the card grid itself getting cluttered with badges.
 */
export type AppletEntry = {
  id: string;
  title: string;
  component: ComponentType;
  tags: string[];
  unit: number;
  chapter: number;
  lessonSlug: string;
  lessonTitle: string;
};

export const APPLETS: AppletEntry[] = [
  {
    id: "SamplingMethodWidget",
    title: "Sampling Methods Explorer",
    component: SamplingMethodWidget,
    tags: ["sampling", "sample", "simple random sample", "srs", "stratified", "stratified sampling", "cluster", "cluster sampling", "systematic", "systematic sampling", "convenience sample", "voluntary response", "population", "sampling frame", "sampling error", "bias", "sampling bias", "unit 1", "chapter 1"],
    unit: 1, chapter: 1,
    lessonSlug: "01-1-populations-and-samples", lessonTitle: "Populations and Samples",
  },
  {
    id: "RandomizationWidget",
    title: "Randomization & Experimental Design",
    component: RandomizationWidget,
    tags: ["randomization", "random assignment", "experimental design", "experiment", "control group", "placebo", "treatment", "treatment group", "confounding", "confounding variable", "lurking variable", "blocking", "observational study", "causation vs correlation", "unit 1", "chapter 2"],
    unit: 1, chapter: 2,
    lessonSlug: "02-1-experimental-design", lessonTitle: "Experimental Design",
  },
  {
    id: "MeanMedianWidget",
    title: "Mean vs. Median",
    component: MeanMedianWidget,
    tags: ["mean", "median", "mode", "central tendency", "skew", "skewed", "outlier", "outliers", "average", "typical value", "resistant measure", "unit 2", "chapter 3"],
    unit: 2, chapter: 3,
    lessonSlug: "03-1-measures-of-central-tendency", lessonTitle: "Measures of Central Tendency",
  },
  {
    id: "NormalDistWidget",
    title: "Normal Distribution & Dispersion",
    component: NormalDistWidget,
    tags: ["normal distribution", "gaussian", "standard deviation", "sd", "variance", "dispersion", "spread", "bell curve", "68-95-99.7", "empirical rule", "range", "unit 2", "chapter 3"],
    unit: 2, chapter: 3,
    lessonSlug: "03-2-measures-of-dispersion", lessonTitle: "Measures of Dispersion",
  },
  {
    id: "ZScoreWidget",
    title: "Z-Score Calculator",
    component: ZScoreWidget,
    tags: ["z-score", "z score", "standard score", "standardization", "standardize", "percentile", "percentile rank", "measures of position", "relative standing", "unit 2", "chapter 3"],
    unit: 2, chapter: 3,
    lessonSlug: "03-3-measures-of-position", lessonTitle: "Measures of Position",
  },
  {
    id: "SkewnessWidget",
    title: "Skewness & Shape",
    component: SkewnessWidget,
    tags: ["skewness", "skew", "skewed left", "skewed right", "distribution shape", "shape", "summary statistics", "five-number summary", "unit 2", "chapter 3"],
    unit: 2, chapter: 3,
    lessonSlug: "03-4-summary-statistics", lessonTitle: "Summary Statistics",
  },
  {
    id: "BarChartWidget",
    title: "Bar & Pie Chart Builder",
    component: BarChartWidget,
    tags: ["bar chart", "bar graph", "pie chart", "categorical data", "qualitative data", "frequency", "frequency table", "relative frequency", "proportions", "unit 2", "chapter 4"],
    unit: 2, chapter: 4,
    lessonSlug: "04-1-bar-charts-and-pie-charts", lessonTitle: "Bar Charts and Pie Charts",
  },
  {
    id: "HistogramWidget",
    title: "Histogram Explorer",
    component: HistogramWidget,
    tags: ["histogram", "bins", "bin width", "frequency distribution", "quantitative data", "distribution shape", "unit 2", "chapter 4"],
    unit: 2, chapter: 4,
    lessonSlug: "04-2-histograms", lessonTitle: "Histograms",
  },
  {
    id: "BoxplotWidget",
    title: "Boxplot & Stem-and-Leaf",
    component: BoxplotWidget,
    tags: ["boxplot", "box plot", "box and whisker", "stem and leaf", "stem-and-leaf plot", "quartiles", "q1", "q3", "iqr", "interquartile range", "outliers", "five-number summary", "median", "whiskers", "unit 2", "chapter 4"],
    unit: 2, chapter: 4,
    lessonSlug: "04-3-boxplots-and-stem-leaf", lessonTitle: "Boxplots and Stem-and-Leaf Plots",
  },
  {
    id: "ScatterplotWidget",
    title: "Scatterplot Explorer",
    component: ScatterplotWidget,
    tags: ["scatterplot", "scatter plot", "bivariate data", "association", "linear relationship", "trend", "positive association", "negative association", "unit 2", "chapter 4"],
    unit: 2, chapter: 4,
    lessonSlug: "04-4-scatterplots", lessonTitle: "Scatterplots",
  },
  {
    id: "ProbabilityVennWidget",
    title: "Probability Venn Diagram",
    component: ProbabilityVennWidget,
    tags: ["probability", "venn diagram", "union", "intersection", "mutually exclusive", "disjoint events", "complement", "addition rule", "sample space", "events", "unit 3", "chapter 5"],
    unit: 3, chapter: 5,
    lessonSlug: "05-1-probability-rules", lessonTitle: "Probability Rules",
  },
  {
    id: "BayesWidget",
    title: "Bayes' Theorem Calculator",
    component: BayesWidget,
    tags: ["bayes theorem", "bayes' theorem", "conditional probability", "prior", "prior probability", "posterior", "posterior probability", "independence", "independent events", "multiplication rule", "unit 3", "chapter 5"],
    unit: 3, chapter: 5,
    lessonSlug: "05-2-conditional-probability", lessonTitle: "Conditional Probability",
  },
  {
    id: "PermCombWidget",
    title: "Permutations & Combinations",
    component: PermCombWidget,
    tags: ["permutations", "combinations", "counting techniques", "counting rules", "factorial", "nCr", "nPr", "order matters", "unit 3", "chapter 5"],
    unit: 3, chapter: 5,
    lessonSlug: "05-3-counting-techniques", lessonTitle: "Counting Techniques",
  },
  {
    id: "SamplingDistWidget",
    title: "Sampling Distribution Simulator",
    component: SamplingDistWidget,
    tags: ["sampling distribution", "standard error", "se", "sample mean", "variability of statistics", "unit 3", "chapter 6"],
    unit: 3, chapter: 6,
    lessonSlug: "06-1-sampling-distributions", lessonTitle: "Sampling Distributions",
  },
  {
    id: "CLTWidget",
    title: "Central Limit Theorem Demo",
    component: CLTWidget,
    tags: ["central limit theorem", "clt", "law of large numbers", "sample size", "normal approximation", "n=30", "unit 3", "chapter 6"],
    unit: 3, chapter: 6,
    lessonSlug: "06-2-clt-approximations", lessonTitle: "CLT Approximations",
  },
  {
    id: "ConfidenceIntervalWidget",
    title: "Confidence Interval Builder",
    component: ConfidenceIntervalWidget,
    tags: ["confidence interval", "ci", "margin of error", "moe", "point estimate", "confidence level", "critical value", "estimation", "unit 4", "chapter 7"],
    unit: 4, chapter: 7,
    lessonSlug: "07-2-confidence-intervals", lessonTitle: "Confidence Intervals for Means and Proportions",
  },
  {
    id: "ZTestWidget",
    title: "One-Sample Z-Test",
    component: ZTestWidget,
    tags: ["z-test", "z test", "hypothesis test", "hypothesis testing", "p-value", "significance level", "null hypothesis", "alternative hypothesis", "one-sample", "test statistic", "unit 4", "chapter 8"],
    unit: 4, chapter: 8,
    lessonSlug: "08-1-z-tests", lessonTitle: "z-Tests",
  },
  {
    id: "TypeErrorPowerWidget",
    title: "Type I/II Error & Power",
    component: TypeErrorPowerWidget,
    tags: ["type i error", "type 1 error", "type ii error", "type 2 error", "false positive", "false negative", "alpha", "significance level", "beta", "statistical power", "power of a test", "p-value", "unit 4", "chapter 8"],
    unit: 4, chapter: 8,
    lessonSlug: "08-1-z-tests", lessonTitle: "z-Tests",
  },
  {
    id: "TDistWidget",
    title: "t-Distribution Explorer",
    component: TDistWidget,
    tags: ["t-distribution", "t distribution", "degrees of freedom", "df", "student's t", "students t distribution", "heavy tails", "unit 4", "chapter 8"],
    unit: 4, chapter: 8,
    lessonSlug: "08-2-t-tests", lessonTitle: "t-Tests",
  },
  {
    id: "TTestWidget",
    title: "One-Sample t-Test",
    component: TTestWidget,
    tags: ["t-test", "t test", "hypothesis test", "hypothesis testing", "p-value", "null hypothesis", "alternative hypothesis", "one-sample", "degrees of freedom", "test statistic", "unit 4", "chapter 8"],
    unit: 4, chapter: 8,
    lessonSlug: "08-2-t-tests", lessonTitle: "t-Tests",
  },
  {
    id: "ChiSquareWidget",
    title: "Chi-Square Test",
    component: ChiSquareWidget,
    tags: ["chi-square", "chi square", "chi-squared", "goodness of fit", "independence test", "test of independence", "contingency table", "observed vs expected", "p-value", "categorical data", "unit 4", "chapter 8"],
    unit: 4, chapter: 8,
    lessonSlug: "08-3-chi-square-tests", lessonTitle: "Chi-Square Tests",
  },
  {
    id: "AnovaWidget",
    title: "One-Way ANOVA",
    component: AnovaWidget,
    tags: ["anova", "analysis of variance", "one-way anova", "f-statistic", "f-test", "f-ratio", "between-group variance", "within-group variance", "multiple groups", "unit 4", "chapter 9"],
    unit: 4, chapter: 9,
    lessonSlug: "09-1-one-way-anova", lessonTitle: "One-Way ANOVA",
  },
  {
    id: "PostHocWidget",
    title: "Post-Hoc Pairwise Comparisons",
    component: PostHocWidget,
    tags: ["post-hoc", "post hoc test", "bonferroni", "tukey", "pairwise comparison", "multiple comparisons", "family-wise error rate", "anova", "unit 4", "chapter 9"],
    unit: 4, chapter: 9,
    lessonSlug: "09-2-interpreting-anova", lessonTitle: "Interpreting ANOVA Results",
  },
  {
    id: "CorrelationWidget",
    title: "Pearson & Spearman Correlation",
    component: CorrelationWidget,
    tags: ["correlation", "correlation coefficient", "pearson", "pearson's r", "spearman", "spearman's rank", "r value", "linear association", "rank correlation", "unit 5", "chapter 10"],
    unit: 5, chapter: 10,
    lessonSlug: "10-1-pearson-spearman", lessonTitle: "Pearson and Spearman Correlation",
  },
  {
    id: "OutlierCorrelationWidget",
    title: "Outliers & Correlation",
    component: OutlierCorrelationWidget,
    tags: ["outliers", "outlier", "correlation", "leverage point", "influential point", "correlation vs causation", "unit 5", "chapter 10"],
    unit: 5, chapter: 10,
    lessonSlug: "10-2-interpreting-correlation", lessonTitle: "Interpreting Correlation Coefficients",
  },
  {
    id: "RegressionWidget",
    title: "Simple Linear Regression",
    component: RegressionWidget,
    tags: ["regression", "linear regression", "regression line", "least squares", "line of best fit", "slope", "intercept", "r-squared", "r^2", "coefficient of determination", "prediction", "unit 5", "chapter 11"],
    unit: 5, chapter: 11,
    lessonSlug: "11-1-least-squares", lessonTitle: "Least Squares Method",
  },
  {
    id: "ResidualWidget",
    title: "Residual Diagnostics",
    component: ResidualWidget,
    tags: ["residuals", "residual plot", "regression assumptions", "diagnostics", "linearity", "heteroscedasticity", "homoscedasticity", "normality of residuals", "unit 5", "chapter 11"],
    unit: 5, chapter: 11,
    lessonSlug: "11-3-assumptions-diagnostics", lessonTitle: "Assumptions and Diagnostics",
  },
];

export const COMPONENTS = Object.fromEntries(
  APPLETS.map(a => [a.id, a.component]),
) as Record<string, ComponentType>;
