// Declarative definitions that drive the Test Runner UI: what inputs each
// test needs (numeric column / categorical column / number / tail), and how
// to actually run it once the user has filled those in.

import {
  type Tail,
  type TestResult,
  oneSampleTTest,
  oneSampleZTest,
  twoSampleTTest,
  pairedTTest,
  oneWayAnova,
  chiSquareGOF,
  chiSquareIndependence,
  pearsonCorrelation,
  simpleLinearRegression,
} from "@/lib/testRunners";
import { onePropZTest, twoPropZTest } from "@/lib/proportionTests";
import { kruskalWallis, mannWhitney, signTest, spearmanCorrelation, wilcoxonSignedRank } from "@/lib/rankTests";

export type FormValues = Record<string, string>;

export type TestInput =
  | { kind: "numeric-column"; key: string; label: string }
  | { kind: "categorical-column"; key: string; label: string }
  | { kind: "number"; key: string; label: string; default: number }
  | { kind: "tail"; key: string; label: string }
  /** Pick one value of another (categorical) input's column, e.g. which
   * answer counts as a "success" for a proportion test. */
  | { kind: "category-value"; key: string; label: string; column: string };

export type TestDef = {
  id: string;
  group: string;
  label: string;
  /** Short "when to use this" explanation, shown as a hover tooltip on the
   * test's button in the Test tab. */
  whenToUse: string;
  inputs: TestInput[];
  run: (get: (key: string) => string, getColumn: (key: string) => string[]) => TestResult;
};

function num(get: (key: string) => string, key: string, fallback: number): number {
  const v = Number(get(key));
  return Number.isFinite(v) ? v : fallback;
}

export const TEST_DEFS: TestDef[] = [
  {
    id: "one-sample-t",
    group: "T-Tests",
    label: "One-sample t-test",
    whenToUse: "Compare a sample mean to a hypothesized value when the population standard deviation is unknown (the usual case).",
    inputs: [
      { kind: "numeric-column", key: "column", label: "Column" },
      { kind: "number", key: "mu0", label: "Null mean (μ₀)", default: 0 },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      oneSampleTTest(get("column"), getColumn("column"), num(get, "mu0", 0), get("tail") as Tail),
  },
  {
    id: "two-sample-t",
    group: "T-Tests",
    label: "Two-sample t-test",
    whenToUse: "Compare the means of two independent groups (e.g. a treatment group vs. a control group).",
    inputs: [
      { kind: "numeric-column", key: "response", label: "Response column" },
      { kind: "categorical-column", key: "group", label: "Group column (2 levels)" },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      twoSampleTTest(get("response"), get("group"), getColumn("response"), getColumn("group"), get("tail") as Tail),
  },
  {
    id: "paired-t",
    group: "T-Tests",
    label: "Paired t-test",
    whenToUse: "Compare two related measurements on the same subjects, like a before/after or matched-pairs design.",
    inputs: [
      { kind: "numeric-column", key: "column1", label: "Column 1" },
      { kind: "numeric-column", key: "column2", label: "Column 2" },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      pairedTTest(get("column1"), get("column2"), getColumn("column1"), getColumn("column2"), get("tail") as Tail),
  },
  {
    id: "one-sample-z",
    group: "Z-Tests",
    label: "One-sample z-test",
    whenToUse: "Compare a sample mean to a hypothesized value when the population standard deviation is actually known.",
    inputs: [
      { kind: "numeric-column", key: "column", label: "Column" },
      { kind: "number", key: "mu0", label: "Null mean (μ₀)", default: 0 },
      { kind: "number", key: "sigma", label: "Population SD (σ)", default: 1 },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      oneSampleZTest(get("column"), getColumn("column"), num(get, "mu0", 0), num(get, "sigma", 1), get("tail") as Tail),
  },
  {
    id: "one-way-anova",
    group: "ANOVA",
    label: "One-way ANOVA",
    whenToUse: "Compare means across three or more groups at once, without inflating your error rate by running many t-tests.",
    inputs: [
      { kind: "numeric-column", key: "response", label: "Response column" },
      { kind: "categorical-column", key: "group", label: "Group column" },
    ],
    run: (get, getColumn) => oneWayAnova(get("response"), get("group"), getColumn("response"), getColumn("group")),
  },
  {
    id: "chi-square-gof",
    group: "Chi-Square",
    label: "Goodness-of-fit test",
    whenToUse: "Check whether one categorical variable's observed counts match an expected distribution (e.g. equally likely categories).",
    inputs: [{ kind: "categorical-column", key: "column", label: "Column" }],
    run: (get, getColumn) => chiSquareGOF(get("column"), getColumn("column")),
  },
  {
    id: "chi-square-independence",
    group: "Chi-Square",
    label: "Test of independence",
    whenToUse: "Check whether two categorical variables are related, using a contingency table of their combined counts.",
    inputs: [
      { kind: "categorical-column", key: "columnA", label: "Column A" },
      { kind: "categorical-column", key: "columnB", label: "Column B" },
    ],
    run: (get, getColumn) => chiSquareIndependence(get("columnA"), get("columnB"), getColumn("columnA"), getColumn("columnB")),
  },
  {
    id: "one-prop-z",
    group: "Proportions",
    label: "One-proportion z-test",
    whenToUse: "Test whether the proportion of rows in one category (a \"success\") differs from a claimed value p₀ (Section 4.4).",
    inputs: [
      { kind: "categorical-column", key: "column", label: "Column" },
      { kind: "category-value", key: "success", label: "Success value", column: "column" },
      { kind: "number", key: "p0", label: "Null proportion (p₀)", default: 0.5 },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      onePropZTest(get("column"), getColumn("column"), get("success"), num(get, "p0", 0.5), get("tail") as Tail),
  },
  {
    id: "two-prop-z",
    group: "Proportions",
    label: "Two-proportion z-test",
    whenToUse: "Compare the proportion of successes in two groups, like an A/B test (Section 4.5).",
    inputs: [
      { kind: "categorical-column", key: "response", label: "Response column" },
      { kind: "category-value", key: "success", label: "Success value", column: "response" },
      { kind: "categorical-column", key: "group", label: "Group column (2 levels)" },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      twoPropZTest(get("response"), get("group"), getColumn("response"), getColumn("group"), get("success"), get("tail") as Tail),
  },
  {
    id: "sign-test",
    group: "Nonparametric",
    label: "Sign test",
    whenToUse: "Test a claim about a median using only whether each value is above or below it. Needs almost no assumptions (Section 4.10).",
    inputs: [
      { kind: "numeric-column", key: "column", label: "Column" },
      { kind: "number", key: "m0", label: "Null median (M₀)", default: 0 },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) => signTest(get("column"), getColumn("column"), num(get, "m0", 0), get("tail") as Tail),
  },
  {
    id: "wilcoxon-signed-rank",
    group: "Nonparametric",
    label: "Wilcoxon signed-rank",
    whenToUse: "The nonparametric alternative to the paired t-test, for before/after data that are skewed or have outliers (Section 4.10).",
    inputs: [
      { kind: "numeric-column", key: "column1", label: "Column 1" },
      { kind: "numeric-column", key: "column2", label: "Column 2" },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      wilcoxonSignedRank(get("column1"), get("column2"), getColumn("column1"), getColumn("column2"), get("tail") as Tail),
  },
  {
    id: "mann-whitney",
    group: "Nonparametric",
    label: "Mann-Whitney U",
    whenToUse: "The nonparametric alternative to the two-sample t-test: compares two independent groups using ranks (Section 4.10).",
    inputs: [
      { kind: "numeric-column", key: "response", label: "Response column" },
      { kind: "categorical-column", key: "group", label: "Group column (2 levels)" },
      { kind: "tail", key: "tail", label: "Alternative (Hₐ)" },
    ],
    run: (get, getColumn) =>
      mannWhitney(get("response"), get("group"), getColumn("response"), getColumn("group"), get("tail") as Tail),
  },
  {
    id: "kruskal-wallis",
    group: "Nonparametric",
    label: "Kruskal-Wallis",
    whenToUse: "The nonparametric alternative to one-way ANOVA: compares three or more groups using ranks (Section 4.10).",
    inputs: [
      { kind: "numeric-column", key: "response", label: "Response column" },
      { kind: "categorical-column", key: "group", label: "Group column" },
    ],
    run: (get, getColumn) => kruskalWallis(get("response"), get("group"), getColumn("response"), getColumn("group")),
  },
  {
    id: "pearson-correlation",
    group: "Correlation & Regression",
    label: "Pearson correlation",
    whenToUse: "Measure the strength and direction of a linear relationship between two numeric variables.",
    inputs: [
      { kind: "numeric-column", key: "x", label: "X column" },
      { kind: "numeric-column", key: "y", label: "Y column" },
    ],
    run: (get, getColumn) => pearsonCorrelation(get("x"), get("y"), getColumn("x"), getColumn("y")),
  },
  {
    id: "spearman-correlation",
    group: "Correlation & Regression",
    label: "Spearman correlation",
    whenToUse: "Measure a monotonic relationship using ranks. Use it instead of Pearson when the data are ranks, skewed, or have outliers (Section 5.1).",
    inputs: [
      { kind: "numeric-column", key: "x", label: "X column" },
      { kind: "numeric-column", key: "y", label: "Y column" },
    ],
    run: (get, getColumn) => spearmanCorrelation(get("x"), get("y"), getColumn("x"), getColumn("y")),
  },
  {
    id: "simple-linear-regression",
    group: "Correlation & Regression",
    label: "Simple linear regression",
    whenToUse: "Model and predict one numeric variable from another, and quantify how much of the variation it explains.",
    inputs: [
      { kind: "numeric-column", key: "x", label: "X (predictor) column" },
      { kind: "numeric-column", key: "y", label: "Y (response) column" },
    ],
    run: (get, getColumn) => simpleLinearRegression(get("x"), get("y"), getColumn("x"), getColumn("y")),
  },
];
