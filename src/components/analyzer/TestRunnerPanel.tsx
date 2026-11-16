import { useMemo, useState } from "react";
import { Lightbulb, LayoutDashboard } from "lucide-react";
import type { Dataset } from "@/types/dataset";
import { getColumnValues, inferColumnType, isMissingValue } from "@/lib/columnStats";
import { TEST_DEFS, type FormValues, type TestDef } from "@/lib/testDefs";
import { recommendTests } from "@/lib/testRecommendations";
import { RConsoleOutput } from "@/components/analyzer/RConsoleOutput";
import { TestResultChart } from "@/components/analyzer/TestResultChart";
import type { TestResult } from "@/lib/testRunners";
import type { TestHistoryEntry } from "@/lib/testHistory";

const TAIL_OPTIONS = [
  { value: "less", label: "less than (left-tailed)" },
  { value: "two.sided", label: "not equal to (two-tailed)" },
  { value: "greater", label: "greater than (right-tailed)" },
];

export function TestRunnerPanel({
  dataset,
  onAddToDashboard,
}: {
  dataset: Dataset;
  /** Called with the current result when the user explicitly pins it to
   * the Dashboard tab -- running a test does not add it by itself, same
   * as graphs need their own "Add to Dashboard" click. */
  onAddToDashboard?: (entry: TestHistoryEntry) => void;
}) {
  const { numericColumns, categoricalColumns } = useMemo(() => {
    const numeric: string[] = [];
    const categorical: string[] = [];
    dataset.headers.forEach((h, i) => {
      const type = inferColumnType(getColumnValues(dataset.rows, i));
      (type === "numeric" ? numeric : categorical).push(h);
    });
    return { numericColumns: numeric, categoricalColumns: categorical };
  }, [dataset]);

  // The distinct values of each column, for "Success value" dropdowns.
  const levelsOf = useMemo(() => {
    const map = new Map<string, string[]>();
    dataset.headers.forEach((h, i) => {
      map.set(h, [...new Set(getColumnValues(dataset.rows, i).filter((v) => !isMissingValue(v)))].sort());
    });
    return map;
  }, [dataset]);

  const groups = useMemo(() => {
    const map = new Map<string, TestDef[]>();
    for (const def of TEST_DEFS) {
      if (!map.has(def.group)) map.set(def.group, []);
      map.get(def.group)!.push(def);
    }
    return map;
  }, []);

  const recommendations = useMemo(() => recommendTests(dataset), [dataset]);

  const [selectedId, setSelectedId] = useState(TEST_DEFS[0].id);
  const selected = TEST_DEFS.find((d) => d.id === selectedId)!;

  const [values, setValues] = useState<FormValues>(() =>
    defaultValues(selected, numericColumns, categoricalColumns, levelsOf),
  );
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectTest(id: string) {
    const def = TEST_DEFS.find((d) => d.id === id)!;
    setSelectedId(id);
    setValues(defaultValues(def, numericColumns, categoricalColumns, levelsOf));
    setResult(null);
    setError(null);
  }

  function applyRecommendation(id: string, prefilled: FormValues) {
    const def = TEST_DEFS.find((d) => d.id === id)!;
    setSelectedId(id);
    // Start from the usual defaults, then layer the recommendation's
    // specific column choices on top so every input still has a value.
    setValues(fillCategoryValues(def, { ...defaultValues(def, numericColumns, categoricalColumns, levelsOf), ...prefilled }, levelsOf));
    setResult(null);
    setError(null);
  }

  function setValue(key: string, v: string) {
    // Changing a column resets any "Success value" that depends on it.
    setValues((prev) => {
      const next = { ...prev, [key]: v };
      for (const input of selected.inputs) {
        if (input.kind === "category-value" && input.column === key) next[input.key] = "";
      }
      return fillCategoryValues(selected, next, levelsOf);
    });
  }

  function run() {
    setError(null);
    try {
      const get = (key: string) => values[key] ?? "";
      const getColumn = (key: string) => {
        const header = values[key];
        const index = dataset.headers.indexOf(header);
        return getColumnValues(dataset.rows, index);
      };
      const res = selected.run(get, getColumn);
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not run this test on the selected columns.");
    }
  }

  return (
    <div className="test-runner">
      {recommendations.length > 0 && (
        <div className="test-runner-recommendations">
          <span className="test-runner-recommendations-label">
            <Lightbulb size={15} strokeWidth={2} />
            Suggested for your data
          </span>
          <div className="test-runner-recommendations-list">
            {recommendations.map((rec) => (
              <button
                key={rec.testId}
                type="button"
                className={`test-runner-recommendation${rec.testId === selectedId ? " test-runner-recommendation--active" : ""}`}
                onClick={() => applyRecommendation(rec.testId, rec.values)}
                title={rec.reason}
              >
                <span className="test-runner-recommendation-title">{rec.label}</span>
                <span className="test-runner-recommendation-reason">{rec.reason}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="test-runner-test-picker">
        {[...groups.entries()].map(([group, defs]) => (
          <div key={group} className="graph-picker">
            <span className="graph-picker-label">{group}</span>
            <div className="graph-picker-options">
              {defs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`graph-chip-btn${selectedId === d.id ? " active" : ""}`}
                  onClick={() => selectTest(d.id)}
                  title={d.whenToUse}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="test-runner-inputs">
        {selected.inputs.map((input) => (
          <label key={input.key} className="test-runner-field">
            <span>{input.label}</span>
            {input.kind === "numeric-column" && (
              <select value={values[input.key] ?? ""} onChange={(e) => setValue(input.key, e.target.value)}>
                {numericColumns.length === 0 && <option value="">No numeric columns</option>}
                {numericColumns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {input.kind === "categorical-column" && (
              <select value={values[input.key] ?? ""} onChange={(e) => setValue(input.key, e.target.value)}>
                {categoricalColumns.length === 0 && <option value="">No categorical columns</option>}
                {categoricalColumns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {input.kind === "number" && (
              <input
                type="number"
                value={values[input.key] ?? ""}
                onChange={(e) => setValue(input.key, e.target.value)}
              />
            )}
            {input.kind === "category-value" && (
              <select value={values[input.key] ?? ""} onChange={(e) => setValue(input.key, e.target.value)}>
                {(levelsOf.get(values[input.column] ?? "") ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {input.kind === "tail" && (
              <select value={values[input.key] ?? "two.sided"} onChange={(e) => setValue(input.key, e.target.value)}>
                {TAIL_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
          </label>
        ))}
      </div>

      <button className="widget-toggle-btn active test-runner-run-btn" onClick={run}>
        Run Test
      </button>

      {error && <p className="test-runner-error">{error}</p>}
      {result && (
        <>
          <div className={`test-runner-results${result.chart ? " test-runner-results--split" : ""}`}>
            <RConsoleOutput output={result.rOutput} />
            {result.chart && (
              <div className="test-runner-chart">
                <TestResultChart chart={result.chart} />
              </div>
            )}
          </div>
          {onAddToDashboard && (
            <button
              type="button"
              className="widget-rcode-toggle graphs-panel-pin-btn"
              onClick={() => onAddToDashboard({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                label: selected.label,
                description: describeRun(selected, values),
                result,
                runAt: Date.now(),
              })}
              title="Pin this test result to the Dashboard tab"
            >
              <LayoutDashboard size={14} strokeWidth={2} />
              Add to Dashboard
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** A short "what this ran against" phrase for the Dashboard tab, e.g.
 * "Score vs. Method" -- just the chosen column names, in input order. */
function describeRun(def: TestDef, values: FormValues): string {
  const columns = def.inputs
    .filter((i) => i.kind === "numeric-column" || i.kind === "categorical-column")
    .map((i) => values[i.key])
    .filter(Boolean);
  return columns.join(" vs. ");
}

function defaultValues(
  def: TestDef,
  numericColumns: string[],
  categoricalColumns: string[],
  levelsOf: Map<string, string[]>,
): FormValues {
  const values: FormValues = {};
  // Useful grouping columns first: skip ID-like columns where every row is
  // different, and prefer columns with few levels.
  const rowCount = Math.max(0, ...[...levelsOf.values()].map((l) => l.length));
  const groupable = [...categoricalColumns]
    .filter((c) => (levelsOf.get(c)?.length ?? 0) >= 2 && (levelsOf.get(c)?.length ?? 0) < rowCount)
    .sort((a, b) => (levelsOf.get(a)?.length ?? 0) - (levelsOf.get(b)?.length ?? 0));
  const categoricalOrder = groupable.length > 0 ? groupable : categoricalColumns;
  const twoLevel = categoricalOrder.filter((c) => levelsOf.get(c)?.length === 2);

  // Tests with two columns of the same kind (X and Y, Column 1 and Column 2,
  // response and group) start with two different columns, not one twice.
  const used = new Set<string>();
  const pick = (options: string[]) => {
    const choice = options.find((c) => !used.has(c)) ?? options[0] ?? "";
    used.add(choice);
    return choice;
  };
  for (const input of def.inputs) {
    if (input.kind === "numeric-column") values[input.key] = pick(numericColumns);
    else if (input.kind === "categorical-column") {
      const wantsTwo = /2 levels/.test(input.label);
      values[input.key] = pick(wantsTwo && twoLevel.length > 0 ? [...twoLevel, ...categoricalOrder] : categoricalOrder);
    } else if (input.kind === "number") values[input.key] = String(input.default);
    else if (input.kind === "tail") values[input.key] = "two.sided";
  }
  return fillCategoryValues(def, values, levelsOf);
}

/** Gives each empty "Success value" the first value of its column. */
function fillCategoryValues(def: TestDef, values: FormValues, levelsOf: Map<string, string[]>): FormValues {
  const out = { ...values };
  for (const input of def.inputs) {
    if (input.kind !== "category-value") continue;
    const levels = levelsOf.get(out[input.column] ?? "") ?? [];
    if (!levels.includes(out[input.key])) out[input.key] = levels[0] ?? "";
  }
  return out;
}
