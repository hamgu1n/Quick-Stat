// Looks at an uploaded dataset's inferred column types (and, for
// categorical columns, how many levels they have) and suggests which tests
// in TEST_DEFS actually make sense to run on it -- so a student doesn't
// have to already know "two numeric columns => correlation" before they
// can find the right tool in the Test Runner.

import type { Dataset } from "@/types/dataset";
import { getColumnValues, inferColumnType, summarizeColumn } from "@/lib/columnStats";
import { TEST_DEFS, type FormValues } from "@/lib/testDefs";

export type Recommendation = {
  testId: string;
  label: string;
  reason: string;
  /** Pre-filled column/option selections to apply when the user picks this suggestion. */
  values: FormValues;
};

const TEST_LABEL = new Map(TEST_DEFS.map((d) => [d.id, d.label]));

function suggest(testId: string, reason: string, values: FormValues): Recommendation {
  return { testId, label: TEST_LABEL.get(testId) ?? testId, reason, values };
}

export function recommendTests(dataset: Dataset): Recommendation[] {
  const numeric: string[] = [];
  const categorical: { header: string; levels: number }[] = [];

  dataset.headers.forEach((header, i) => {
    const values = getColumnValues(dataset.rows, i);
    if (inferColumnType(values) === "numeric") {
      numeric.push(header);
      return;
    }
    const summary = summarizeColumn(values);
    if (summary.type === "categorical" && summary.uniqueCount >= 2) {
      categorical.push({ header, levels: summary.uniqueCount });
    }
  });

  const twoLevel = categorical.find((c) => c.levels === 2);
  const multiLevel = categorical.find((c) => c.levels >= 3);
  const recs: Recommendation[] = [];

  // One numeric response + a 2-level grouping column: compare two means.
  if (twoLevel && numeric.length > 0) {
    recs.push(
      suggest(
        "two-sample-t",
        `"${numeric[0]}" is numeric and "${twoLevel.header}" splits your rows into exactly 2 groups — a natural fit for comparing two group means.`,
        { response: numeric[0], group: twoLevel.header, tail: "two.sided" },
      ),
    );
  }

  // One numeric response + a 3+-level grouping column: compare several means at once.
  if (multiLevel && numeric.length > 0) {
    recs.push(
      suggest(
        "one-way-anova",
        `"${multiLevel.header}" has ${multiLevel.levels} groups — ANOVA compares means across 3 or more groups at once.`,
        { response: numeric[0], group: multiLevel.header },
      ),
    );
  }

  // Two numeric columns: look for a linear relationship.
  if (numeric.length >= 2) {
    recs.push(
      suggest(
        "pearson-correlation",
        `"${numeric[0]}" and "${numeric[1]}" are both numeric — correlation checks whether they move together.`,
        { x: numeric[0], y: numeric[1] },
      ),
    );
  }

  // Two categorical columns: check whether they're related.
  if (categorical.length >= 2) {
    const [a, b] = categorical;
    recs.push(
      suggest(
        "chi-square-independence",
        `"${a.header}" and "${b.header}" are both categorical — a chi-square test checks whether they're related.`,
        { columnA: a.header, columnB: b.header },
      ),
    );
  }

  // Fallbacks for thinner datasets, only offered when nothing above applies.
  if (recs.length === 0 && categorical.length === 1) {
    recs.push(
      suggest(
        "chi-square-gof",
        `"${categorical[0].header}" is your only categorical column — goodness-of-fit checks whether its categories are evenly distributed.`,
        { column: categorical[0].header },
      ),
    );
  }
  if (recs.length === 0 && numeric.length === 1) {
    recs.push(
      suggest(
        "one-sample-t",
        `"${numeric[0]}" is your only numeric column — a one-sample t-test checks whether its mean differs from a value you choose.`,
        { column: numeric[0], mu0: "0", tail: "two.sided" },
      ),
    );
  }

  return recs.slice(0, 3);
}
