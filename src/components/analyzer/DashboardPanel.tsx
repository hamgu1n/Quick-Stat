import { useMemo } from "react";
import { ClipboardList, X } from "lucide-react";
import type { Dataset } from "@/types/dataset";
import { getColumnValues, inferColumnType } from "@/lib/columnStats";
import type { TestHistoryEntry } from "@/lib/testHistory";
import type { GraphConfig } from "@/components/analyzer/GraphsPanel";
import { GraphView } from "@/components/analyzer/GraphsPanel";
import { SummaryStatsPanel } from "@/components/analyzer/SummaryStatsPanel";
import { RConsoleOutput } from "@/components/analyzer/RConsoleOutput";
import { TestResultChart } from "@/components/analyzer/TestResultChart";

/** A graph explicitly pinned to the Dashboard from the Graph tab (via its
 * "Add to Dashboard" button) -- distinct from just whatever chart type is
 * currently live there, so several can be kept side by side. */
export type PinnedGraph = { id: string; config: GraphConfig };

// Kept local (rather than importing from GraphsPanel) since that file
// already exports components -- adding a plain function export there
// trips the fast-refresh lint rule.
const CHART_TYPE_LABELS: Record<GraphConfig["chartType"], string> = {
  histogram: "Histogram",
  boxplot: "Boxplot",
  groupedBoxplot: "Grouped Boxplot",
  scatterplot: "Scatterplot",
  line: "Line / Trend",
  bar: "Bar Chart",
  pie: "Pie Chart",
};

/** A short "what this graph shows" label for a pinned graph's header, e.g.
 * "Scatterplot: Score vs. Hours". */
function pinnedGraphLabel(config: GraphConfig): string {
  const { chartType, numCol, numColY, catCol } = config;
  const columns = [numCol, chartType === "scatterplot" || chartType === "line" ? numColY : "", catCol]
    .filter(Boolean);
  const suffix = columns.length > 0 ? `: ${columns.join(" vs. ")}` : "";
  return `${CHART_TYPE_LABELS[chartType]}${suffix}`;
}

export function DashboardPanel({
  dataset,
  testHistory,
  pinnedGraphs,
  onRemoveTest,
  onRemoveGraph,
}: {
  dataset: Dataset;
  testHistory: TestHistoryEntry[];
  pinnedGraphs: PinnedGraph[];
  onRemoveTest: (id: string) => void;
  onRemoveGraph: (id: string) => void;
}) {
  const overview = useMemo(() => {
    let numeric = 0, categorical = 0;
    dataset.headers.forEach((_, i) => {
      const type = inferColumnType(getColumnValues(dataset.rows, i));
      if (type === "numeric") numeric++; else categorical++;
    });
    return { rows: dataset.rows.length, columns: dataset.headers.length, numeric, categorical };
  }, [dataset]);

  return (
    <div className="dashboard-panel">
      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Dataset overview</h3>
        <div className="dashboard-overview-stats">
          <div className="dashboard-overview-stat">
            <span className="dashboard-overview-stat-value">{overview.rows}</span>
            <span className="dashboard-overview-stat-label">rows</span>
          </div>
          <div className="dashboard-overview-stat">
            <span className="dashboard-overview-stat-value">{overview.columns}</span>
            <span className="dashboard-overview-stat-label">columns</span>
          </div>
          <div className="dashboard-overview-stat">
            <span className="dashboard-overview-stat-value">{overview.numeric}</span>
            <span className="dashboard-overview-stat-label">numeric</span>
          </div>
          <div className="dashboard-overview-stat">
            <span className="dashboard-overview-stat-value">{overview.categorical}</span>
            <span className="dashboard-overview-stat-label">categorical</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Summary statistics</h3>
        <SummaryStatsPanel dataset={dataset} />
      </section>

      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Graphs ({pinnedGraphs.length})</h3>
        {pinnedGraphs.length === 0 ? (
          <p className="dashboard-empty">
            No graphs pinned yet — build one on the Graph tab and click "Add to Dashboard".
          </p>
        ) : (
          <div className="dashboard-test-list">
            {pinnedGraphs.map((pinned) => (
              <div key={pinned.id} className="dashboard-test-entry">
                <div className="dashboard-test-entry-header">
                  <span className="dashboard-test-entry-title">{pinnedGraphLabel(pinned.config)}</span>
                  <button
                    type="button"
                    className="dashboard-entry-remove-btn"
                    onClick={() => onRemoveGraph(pinned.id)}
                    aria-label="Remove this graph from the dashboard"
                    title="Remove"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
                <div className="graphs-panel-chart">
                  <GraphView dataset={dataset} config={pinned.config} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Tests used ({testHistory.length})</h3>
        {testHistory.length === 0 ? (
          <p className="dashboard-empty">
            No tests run yet — run one on the Stat tab and it'll be added here.
          </p>
        ) : (
          <div className="dashboard-test-list">
            {testHistory.map((entry) => (
              <div key={entry.id} className="dashboard-test-entry">
                <div className="dashboard-test-entry-header">
                  <ClipboardList size={15} strokeWidth={2} />
                  <span className="dashboard-test-entry-title">{entry.label}</span>
                  {entry.description && (
                    <span className="dashboard-test-entry-desc">{entry.description}</span>
                  )}
                  <button
                    type="button"
                    className="dashboard-entry-remove-btn"
                    onClick={() => onRemoveTest(entry.id)}
                    aria-label="Remove this test from the dashboard"
                    title="Remove"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
                <div className={`test-runner-results${entry.result.chart ? " test-runner-results--split" : ""}`}>
                  <RConsoleOutput output={entry.result.rOutput} />
                  {entry.result.chart && (
                    <div className="test-runner-chart">
                      <TestResultChart chart={entry.result.chart} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
