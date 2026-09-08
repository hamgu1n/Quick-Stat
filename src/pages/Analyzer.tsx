import { useState } from "react";
import { Sigma } from "lucide-react";
import { CsvUpload } from "@/components/CsvUpload";
import { DataTable } from "@/components/DataTable";
import { SummaryStatsPanel } from "@/components/analyzer/SummaryStatsPanel";
import { TestRunnerPanel } from "@/components/analyzer/TestRunnerPanel";
import { GraphsPanel, type GraphConfig } from "@/components/analyzer/GraphsPanel";
import { DashboardPanel, type PinnedGraph } from "@/components/analyzer/DashboardPanel";
import { StatsToolbar, type StatsTab } from "@/components/analyzer/StatsToolbar";
import type { Dataset } from "@/types/dataset";
import type { TestHistoryEntry } from "@/lib/testHistory";

export default function Analyzer() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [statsTab, setStatsTab] = useState<StatsTab>("data");
  // Bumped only when a dataset is actually (re)loaded -- used as a React
  // key so each tab's own state (selected test, chosen columns, chart
  // type, results) resets cleanly on a new upload, but otherwise survives
  // switching between tabs, since all four stay mounted below and are just
  // hidden rather than unmounted.
  const [datasetVersion, setDatasetVersion] = useState(0);

  // Fed by TestRunnerPanel and GraphsPanel, only when explicitly pinned via
  // their own "Add to Dashboard" buttons, so the Dashboard tab can show
  // "the tests used" and multiple graphs -- each individually removable --
  // without re-deriving or re-running anything itself.
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([]);
  const [pinnedGraphs, setPinnedGraphs] = useState<PinnedGraph[]>([]);

  function handleDatasetLoad(d: Dataset) {
    setDataset(d);
    setDatasetVersion((v) => v + 1);
    setTestHistory([]);
    setPinnedGraphs([]);
  }

  function addGraphToDashboard(config: GraphConfig) {
    setPinnedGraphs((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, config }]);
  }

  return (
    <div className="analyzer-page">
      <div className="analyzer-toolbar">
        <div className="analyzer-toolbar-inner">
          <span className="analyzer-toolbar-brand">
            <Sigma size={18} strokeWidth={2} />
            Analyzer
          </span>
          {dataset && <StatsToolbar active={statsTab} onChange={setStatsTab} />}
          <div className="analyzer-toolbar-spacer" />
          <div className="ribbon-group">
            <CsvUpload variant="compact" onDatasetLoad={handleDatasetLoad} loaded={!!dataset} />
          </div>
        </div>
      </div>

      <div className="analyzer-page-content">
        {!dataset ? (
          <>
            <p className="analyzer-intro">
              Upload a CSV, then explore it: view your data, see summary statistics, run a
              statistical test, or chart a column.
            </p>
            <div className="analyzer-empty-state">
              <CsvUpload variant="prominent" onDatasetLoad={handleDatasetLoad} />
            </div>
          </>
        ) : (
          <section className="analyzer-section" key={datasetVersion}>
            <div hidden={statsTab !== "data"}><DataTable dataset={dataset} /></div>
            <div hidden={statsTab !== "summary"}><SummaryStatsPanel dataset={dataset} /></div>
            <div hidden={statsTab !== "tests"}>
              <TestRunnerPanel
                dataset={dataset}
                onAddToDashboard={(entry) => setTestHistory((prev) => [...prev, entry])}
              />
            </div>
            <div hidden={statsTab !== "graphs"}>
              <GraphsPanel dataset={dataset} onAddToDashboard={addGraphToDashboard} />
            </div>
            <div hidden={statsTab !== "dashboard"}>
              <DashboardPanel
                dataset={dataset}
                testHistory={testHistory}
                pinnedGraphs={pinnedGraphs}
                onRemoveTest={(id) => setTestHistory((prev) => prev.filter((t) => t.id !== id))}
                onRemoveGraph={(id) => setPinnedGraphs((prev) => prev.filter((g) => g.id !== id))}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
