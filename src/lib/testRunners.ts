// Statistical test runners for the Analyzer. Each test takes real columns
// pulled from the uploaded dataset, computes the result in JS (same math
// used by the textbook widgets, see src/lib/stats.ts), and formats the
// result as text styled after what R prints to the console -- e.g. what
// `t.test(x, mu = 100)` would show in RStudio. No real R runs; this is a
// JS simulation of R's printed output.

import { pt, pnorm, pchisq, pf, qnorm, qt } from "@/lib/stats";
import { isMissingValue } from "@/lib/columnStats";

export type Tail = "two.sided" | "less" | "greater";

/** Chart the TestRunnerPanel can render alongside a test's R-style output.
 * Each test attaches whichever of these actually helps a student read the
 * result -- the sampling distribution with the rejection region shaded for
 * a hypothesis test, a boxplot per group for ANOVA, or the raw data with a
 * fitted line for correlation/regression. */
export type ChartSpec =
  | { kind: "t-dist"; stat: number; df: number; tail: Tail; alpha: number; statLabel: string }
  | { kind: "z-dist"; stat: number; tail: Tail; alpha: number; statLabel: string }
  | { kind: "chisq-dist"; stat: number; df: number; alpha: number; statLabel: string }
  | { kind: "boxplot"; groups: { label: string; values: number[] }[]; yLabel: string; xLabel: string }
  | { kind: "scatter"; points: { x: number; y: number }[]; slope?: number; intercept?: number; xLabel: string; yLabel: string };

export type TestResult = {
  rOutput: string;
  chart?: ChartSpec;
};

// Rejection regions are drawn at the conventional alpha = 0.05, regardless
// of the tail/mu0/etc. the student chose -- it's just the shading, not part
// of the printed R output, so it's labeled on the chart itself.
const CHART_ALPHA = 0.05;

function toNumbers(values: string[]): number[] {
  return values.filter((v) => !isMissingValue(v)).map(Number);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sd(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

function groupBy(numeric: string[], group: string[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (let i = 0; i < numeric.length; i++) {
    const g = group[i];
    const v = numeric[i];
    if (g === undefined || isMissingValue(g) || v === undefined || isMissingValue(v)) continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(n);
  }
  return map;
}

function fmt(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return "NaN";
  return x.toFixed(digits);
}

function pValueString(p: number): string {
  return p < 2.2e-16 ? "< 2.2e-16" : fmt(p, p < 0.001 ? 6 : 4);
}

function tailPValue(t: number, df: number, tail: Tail): number {
  if (tail === "less") return pt(t, df);
  if (tail === "greater") return 1 - pt(t, df);
  return 2 * Math.min(pt(t, df), 1 - pt(t, df));
}

// ---- One-sample t-test ----
export function oneSampleTTest(
  columnName: string,
  values: string[],
  mu0: number,
  tail: Tail,
): TestResult {
  const x = toNumbers(values);
  if (x.length < 2) throw new Error("Need at least 2 numeric values to run a t-test.");
  const n = x.length;
  const xbar = mean(x);
  const s = sd(x);
  const se = s / Math.sqrt(n);
  const t = (xbar - mu0) / se;
  const df = n - 1;
  const p = tailPValue(t, df, tail);
  const tCrit = 1.96; // approx, only used for a rough CI display note
  const ciLevel = 0.95;
  const alpha = 1 - ciLevel;
  const tStar = qt(1 - alpha / 2, df);
  const lo = xbar - tStar * se;
  const hi = xbar + tStar * se;
  void tCrit;

  const alt = tail === "less" ? "less than" : tail === "greater" ? "greater than" : "not equal to";

  const rOutput = `\tOne Sample t-test

data:  ${columnName}
t = ${fmt(t, 4)}, df = ${df}, p-value = ${pValueString(p)}
alternative hypothesis: true mean is ${alt} ${mu0}
95 percent confidence interval:
 ${fmt(lo, 4)} ${fmt(hi, 4)}
sample estimates:
mean of x
 ${fmt(xbar, 4)} `;

  return {
    rOutput,
    chart: { kind: "t-dist", stat: t, df, tail, alpha: CHART_ALPHA, statLabel: `t = ${fmt(t, 3)}` },
  };
}

// ---- One-sample z-test ----
export function oneSampleZTest(
  columnName: string,
  values: string[],
  mu0: number,
  sigma: number,
  tail: Tail,
): TestResult {
  const x = toNumbers(values);
  if (x.length < 1) throw new Error("Need at least 1 numeric value to run a z-test.");
  if (sigma <= 0) throw new Error("Population SD (sigma) must be greater than 0.");
  const n = x.length;
  const xbar = mean(x);
  const se = sigma / Math.sqrt(n);
  const z = (xbar - mu0) / se;

  let p: number;
  if (tail === "less") p = pnorm(z);
  else if (tail === "greater") p = 1 - pnorm(z);
  else p = 2 * Math.min(pnorm(z), 1 - pnorm(z));

  const lo = xbar - qnorm(0.975) * se;
  const hi = xbar + qnorm(0.975) * se;
  const alt = tail === "less" ? "less than" : tail === "greater" ? "greater than" : "not equal to";

  const rOutput = `\tOne-sample z-test (simulated, base R has no built-in z.test)

data:  ${columnName}
z = ${fmt(z, 4)}, p-value = ${pValueString(p)}
alternative hypothesis: true mean is ${alt} ${mu0}
95 percent confidence interval:
 ${fmt(lo, 4)} ${fmt(hi, 4)}
sample estimates:
mean of x
 ${fmt(xbar, 4)} `;

  return {
    rOutput,
    chart: { kind: "z-dist", stat: z, tail, alpha: CHART_ALPHA, statLabel: `z = ${fmt(z, 3)}` },
  };
}

// ---- Two-sample (Welch) t-test ----
export function twoSampleTTest(
  responseName: string,
  groupName: string,
  responseValues: string[],
  groupValues: string[],
  tail: Tail,
): TestResult {
  const groups = groupBy(responseValues, groupValues);
  const keys = [...groups.keys()];
  if (keys.length !== 2) {
    throw new Error(
      `A two-sample t-test needs exactly 2 groups in "${groupName}" (found ${keys.length}).`,
    );
  }
  const [k1, k2] = keys;
  const x1 = groups.get(k1)!;
  const x2 = groups.get(k2)!;
  if (x1.length < 2 || x2.length < 2) throw new Error("Each group needs at least 2 values.");

  const m1 = mean(x1), m2 = mean(x2);
  const v1 = sd(x1) ** 2, v2 = sd(x2) ** 2;
  const n1 = x1.length, n2 = x2.length;
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = (m1 - m2) / se;
  const df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const p = tailPValue(t, df, tail);
  const tStar = qt(0.975, df);
  const diff = m1 - m2;
  const lo = diff - tStar * se;
  const hi = diff + tStar * se;
  const alt = tail === "less" ? "less than" : tail === "greater" ? "greater than" : "not equal to";

  const rOutput = `\tWelch Two Sample t-test

data:  ${responseName} by ${groupName}
t = ${fmt(t, 4)}, df = ${fmt(df, 2)}, p-value = ${pValueString(p)}
alternative hypothesis: true difference in means between group ${k1} and group ${k2} is ${alt} 0
95 percent confidence interval:
 ${fmt(lo, 4)} ${fmt(hi, 4)}
sample estimates:
mean in group ${k1} mean in group ${k2}
 ${fmt(m1, 4)}   ${fmt(m2, 4)} `;

  return {
    rOutput,
    chart: { kind: "t-dist", stat: t, df, tail, alpha: CHART_ALPHA, statLabel: `t = ${fmt(t, 3)}` },
  };
}

// ---- Paired t-test ----
export function pairedTTest(
  name1: string,
  name2: string,
  values1: string[],
  values2: string[],
  tail: Tail,
): TestResult {
  const n = Math.min(values1.length, values2.length);
  const diffs: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = values1[i], b = values2[i];
    if (a === undefined || b === undefined || isMissingValue(a) || isMissingValue(b)) continue;
    const na = Number(a), nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) continue;
    diffs.push(na - nb);
  }
  if (diffs.length < 2) throw new Error("Need at least 2 complete paired values.");
  const result = oneSampleTTest(`${name1} - ${name2}`, diffs.map(String), 0, tail);
  return { rOutput: result.rOutput.replace("One Sample t-test", "Paired t-test"), chart: result.chart };
}

// ---- One-way ANOVA ----
export function oneWayAnova(
  responseName: string,
  groupName: string,
  responseValues: string[],
  groupValues: string[],
): TestResult {
  const groups = groupBy(responseValues, groupValues);
  const keys = [...groups.keys()];
  if (keys.length < 2) throw new Error(`Need at least 2 groups in "${groupName}" to run ANOVA.`);

  const all = keys.flatMap((k) => groups.get(k)!);
  const grandMean = mean(all);
  const k = keys.length;
  const N = all.length;

  let ssBetween = 0;
  let ssWithin = 0;
  for (const key of keys) {
    const g = groups.get(key)!;
    const gm = mean(g);
    ssBetween += g.length * (gm - grandMean) ** 2;
    for (const v of g) ssWithin += (v - gm) ** 2;
  }
  const dfBetween = k - 1;
  const dfWithin = N - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msBetween / msWithin;
  const p = 1 - pf(F, dfBetween, dfWithin);
  const sig = p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : p < 0.1 ? "." : " ";

  const rOutput = `# summary(aov(${responseName} ~ ${groupName}))
            Df Sum Sq Mean Sq F value ${" ".repeat(2)}Pr(>F)
${groupName.padEnd(11)} ${dfBetween}  ${fmt(ssBetween, 1)}  ${fmt(msBetween, 2)}  ${fmt(F, 3)} ${pValueString(p)} ${sig}
Residuals   ${dfWithin}  ${fmt(ssWithin, 1)}  ${fmt(msWithin, 2)}
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1`;

  return {
    rOutput,
    chart: {
      kind: "boxplot",
      groups: keys.map((key) => ({ label: key, values: groups.get(key)! })),
      yLabel: responseName,
      xLabel: groupName,
    },
  };
}

// ---- Chi-square goodness-of-fit (assumes equal expected proportions) ----
export function chiSquareGOF(columnName: string, values: string[]): TestResult {
  const nonEmpty = values.filter((v) => !isMissingValue(v));
  const counts = new Map<string, number>();
  for (const v of nonEmpty) counts.set(v, (counts.get(v) ?? 0) + 1);
  const categories = [...counts.keys()];
  if (categories.length < 2) throw new Error(`Need at least 2 categories in "${columnName}".`);
  const n = nonEmpty.length;
  const expected = n / categories.length;
  let chiSq = 0;
  for (const cat of categories) {
    const observed = counts.get(cat)!;
    chiSq += (observed - expected) ** 2 / expected;
  }
  const df = categories.length - 1;
  const p = 1 - pchisq(chiSq, df);

  const rOutput = `\tChi-squared test for given probabilities

data:  table(${columnName})
X-squared = ${fmt(chiSq, 4)}, df = ${df}, p-value = ${pValueString(p)}`;

  return {
    rOutput,
    chart: { kind: "chisq-dist", stat: chiSq, df, alpha: CHART_ALPHA, statLabel: `X² = ${fmt(chiSq, 3)}` },
  };
}

// ---- Chi-square test of independence ----
export function chiSquareIndependence(
  colAName: string,
  colBName: string,
  colA: string[],
  colB: string[],
): TestResult {
  const n = Math.min(colA.length, colB.length);
  const rowsSet = new Set<string>();
  const colsSet = new Set<string>();
  const pairs: [string, string][] = [];
  for (let i = 0; i < n; i++) {
    const a = colA[i], b = colB[i];
    if (a === undefined || b === undefined || isMissingValue(a) || isMissingValue(b)) continue;
    pairs.push([a, b]);
    rowsSet.add(a);
    colsSet.add(b);
  }
  const rows = [...rowsSet];
  const cols = [...colsSet];
  if (rows.length < 2 || cols.length < 2) {
    throw new Error(`Need at least 2 categories in each of "${colAName}" and "${colBName}".`);
  }

  const table: number[][] = rows.map(() => cols.map(() => 0));
  for (const [a, b] of pairs) table[rows.indexOf(a)][cols.indexOf(b)]++;

  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = cols.map((_, j) => table.reduce((a, r) => a + r[j], 0));
  const total = rowTotals.reduce((a, b) => a + b, 0);

  let chiSq = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / total;
      chiSq += (table[i][j] - expected) ** 2 / expected;
    }
  }
  const df = (rows.length - 1) * (cols.length - 1);
  const p = 1 - pchisq(chiSq, df);

  const rOutput = `\tPearson's Chi-squared test

data:  table(${colAName}, ${colBName})
X-squared = ${fmt(chiSq, 4)}, df = ${df}, p-value = ${pValueString(p)}`;

  return {
    rOutput,
    chart: { kind: "chisq-dist", stat: chiSq, df, alpha: CHART_ALPHA, statLabel: `X² = ${fmt(chiSq, 3)}` },
  };
}

// ---- Pearson correlation ----
export function pearsonCorrelation(
  xName: string,
  yName: string,
  xValues: string[],
  yValues: string[],
): TestResult {
  const n = Math.min(xValues.length, yValues.length);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = xValues[i], b = yValues[i];
    if (a === undefined || b === undefined || isMissingValue(a) || isMissingValue(b)) continue;
    const na = Number(a), nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) continue;
    xs.push(na); ys.push(nb);
  }
  if (xs.length < 3) throw new Error("Need at least 3 complete paired values to test correlation.");
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = xs.length - 2;
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  const p = 2 * Math.min(pt(t, df), 1 - pt(t, df));
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const seZ = 1 / Math.sqrt(xs.length - 3);
  const loZ = z - qnorm(0.975) * seZ, hiZ = z + qnorm(0.975) * seZ;
  const loR = (Math.exp(2 * loZ) - 1) / (Math.exp(2 * loZ) + 1);
  const hiR = (Math.exp(2 * hiZ) - 1) / (Math.exp(2 * hiZ) + 1);

  const rOutput = `\tPearson's product-moment correlation

data:  ${xName} and ${yName}
t = ${fmt(t, 4)}, df = ${df}, p-value = ${pValueString(p)}
alternative hypothesis: true correlation is not equal to 0
95 percent confidence interval:
 ${fmt(loR, 4)} ${fmt(hiR, 4)}
sample estimates:
      cor
${fmt(r, 7)} `;

  const slope = sxy / sxx;
  const intercept = my - slope * mx;

  return {
    rOutput,
    chart: {
      kind: "scatter",
      points: xs.map((x, i) => ({ x, y: ys[i] })),
      slope,
      intercept,
      xLabel: xName,
      yLabel: yName,
    },
  };
}

// ---- Simple linear regression ----
export function simpleLinearRegression(
  xName: string,
  yName: string,
  xValues: string[],
  yValues: string[],
): TestResult {
  const n = Math.min(xValues.length, yValues.length);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = xValues[i], b = yValues[i];
    if (a === undefined || b === undefined || isMissingValue(a) || isMissingValue(b)) continue;
    const na = Number(a), nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) continue;
    xs.push(na); ys.push(nb);
  }
  if (xs.length < 3) throw new Error("Need at least 3 complete paired values to fit a regression.");
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const nObs = xs.length;
  const df = nObs - 2;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < nObs; i++) {
    const pred = intercept + slope * xs[i];
    ssRes += (ys[i] - pred) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const rSquared = 1 - ssRes / ssTot;
  const adjRSquared = 1 - (1 - rSquared) * (nObs - 1) / df;
  const residualSE = Math.sqrt(ssRes / df);
  const seSlope = residualSE / Math.sqrt(sxx);
  const seIntercept = residualSE * Math.sqrt(1 / nObs + mx ** 2 / sxx);
  const tSlope = slope / seSlope;
  const tIntercept = intercept / seIntercept;
  const pSlope = 2 * Math.min(pt(tSlope, df), 1 - pt(tSlope, df));
  const pIntercept = 2 * Math.min(pt(tIntercept, df), 1 - pt(tIntercept, df));
  const F = (rSquared / 1) / ((1 - rSquared) / df);
  const pF = 1 - pf(F, 1, df);

  const sigInt = pIntercept < 0.001 ? "***" : pIntercept < 0.01 ? "**" : pIntercept < 0.05 ? "*" : "";
  const sigSlope = pSlope < 0.001 ? "***" : pSlope < 0.01 ? "**" : pSlope < 0.05 ? "*" : "";

  const rOutput = `Call:
lm(formula = ${yName} ~ ${xName})

Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept) ${fmt(intercept, 4)}   ${fmt(seIntercept, 4)}  ${fmt(tIntercept, 3)} ${pValueString(pIntercept)} ${sigInt}
${xName.padEnd(11)} ${fmt(slope, 4)}   ${fmt(seSlope, 4)}  ${fmt(tSlope, 3)} ${pValueString(pSlope)} ${sigSlope}
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

Residual standard error: ${fmt(residualSE, 4)} on ${df} degrees of freedom
Multiple R-squared:  ${fmt(rSquared, 4)},\tAdjusted R-squared:  ${fmt(adjRSquared, 4)}
F-statistic: ${fmt(F, 2)} on 1 and ${df} DF,  p-value: ${pValueString(pF)}`;

  return {
    rOutput,
    chart: {
      kind: "scatter",
      points: xs.map((x, i) => ({ x, y: ys[i] })),
      slope,
      intercept,
      xLabel: xName,
      yLabel: yName,
    },
  };
}

