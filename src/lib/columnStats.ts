// Helpers for inspecting an uploaded Dataset's columns: inferring whether a
// column is numeric or categorical, and computing summary statistics for it.

export type ColumnType = "numeric" | "categorical";

export type NumericSummary = {
  type: "numeric";
  n: number;
  missing: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
};

export type CategoricalSummary = {
  type: "categorical";
  n: number;
  missing: number;
  uniqueCount: number;
  mode: string;
  modeCount: number;
};

export type ColumnSummary = NumericSummary | CategoricalSummary;

// Common ways students mark a missing value in a spreadsheet export, beyond
// a plain empty cell. Matched case-insensitively after trimming.
const MISSING_MARKERS = new Set(["na", "n/a", "nan", "null", "none", "-", "--", "?"]);

export function isMissingValue(value: string): boolean {
  return MISSING_MARKERS.has(value.trim().toLowerCase());
}

/** A column is numeric if every non-missing value in it parses as a finite number. */
export function inferColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => !isMissingValue(v));
  if (nonEmpty.length === 0) return "categorical";
  const allNumeric = nonEmpty.every((v) => Number.isFinite(Number(v)));
  return allNumeric ? "numeric" : "categorical";
}

export function summarizeColumn(values: string[]): ColumnSummary {
  const missing = values.filter((v) => isMissingValue(v)).length;
  const type = inferColumnType(values);

  if (type === "categorical") {
    const nonEmpty = values.filter((v) => !isMissingValue(v));
    const counts = new Map<string, number>();
    for (const v of nonEmpty) counts.set(v, (counts.get(v) ?? 0) + 1);
    let mode = "";
    let modeCount = -1;
    for (const [value, count] of counts) {
      if (count > modeCount) {
        mode = value;
        modeCount = count;
      }
    }
    return {
      type: "categorical",
      n: nonEmpty.length,
      missing,
      uniqueCount: counts.size,
      mode,
      modeCount: Math.max(modeCount, 0),
    };
  }

  const nums = values.filter((v) => !isMissingValue(v)).map(Number);
  const n = nums.length;

  if (n === 0) {
    return { type: "numeric", n: 0, missing, mean: NaN, median: NaN, sd: NaN, min: NaN, max: NaN };
  }

  const mean = nums.reduce((sum, x) => sum + x, 0) / n;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  // Sample SD is undefined for a single value — report NaN rather than a
  // divide-by-zero result, instead of silently showing 0.
  const sd = n < 2 ? NaN : Math.sqrt(nums.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1));

  return {
    type: "numeric",
    n,
    missing,
    mean,
    median,
    sd,
    min: sorted[0],
    max: sorted[n - 1],
  };
}

/** Pulls one column's values out of a Dataset's rows by header index. */
export function getColumnValues(rows: string[][], columnIndex: number): string[] {
  return rows.map((row) => row[columnIndex] ?? "");
}
