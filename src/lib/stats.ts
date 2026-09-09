// Statistical math utilities used by interactive widgets.
// All functions match R's dnorm/pnorm/dt/pt/dchisq/pchisq conventions.

function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const c = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += c[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function dnorm(x: number, mean = 0, sd = 1): number {
  return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}

function erf(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const poly = t * Math.exp(-x * x - 1.26551223
    + t * (1.00002368 + t * (0.37409196 + t * (0.09678418
    + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398
    + t * (1.48851587 + t * (-0.82215223 + t * 0.17087294)))))))));
  return x >= 0 ? 1 - poly : poly - 1;
}

export function pnorm(x: number, mean = 0, sd = 1): number {
  return (1 + erf((x - mean) / (sd * Math.SQRT2))) / 2;
}

export function dt(x: number, df: number): number {
  return Math.exp(
    lgamma((df + 1) / 2) - lgamma(df / 2) -
    0.5 * Math.log(df * Math.PI) -
    ((df + 1) / 2) * Math.log(1 + x * x / df)
  );
}

function betacf(a: number, b: number, x: number): number {
  const EPS = 3e-7, FPMIN = 1e-30;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d; let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
  if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
  return 1 - bt * betacf(b, a, 1 - x) / b;
}

export function pt(t: number, df: number): number {
  const x = df / (df + t * t);
  const p = betai(df / 2, 0.5, x) / 2;
  return t < 0 ? p : 1 - p;
}

export function dchisq(x: number, df: number): number {
  if (x <= 0) return 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.log(2) - lgamma(k));
}

function gammaInc(a: number, x: number): number {
  if (x < a + 1) {
    let ap = a, del = 1 / a, sum = del;
    for (let n = 1; n <= 200; n++) {
      ap++; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-7) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a, c = 1 / 1e-30, d = 1 / b, h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-7) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

export function pchisq(x: number, df: number): number {
  if (x <= 0) return 0;
  return gammaInc(df / 2, x / 2);
}

export function pf(x: number, df1: number, df2: number): number {
  if (x <= 0) return 0;
  return betai(df1 / 2, df2 / 2, (df1 * x) / (df1 * x + df2));
}

// Seeded LCG for reproducible random numbers in simulations. Widgets
// typically reseed with `seed`, `seed + 1`, `seed + 2`, ... on each
// "Resample" click; an LCG's *first* output for two consecutive integer
// seeds is nearly identical (its state has only gone through one
// multiply-add step, not enough to decorrelate), so a widget that only
// draws once per reseed -- rather than many draws in a row -- would look
// stuck on the same result across clicks. Running the seed through a
// full-avalanche integer hash first (splitmix32-style) fixes that: a
// one-bit difference in the input flips roughly half the output bits.
function hashSeed(x: number): number {
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}

export function makeLCG(seed: number) {
  let s = hashSeed(seed);
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// ---- Quantile (inverse CDF) functions ----
// Used to find critical values / rejection-region boundaries for charting
// a test's sampling distribution -- not meant to be R-exact, just close
// enough to draw where the shaded region should start.

/** Standard normal quantile via a Beasley-Springer-Moro rational approximation. */
export function qnorm(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) return -qnorm(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Student-t quantile: a Cornish-Fisher correction on top of the normal quantile. */
export function qt(p: number, df: number): number {
  const z = qnorm(p);
  const g1 = (z ** 3 + z) / (4 * df);
  const g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2);
  return z + g1 + g2;
}

/** Chi-square quantile via bisection on pchisq (monotonic, so this is exact
 * up to the tolerance below -- no closed-form inverse needed). */
export function qchisq(p: number, df: number): number {
  let lo = 0, hi = df + 10 * Math.sqrt(2 * df) + 50;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (pchisq(mid, df) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
