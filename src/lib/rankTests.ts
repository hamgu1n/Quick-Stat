// Nonparametric (rank-based) tests for the Analyzer: sign test, Wilcoxon
// signed-rank, Mann-Whitney U, Kruskal-Wallis (Section 4.10), and
// Spearman's rank correlation (Section 5.1).
//
// Each one follows the same rules R uses, so the printed numbers match
// RStudio: exact p-values for small samples without ties, otherwise a
// normal approximation with R's continuity and tie corrections.

import { pchisq, pnorm, pt } from "@/lib/stats";
import { isMissingValue } from "@/lib/columnStats";
import { fmt, groupBy, mean, pValueString, toNumbers, type Tail, type TestResult } from "@/lib/testRunners";

// ---------- helpers ----------

/** Ranks from 1 (smallest) to n, giving tied values the average of their ranks. */
export function rank(xs: number[]): number[] {
  const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const ranks = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k][1]] = avg;
    i = j + 1;
  }
  return ranks;
}

/** Sizes of each group of tied values (only groups of 2 or more). */
function tieSizes(xs: number[]): number[] {
  const counts = new Map<number, number>();
  for (const v of xs) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.values()].filter((t) => t > 1);
}

function altText(tail: Tail, what: string, value: number | string) {
  const rel = tail === "less" ? "less than" : tail === "greater" ? "greater than" : "not equal to";
  return `alternative hypothesis: true ${what} is ${rel} ${value}`;
}

/** Normal-approximation p-value with R's continuity correction. */
function normalP(stat: number, center: number, sigma: number, tail: Tail): { z: number; p: number } {
  const diff = stat - center;
  const correction = tail === "two.sided" ? Math.sign(diff) * 0.5 : tail === "greater" ? 0.5 : -0.5;
  const z = (diff - correction) / sigma;
  const p =
    tail === "less" ? pnorm(z) : tail === "greater" ? 1 - pnorm(z) : 2 * Math.min(pnorm(z), 1 - pnorm(z));
  return { z, p: Math.min(1, p) };
}

/** P-value from an exact distribution given as counts for stat = 0, 1, 2, ... */
function exactP(counts: number[], stat: number, tail: Tail): number {
  const total = counts.reduce((a, b) => a + b, 0);
  const cdf = (q: number) => {
    let s = 0;
    for (let i = 0; i <= Math.min(q, counts.length - 1); i++) s += counts[i];
    return s / total;
  };
  const lower = cdf(stat); // P(S <= stat)
  const upper = 1 - cdf(stat - 1); // P(S >= stat)
  if (tail === "less") return lower;
  if (tail === "greater") return upper;
  const mid = (counts.length - 1) / 2;
  return Math.min(1, 2 * (stat > mid ? upper : lower));
}

function pairedNumbers(a: string[], b: string[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (x === undefined || y === undefined || isMissingValue(x) || isMissingValue(y)) continue;
    const nx = Number(x), ny = Number(y);
    if (Number.isFinite(nx) && Number.isFinite(ny)) out.push([nx, ny]);
  }
  return out;
}

// ---------- Sign test ----------

/** log of n choose k, built up by sums so large n doesn't overflow. */
function logChoose(n: number, k: number) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

export function signTest(columnName: string, values: string[], m0: number, tail: Tail): TestResult {
  const x = toNumbers(values).filter(Number.isFinite);
  const above = x.filter((v) => v > m0).length;
  const below = x.filter((v) => v < m0).length;
  const n = above + below;
  if (n === 0) throw new Error(`Every value equals ${m0}, so there is nothing to test.`);
  const pmf = Array.from({ length: n + 1 }, (_, k) => Math.exp(logChoose(n, k) - n * Math.LN2));
  const p = exactP(pmf, above, tail);

  const rOutput = `\tSign test (exact binomial)
\t(same as binom.test(${above}, ${n}, p = 0.5))

data:  ${columnName}
values above ${m0}: ${above}, below: ${below}, equal (dropped): ${x.length - n}
number of successes = ${above}, number of trials = ${n}, p-value = ${pValueString(p)}
${altText(tail, "median", m0)}
sample estimates:
median of x
 ${fmt(median(x), 4)} `;
  return { rOutput };
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------- Wilcoxon signed-rank (paired) ----------

/** Exact null distribution of V for n untied ranks: counts for V = 0..n(n+1)/2. */
function signedRankCounts(n: number): number[] {
  const max = (n * (n + 1)) / 2;
  let dist = new Array<number>(max + 1).fill(0);
  dist[0] = 1;
  for (let k = 1; k <= n; k++) {
    const next = dist.slice();
    for (let s = k; s <= max; s++) next[s] += dist[s - k];
    dist = next;
  }
  return dist;
}

export function wilcoxonSignedRank(
  name1: string,
  name2: string,
  values1: string[],
  values2: string[],
  tail: Tail,
): TestResult {
  const pairs = pairedNumbers(values1, values2);
  const allDiffs = pairs.map(([a, b]) => a - b);
  const diffs = allDiffs.filter((d) => d !== 0);
  const zeros = allDiffs.length - diffs.length;
  const n = diffs.length;
  if (n === 0) throw new Error("All the differences are 0, so there is nothing to test.");
  const ranks = rank(diffs.map(Math.abs));
  const V = diffs.reduce((s, d, i) => s + (d > 0 ? ranks[i] : 0), 0);
  const ties = tieSizes(diffs.map(Math.abs));
  const exact = n < 50 && ties.length === 0 && zeros === 0;

  let p: number;
  let method: string;
  let note = "";
  if (exact) {
    p = exactP(signedRankCounts(n), V, tail);
    method = "Wilcoxon signed rank exact test";
  } else {
    const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - ties.reduce((s, t) => s + t ** 3 - t, 0) / 48);
    p = normalP(V, (n * (n + 1)) / 4, sigma, tail).p;
    method = "Wilcoxon signed rank test with continuity correction";
    note = `\nNote: ${[ties.length ? "ties" : "", zeros ? "zero differences" : ""].filter(Boolean).join(" and ") || "a large sample"} - using the normal approximation (R: "cannot compute exact p-value").`;
  }

  const rOutput = `\t${method}

data:  ${name1} and ${name2}  (paired: ${name1} - ${name2})
V = ${fmt(V, Number.isInteger(V) ? 0 : 1)}, p-value = ${pValueString(p)}
${altText(tail, "location shift", 0)}${note}`;
  return { rOutput };
}

// ---------- Mann-Whitney U (Wilcoxon rank-sum) ----------

/** Exact null distribution of W for group sizes m and n: counts for W = 0..m*n. */
function rankSumCounts(m: number, n: number): number[] {
  // ways[k][u] = ways to pick k of the items seen so far with "U" value u,
  // where each chosen item contributes the number of unchosen items before it.
  const maxU = m * n;
  let ways: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(maxU + 1).fill(0));
  ways[0][0] = 1;
  for (let t = 0; t < m + n; t++) {
    const next = ways.map((row) => row.slice().fill(0));
    for (let k = 0; k <= m; k++) {
      const unchosenBefore = t - k;
      for (let u = 0; u <= maxU; u++) {
        const w = ways[k][u];
        if (!w) continue;
        if (unchosenBefore + 1 <= n) next[k][u] += w; // leave item t unchosen
        if (k < m && u + unchosenBefore <= maxU) next[k + 1][u + unchosenBefore] += w; // choose it
      }
    }
    ways = next;
  }
  return ways[m];
}

export function mannWhitney(
  responseName: string,
  groupName: string,
  responseValues: string[],
  groupValues: string[],
  tail: Tail,
): TestResult {
  const groups = groupBy(responseValues, groupValues);
  const keys = [...groups.keys()];
  if (keys.length !== 2) {
    throw new Error(`The Mann-Whitney test needs exactly 2 groups in "${groupName}" (found ${keys.length}).`);
  }
  const [k1, k2] = keys;
  const x = groups.get(k1)!, y = groups.get(k2)!;
  const n1 = x.length, n2 = y.length;
  const ranks = rank([...x, ...y]);
  const W = ranks.slice(0, n1).reduce((a, b) => a + b, 0) - (n1 * (n1 + 1)) / 2;
  const ties = tieSizes([...x, ...y]);
  const exact = n1 < 50 && n2 < 50 && ties.length === 0;

  let p: number;
  let method: string;
  let note = "";
  if (exact) {
    p = exactP(rankSumCounts(n1, n2), W, tail);
    method = "Wilcoxon rank sum exact test";
  } else {
    const N = n1 + n2;
    const sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - ties.reduce((s, t) => s + t ** 3 - t, 0) / (N * (N - 1))));
    p = normalP(W, (n1 * n2) / 2, sigma, tail).p;
    method = "Wilcoxon rank sum test with continuity correction";
    note = `\nNote: ${ties.length ? "ties" : "a large sample"} - using the normal approximation.`;
  }

  const rOutput = `\t${method}  (Mann-Whitney U test)

data:  ${responseName} by ${groupName}  (group ${k1} vs. group ${k2})
W = ${fmt(W, Number.isInteger(W) ? 0 : 1)}, p-value = ${pValueString(p)}
${altText(tail, "location shift", 0)}
group medians: ${k1} = ${fmt(median(x), 4)}, ${k2} = ${fmt(median(y), 4)}${note}`;

  return {
    rOutput,
    chart: { kind: "boxplot", groups: [{ label: k1, values: x }, { label: k2, values: y }], yLabel: responseName, xLabel: groupName },
  };
}

// ---------- Kruskal-Wallis ----------

export function kruskalWallis(
  responseName: string,
  groupName: string,
  responseValues: string[],
  groupValues: string[],
): TestResult {
  const groups = groupBy(responseValues, groupValues);
  const keys = [...groups.keys()];
  if (keys.length < 2) throw new Error(`Need at least 2 groups in "${groupName}".`);
  const all = keys.flatMap((k) => groups.get(k)!);
  const N = all.length;
  const ranks = rank(all);
  let offset = 0;
  let sum = 0;
  for (const k of keys) {
    const n = groups.get(k)!.length;
    const R = ranks.slice(offset, offset + n).reduce((a, b) => a + b, 0);
    sum += (R * R) / n;
    offset += n;
  }
  const ties = tieSizes(all);
  const H = ((12 / (N * (N + 1))) * sum - 3 * (N + 1)) / (1 - ties.reduce((s, t) => s + t ** 3 - t, 0) / (N ** 3 - N));
  const df = keys.length - 1;
  const p = 1 - pchisq(H, df);

  const rOutput = `\tKruskal-Wallis rank sum test

data:  ${responseName} by ${groupName}
Kruskal-Wallis chi-squared = ${fmt(H, 4)}, df = ${df}, p-value = ${pValueString(p)}`;

  return {
    rOutput,
    chart: {
      kind: "boxplot",
      groups: keys.map((k) => ({ label: k, values: groups.get(k)! })),
      yLabel: responseName,
      xLabel: groupName,
    },
  };
}

// ---------- Spearman's rank correlation ----------

/** Algorithm AS 89 (as in R): upper-tail P(S >= is) for Spearman's S. */
function spearmanUpper(is: number, n: number): number {
  if (n <= 9) {
    // Exact: enumerate every permutation of the ranks.
    const perm = Array.from({ length: n }, (_, i) => i + 1);
    let count = 0, total = 0;
    const walk = (k: number) => {
      if (k === n) {
        let s = 0;
        for (let i = 0; i < n; i++) s += (i + 1 - perm[i]) ** 2;
        total++;
        if (s >= is) count++;
        return;
      }
      for (let i = k; i < n; i++) {
        [perm[k], perm[i]] = [perm[i], perm[k]];
        walk(k + 1);
        [perm[k], perm[i]] = [perm[i], perm[k]];
      }
    };
    walk(0);
    return count / total;
  }
  // Edgeworth series approximation.
  const b = 1 / n;
  const x = ((6 * (is - 1) * b) / (n * n - 1) - 1) * Math.sqrt(1 / b - 1);
  let y = x * x;
  const u =
    x * b * (0.2274 + b * (0.2531 + 0.1745 * b) +
      y * (-0.0758 + b * (0.1033 + 0.3932 * b) - y * b * (0.0879 + 0.0151 * b - y * (0.0072 - 0.0831 * b + y * b * (0.0131 - 4.6e-4 * y)))));
  y = u / Math.exp(y / 2);
  return Math.min(1, Math.max(0, y + (1 - pnorm(x))));
}

export function spearmanCorrelation(
  xName: string,
  yName: string,
  xValues: string[],
  yValues: string[],
): TestResult {
  const pairs = pairedNumbers(xValues, yValues);
  const n = pairs.length;
  if (n < 3) throw new Error("Need at least 3 complete paired values.");
  const rx = rank(pairs.map((p) => p[0]));
  const ry = rank(pairs.map((p) => p[1]));
  const mx = mean(rx), my = mean(ry);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  const rho = sxy / Math.sqrt(sxx * syy);
  const S = ((n ** 3 - n) * (1 - rho)) / 6;
  const hasTies = tieSizes(pairs.map((p) => p[0])).length > 0 || tieSizes(pairs.map((p) => p[1])).length > 0;

  let p: number;
  let note = "";
  if (!hasTies && n <= 1290) {
    const q = Math.round(S);
    const half = (n ** 3 - n) / 6;
    const pOne = q > half ? spearmanUpper(q, n) : 1 - spearmanUpper(q + 2, n);
    p = Math.min(1, 2 * pOne);
  } else {
    const t = rho / Math.sqrt((1 - rho * rho) / (n - 2));
    p = 2 * Math.min(pt(t, n - 2), 1 - pt(t, n - 2));
    note = "\nNote: the data have ties, so the p-value uses the t approximation (R: \"Cannot compute exact p-value with ties\").";
  }

  const rOutput = `\tSpearman's rank correlation rho

data:  ${xName} and ${yName}
S = ${fmt(S, Math.abs(S - Math.round(S)) < 1e-6 ? 0 : 2)}, p-value = ${pValueString(p)}
alternative hypothesis: true rho is not equal to 0
sample estimates:
      rho
${fmt(rho, 7)} ${note}`;

  return {
    rOutput,
    chart: { kind: "scatter", points: pairs.map(([x, y]) => ({ x, y })), xLabel: xName, yLabel: yName },
  };
}

