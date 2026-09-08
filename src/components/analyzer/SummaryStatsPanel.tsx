import { useMemo } from "react";
import { type Dataset } from "@/types/dataset";
import { getColumnValues, summarizeColumn } from "@/lib/columnStats";

export function SummaryStatsPanel({ dataset }: { dataset: Dataset }) {
  const summaries = useMemo(
    () =>
      dataset.headers.map((header, i) => ({
        header,
        summary: summarizeColumn(getColumnValues(dataset.rows, i)),
      })),
    [dataset],
  );

  return (
    <div className="summary-stats-grid">
      {summaries.map(({ header, summary }) => (
        <div key={header} className="summary-stats-card">
          <div className="summary-stats-card-title">
            <span>{header}</span>
            <span className={`column-type-badge column-type-badge--${summary.type}`}>
              {summary.type === "numeric" ? "Numeric" : "Categorical"}
            </span>
          </div>
          {summary.type === "numeric" ? (
            <dl className="summary-stats-list">
              <div><dt>n</dt><dd>{summary.n}</dd></div>
              <div><dt>Missing</dt><dd>{summary.missing}</dd></div>
              <div><dt>Mean (x̄)</dt><dd>{summary.mean.toFixed(3)}</dd></div>
              <div><dt>Median (x̃)</dt><dd>{summary.median.toFixed(3)}</dd></div>
              <div><dt>SD (s)</dt><dd>{summary.sd.toFixed(3)}</dd></div>
              <div><dt>Min</dt><dd>{summary.min}</dd></div>
              <div><dt>Max</dt><dd>{summary.max}</dd></div>
            </dl>
          ) : (
            <dl className="summary-stats-list">
              <div><dt>n</dt><dd>{summary.n}</dd></div>
              <div><dt>Missing</dt><dd>{summary.missing}</dd></div>
              <div><dt>Unique values</dt><dd>{summary.uniqueCount}</dd></div>
              <div><dt>Mode (Mo)</dt><dd>{summary.mode} ({summary.modeCount}×)</dd></div>
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}
