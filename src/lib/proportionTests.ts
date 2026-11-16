// Hypothesis tests for proportions (Sections 4.4 and 4.5), for the Analyzer.
//
// These follow the textbook's formulas exactly, so a student can check their
// hand calculations: the z statistic uses p0 (one proportion) or the pooled
// proportion (two proportions) in its standard error, and the confidence
// interval is the Wald interval from Section 4.2. The z statistic and
// p-value match R's prop.test(..., correct = FALSE); R's own confidence
// interval uses a different method (Wilson), so that line is labeled.

import { pnorm, qnorm } from "@/lib/stats";
import { isMissingValue } from "@/lib/columnStats";
import { CHART_ALPHA, fmt, pValueString, type Tail, type TestResult } from "@/lib/testRunners";

function zPValue(z: number, tail: Tail): number {
  if (tail === "less") return pnorm(z);
  if (tail === "greater") return 1 - pnorm(z);
  return 2 * Math.min(pnorm(z), 1 - pnorm(z));
}

function altText(tail: Tail) {
  return tail === "less" ? "less than" : tail === "greater" ? "greater than" : "not equal to";
}

/** A short warning when the success-failure condition fails. */
function conditionNote(checks: [string, number][]): string {
  const failing = checks.filter(([, v]) => v < 10);
  if (failing.length === 0) return "";
  return `\n\nWarning: success-failure condition not met (${failing
    .map(([label, v]) => `${label} = ${fmt(v, 1)}`)
    .join(", ")} < 10), so the normal approximation may be inaccurate.`;
}

// ---- One-proportion z-test ----
export function onePropZTest(
  columnName: string,
  values: string[],
  success: string,
  p0: number,
  tail: Tail,
): TestResult {
  if (!(p0 > 0 && p0 < 1)) throw new Error("The null proportion (p₀) must be between 0 and 1.");
  const obs = values.filter((v) => !isMissingValue(v));
  const n = obs.length;
  if (n === 0) throw new Error(`"${columnName}" has no values.`);
  const x = obs.filter((v) => v === success).length;
  const pHat = x / n;
  const se0 = Math.sqrt((p0 * (1 - p0)) / n);
  const z = (pHat - p0) / se0;
  const p = zPValue(z, tail);
  const seHat = Math.sqrt((pHat * (1 - pHat)) / n);
  const zStar = qnorm(0.975);

  const rOutput = `\tOne-proportion z-test
\t(z and p-value match prop.test(x, n, p = ${p0}, correct = FALSE))

data:  ${columnName} == "${success}": x = ${x}, n = ${n}
z = ${fmt(z, 4)}, p-value = ${pValueString(p)}
alternative hypothesis: true p is ${altText(tail)} ${p0}
95 percent confidence interval (Wald, as in Section 4.2):
 ${fmt(pHat - zStar * seHat, 4)} ${fmt(pHat + zStar * seHat, 4)}
sample estimates:
     p-hat
${fmt(pHat, 7)} ${conditionNote([["n*p0", n * p0], ["n*(1-p0)", n * (1 - p0)]])}`;

  return {
    rOutput,
    chart: { kind: "z-dist", stat: z, tail, alpha: CHART_ALPHA, statLabel: `z = ${fmt(z, 3)}` },
  };
}

// ---- Two-proportion z-test ----
export function twoPropZTest(
  responseName: string,
  groupName: string,
  responseValues: string[],
  groupValues: string[],
  success: string,
  tail: Tail,
): TestResult {
  const counts = new Map<string, { x: number; n: number }>();
  const len = Math.min(responseValues.length, groupValues.length);
  for (let i = 0; i < len; i++) {
    const r = responseValues[i], g = groupValues[i];
    if (r === undefined || g === undefined || isMissingValue(r) || isMissingValue(g)) continue;
    const c = counts.get(g) ?? { x: 0, n: 0 };
    c.n += 1;
    if (r === success) c.x += 1;
    counts.set(g, c);
  }
  const keys = [...counts.keys()];
  if (keys.length !== 2) {
    throw new Error(`A two-proportion test needs exactly 2 groups in "${groupName}" (found ${keys.length}).`);
  }
  const [k1, k2] = keys;
  const { x: x1, n: n1 } = counts.get(k1)!;
  const { x: x2, n: n2 } = counts.get(k2)!;
  const p1 = x1 / n1, p2 = x2 / n2;
  const pool = (x1 + x2) / (n1 + n2);
  const sePool = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
  if (sePool === 0) throw new Error(`Every row has the same value of "${responseName}", so the proportions can't be compared.`);
  const z = (p1 - p2) / sePool;
  const p = zPValue(z, tail);
  const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  const zStar = qnorm(0.975);
  const diff = p1 - p2;

  const rOutput = `\tTwo-proportion z-test (pooled)
\t(z and p-value match prop.test(c(x1, x2), c(n1, n2), correct = FALSE))

data:  ${responseName} == "${success}" by ${groupName}
       group ${k1}: x = ${x1}, n = ${n1}    group ${k2}: x = ${x2}, n = ${n2}
z = ${fmt(z, 4)}, p-value = ${pValueString(p)}
alternative hypothesis: true p(${k1}) - p(${k2}) is ${altText(tail)} 0
pooled proportion: ${fmt(pool, 4)}
95 percent confidence interval for p1 - p2 (unpooled, as in Section 4.5):
 ${fmt(diff - zStar * seDiff, 4)} ${fmt(diff + zStar * seDiff, 4)}
sample estimates:
  prop ${k1}   prop ${k2}
${fmt(p1, 7)} ${fmt(p2, 7)} ${conditionNote([
    [`successes in ${k1}`, n1 * pool], [`failures in ${k1}`, n1 * (1 - pool)],
    [`successes in ${k2}`, n2 * pool], [`failures in ${k2}`, n2 * (1 - pool)],
  ])}`;

  return {
    rOutput,
    chart: { kind: "z-dist", stat: z, tail, alpha: CHART_ALPHA, statLabel: `z = ${fmt(z, 3)}` },
  };
}
