import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  BarChart3, Boxes, Columns3, BarChart2, Lightbulb, LayoutDashboard,
  ScatterChart as ScatterChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon,
  type LucideIcon,
} from "lucide-react";
import type { Dataset } from "@/types/dataset";
import { getColumnValues, inferColumnType, summarizeColumn } from "@/lib/columnStats";
import { BoxplotChart, ScatterFitChart } from "@/components/analyzer/TestResultChart";

type ChartType = "histogram" | "boxplot" | "groupedBoxplot" | "scatterplot" | "line" | "bar" | "pie";

/** The Graphs tab's current selections -- chart type plus whichever
 * columns/settings that type needs. Lifted out so the Dashboard tab can
 * render "the graph, if one is selected" without duplicating this logic. */
export type GraphConfig = {
  chartType: ChartType;
  numCol: string;
  numColY: string;
  catCol: string;
  bins: number;
};

/** What each chart type needs picked before it can render, so the controls
 * below know which column-picker rows to show. */
type ColumnReq = "num" | "num-num" | "cat" | "num-cat";

const CHART_OPTIONS: { value: ChartType; label: string; icon: LucideIcon; requires: ColumnReq }[] = [
  { value: "histogram", label: "Histogram", icon: BarChart3, requires: "num" },
  { value: "boxplot", label: "Boxplot", icon: Boxes, requires: "num" },
  { value: "groupedBoxplot", label: "Grouped Boxplot", icon: Columns3, requires: "num-cat" },
  { value: "scatterplot", label: "Scatterplot", icon: ScatterChartIcon, requires: "num-num" },
  { value: "line", label: "Line / Trend", icon: LineChartIcon, requires: "num-num" },
  { value: "bar", label: "Bar Chart", icon: BarChart2, requires: "cat" },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon, requires: "cat" },
];

const PIE_COLORS = ["var(--maroon)", "#3b5b8a", "#2a7a3a", "#c9973f", "var(--maroon-muted)", "#7a4fae", "#c0567a", "#4fa3a3"];

/** Whether the dataset actually has the column types a chart type needs --
 * e.g. a scatterplot needs 2 numeric columns, a pie chart needs at least 1
 * categorical one. Drives which chart-type buttons are greyed out. */
function isChartAvailable(requires: ColumnReq, numericColumns: string[], categoricalColumns: string[]): boolean {
  if (requires === "num") return numericColumns.length >= 1;
  if (requires === "num-num") return numericColumns.length >= 2;
  if (requires === "cat") return categoricalColumns.length >= 1;
  return numericColumns.length >= 1 && categoricalColumns.length >= 1; // num-cat
}

function unavailableReason(requires: ColumnReq): string {
  if (requires === "num") return "Needs at least 1 numeric column";
  if (requires === "num-num") return "Needs at least 2 numeric columns";
  if (requires === "cat") return "Needs at least 1 categorical column";
  return "Needs at least 1 numeric and 1 categorical column";
}

function toNumbers(values: string[]): number[] {
  return values.filter((v) => v.trim() !== "").map(Number).filter(Number.isFinite);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function fiveNum(data: number[]) {
  const s = [...data].sort((a, b) => a - b);
  const n = s.length;
  const med = (arr: number[]) => {
    const m = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
  };
  const q2 = med(s);
  const lower = s.slice(0, Math.floor(n / 2));
  const upper = s.slice(n % 2 === 0 ? n / 2 : n / 2 + 1);
  const q1 = med(lower);
  const q3 = med(upper);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const nonOutliers = s.filter((v) => v >= lowerFence && v <= upperFence);
  const outliers = s.filter((v) => v < lowerFence || v > upperFence);
  return { min: nonOutliers[0] ?? s[0], q1, q2, q3, max: nonOutliers[nonOutliers.length - 1] ?? s[n - 1], outliers };
}

/** Simple least-squares fit, used to draw an always-on trend line (and R²)
 * on the plain Graphs-tab scatterplot -- not just on a test result. */
function linearFit(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r2: r * r };
}

function createBins(data: number[], count: number) {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const width = (max - min) / count || 1;
  return Array.from({ length: count }, (_, i) => {
    const lo = min + i * width;
    const hi = lo + width;
    const binCount = data.filter((v) => v >= lo && (i === count - 1 ? v <= hi : v < hi)).length;
    // `bin` (the lower edge) is what positions the bar on the x-axis and
    // is also what ReferenceLine/ReferenceArea below match against;
    // `range` is only for the tooltip.
    return { bin: lo.toFixed(1), lo, hi, range: `${lo.toFixed(1)}–${hi.toFixed(1)}`, count: binCount };
  });
}

/** Which bin's label a raw value falls into -- used to place the
 * mean/median reference lines and IQR shading on the categorical bin axis. */
function binLabelFor(bins: ReturnType<typeof createBins>, value: number): string {
  for (const b of bins) {
    if (value >= b.lo && value < b.hi) return b.bin;
  }
  return bins[bins.length - 1]?.bin ?? "";
}

export function GraphsPanel({
  dataset,
  onAddToDashboard,
}: {
  dataset: Dataset;
  /** Called with a snapshot of the current chart type/columns when the
   * user explicitly pins it to the Dashboard tab. */
  onAddToDashboard?: (config: GraphConfig) => void;
}) {
  const { numericColumns, categoricalColumns, categoricalLevels } = useMemo(() => {
    const numeric: string[] = [];
    const categorical: string[] = [];
    const levels: { header: string; count: number }[] = [];
    dataset.headers.forEach((h, i) => {
      const values = getColumnValues(dataset.rows, i);
      const type = inferColumnType(values);
      if (type === "numeric") { numeric.push(h); return; }
      categorical.push(h);
      const summary = summarizeColumn(values);
      if (summary.type === "categorical") levels.push({ header: h, count: summary.uniqueCount });
    });
    return { numericColumns: numeric, categoricalColumns: categorical, categoricalLevels: levels };
  }, [dataset]);

  // A single best-guess chart type for this dataset's shape, mirroring the
  // same priority the Test tab's recommendations use: a numeric column
  // paired with a real (2+ level) grouping column beats a plain pairwise
  // scatter, which beats a single-column histogram, which beats falling
  // back to counts of a lone categorical column.
  const recommendedChartType = useMemo((): ChartType | null => {
    const hasGroupingCat = categoricalLevels.some((c) => c.count >= 2);
    if (numericColumns.length >= 1 && hasGroupingCat) return "groupedBoxplot";
    if (numericColumns.length >= 2) return "scatterplot";
    if (numericColumns.length >= 1) return "histogram";
    if (categoricalColumns.length >= 1) return "bar";
    return null;
  }, [numericColumns, categoricalColumns, categoricalLevels]);

  const [chartType, setChartType] = useState<ChartType>(() => {
    // Default to "Histogram", but if this dataset can't support it (e.g.
    // it's all-categorical), open on the first chart type that's actually
    // usable instead of landing on a greyed-out one with nothing to show.
    const firstAvailable = CHART_OPTIONS.find((o) => isChartAvailable(o.requires, numericColumns, categoricalColumns));
    return firstAvailable?.value ?? "histogram";
  });
  const [numCol, setNumCol] = useState(numericColumns[0] ?? "");
  const [numColY, setNumColY] = useState(numericColumns[1] ?? numericColumns[0] ?? "");
  const [catCol, setCatCol] = useState(categoricalColumns[0] ?? "");
  const [bins, setBins] = useState(8);

  const activeOption = CHART_OPTIONS.find((o) => o.value === chartType)!;
  const needsNum = activeOption.requires === "num" || activeOption.requires === "num-num" || activeOption.requires === "num-cat";
  const needsNumY = activeOption.requires === "num-num";
  const needsCat = activeOption.requires === "cat" || activeOption.requires === "num-cat";
  const canRender = (!needsNum || numCol) && (!needsNumY || numColY) && (!needsCat || catCol);

  return (
    <div className="graphs-panel">
      <div className="graphs-panel-controls">
        <div className="graph-picker">
          <span className="graph-picker-label">Chart type</span>
          <div className="graph-picker-options">
            {CHART_OPTIONS.map((o) => {
              const Icon = o.icon;
              const available = isChartAvailable(o.requires, numericColumns, categoricalColumns);
              const isRecommended = o.value === recommendedChartType;
              const title = !available
                ? unavailableReason(o.requires)
                : isRecommended ? "Recommended for this dataset" : undefined;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={!available}
                  className={`graph-chip-btn${chartType === o.value ? " active" : ""}${isRecommended ? " graph-chip-btn--recommended" : ""}`}
                  onClick={() => setChartType(o.value)}
                  title={title}
                >
                  <Icon size={15} strokeWidth={2} />
                  {o.label}
                  {isRecommended && <Lightbulb size={12} strokeWidth={2} className="graph-chip-btn-badge" />}
                </button>
              );
            })}
          </div>
        </div>

        {needsNum && (
          <ColumnPicker
            label={needsNumY ? "X column" : "Column"}
            options={numericColumns}
            value={numCol}
            onChange={setNumCol}
          />
        )}
        {needsNumY && (
          <ColumnPicker label="Y column" options={numericColumns} value={numColY} onChange={setNumColY} />
        )}
        {needsCat && (
          <ColumnPicker
            label={activeOption.requires === "num-cat" ? "Group column" : "Column"}
            options={categoricalColumns}
            value={catCol}
            onChange={setCatCol}
          />
        )}

        {chartType === "histogram" && (
          <label className="test-runner-field">
            <span>Bins: {bins}</span>
            <input type="range" min={3} max={20} value={bins} onChange={(e) => setBins(Number(e.target.value))} />
          </label>
        )}
      </div>

      <div className="graphs-panel-chart">
        <GraphView dataset={dataset} config={{ chartType, numCol, numColY, catCol, bins }} />
      </div>

      {onAddToDashboard && (
        <button
          type="button"
          className="widget-rcode-toggle graphs-panel-pin-btn"
          disabled={!canRender}
          onClick={() => onAddToDashboard({ chartType, numCol, numColY, catCol, bins })}
          title={canRender ? "Pin this graph to the Dashboard tab" : "Pick columns for this chart first"}
        >
          <LayoutDashboard size={14} strokeWidth={2} />
          Add to Dashboard
        </button>
      )}
    </div>
  );
}

function ColumnPicker({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="graph-picker">
      <span className="graph-picker-label">{label}</span>
      <div className="graph-picker-options">
        {options.length === 0 && <span className="graphs-panel-empty">None available</span>}
        {options.map((c) => (
          <button
            key={c}
            type="button"
            className={`graph-chip-btn${value === c ? " active" : ""}`}
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The R code that would draw a given GraphConfig in RStudio, in both base
 * R and ggplot2 -- shown under a "Show R Code" toggle, same pattern as the
 * textbook widgets and TestResultChart. */
function graphRCode(config: GraphConfig): { base: string; ggplot: string } {
  const { chartType, numCol, numColY, catCol, bins } = config;
  switch (chartType) {
    case "histogram":
      return {
        base: `hist(data$${numCol},
     breaks = ${bins},
     main = "Histogram of ${numCol}",
     xlab = "${numCol}")`,
        ggplot: `ggplot(data, aes(x = ${numCol})) +
  geom_histogram(bins = ${bins}, fill = "steelblue", color = "black") +
  labs(title = "Histogram of ${numCol}", x = "${numCol}")`,
      };
    case "boxplot":
      return {
        base: `boxplot(data$${numCol},
        main = "Boxplot of ${numCol}",
        ylab = "${numCol}")`,
        ggplot: `ggplot(data, aes(y = ${numCol})) +
  geom_boxplot(fill = "steelblue") +
  labs(title = "Boxplot of ${numCol}", y = "${numCol}")`,
      };
    case "groupedBoxplot":
      return {
        base: `boxplot(${numCol} ~ ${catCol}, data = data,
        main = "${numCol} by ${catCol}",
        xlab = "${catCol}", ylab = "${numCol}")`,
        ggplot: `ggplot(data, aes(x = ${catCol}, y = ${numCol})) +
  geom_boxplot(fill = "steelblue") +
  labs(title = "${numCol} by ${catCol}", x = "${catCol}", y = "${numCol}")`,
      };
    case "scatterplot":
      return {
        base: `plot(data$${numCol}, data$${numColY},
     main = "${numColY} vs ${numCol}",
     xlab = "${numCol}", ylab = "${numColY}")
abline(lm(${numColY} ~ ${numCol}, data = data), col = "blue", lwd = 2)`,
        ggplot: `ggplot(data, aes(x = ${numCol}, y = ${numColY})) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "${numColY} vs ${numCol}", x = "${numCol}", y = "${numColY}")`,
      };
    case "line":
      return {
        base: `data <- data[order(data$${numCol}), ]
plot(data$${numCol}, data$${numColY},
     type = "l",
     main = "${numColY} vs ${numCol}",
     xlab = "${numCol}", ylab = "${numColY}")`,
        // geom_line() connects points in order of the x variable already,
        // so no explicit sort/arrange step is needed here.
        ggplot: `ggplot(data, aes(x = ${numCol}, y = ${numColY})) +
  geom_line(color = "steelblue") +
  geom_point() +
  labs(title = "${numColY} vs ${numCol}", x = "${numCol}", y = "${numColY}")`,
      };
    case "bar":
      return {
        base: `barplot(table(data$${catCol}),
        main = "Bar Chart of ${catCol}",
        xlab = "${catCol}", ylab = "Count")`,
        ggplot: `ggplot(data, aes(x = ${catCol})) +
  geom_bar(fill = "steelblue") +
  labs(title = "Bar Chart of ${catCol}", x = "${catCol}", y = "Count")`,
      };
    case "pie":
      return {
        base: `pie(table(data$${catCol}),
    main = "Pie Chart of ${catCol}")`,
        ggplot: `ggplot(data, aes(x = "", fill = ${catCol})) +
  geom_bar(width = 1) +
  coord_polar(theta = "y") +
  labs(title = "Pie Chart of ${catCol}", fill = "${catCol}") +
  theme_void()`,
      };
  }
}

/** Renders whichever chart a GraphConfig points to. Shared by the Graphs
 * tab's own preview and the Dashboard tab (so "the graph, if one is
 * selected" doesn't need its own copy of this switch). */
export function GraphView({ dataset, config }: { dataset: Dataset; config: GraphConfig }) {
  const [showRCode, setShowRCode] = useState(false);
  const { chartType, numCol, numColY, catCol, bins } = config;
  const columnIndex = (name: string) => dataset.headers.indexOf(name);

  let content: ReactNode = null;
  if (chartType === "histogram" && numCol) {
    content = <Histogram data={toNumbers(getColumnValues(dataset.rows, columnIndex(numCol)))} binCount={bins} />;
  } else if (chartType === "boxplot" && numCol) {
    content = <SingleBoxplot data={toNumbers(getColumnValues(dataset.rows, columnIndex(numCol)))} />;
  } else if (chartType === "groupedBoxplot" && numCol && catCol) {
    content = <GroupedBoxplot dataset={dataset} numCol={numCol} catCol={catCol} />;
  } else if (chartType === "scatterplot" && numCol && numColY) {
    content = (
      <ScatterplotChart
        x={toNumbers(getColumnValues(dataset.rows, columnIndex(numCol)))}
        y={toNumbers(getColumnValues(dataset.rows, columnIndex(numColY)))}
        xLabel={numCol}
        yLabel={numColY}
      />
    );
  } else if (chartType === "line" && numCol && numColY) {
    content = (
      <LineTrendChart
        x={toNumbers(getColumnValues(dataset.rows, columnIndex(numCol)))}
        y={toNumbers(getColumnValues(dataset.rows, columnIndex(numColY)))}
        xLabel={numCol}
        yLabel={numColY}
      />
    );
  } else if (chartType === "bar" && catCol) {
    content = <CategoryBarChart values={getColumnValues(dataset.rows, columnIndex(catCol))} />;
  } else if (chartType === "pie" && catCol) {
    content = <CategoryPieChart values={getColumnValues(dataset.rows, columnIndex(catCol))} />;
  }

  if (!content) return null;

  return (
    <>
      {content}
      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && (() => {
        const code = graphRCode(config);
        return (
          <>
            <p className="widget-rcode-label">Base R</p>
            <pre className="widget-rcode"><code>{code.base}</code></pre>
            <p className="widget-rcode-label">ggplot2</p>
            <pre className="widget-rcode"><code>{code.ggplot}</code></pre>
          </>
        );
      })()}
    </>
  );
}

function Histogram({ data, binCount }: { data: number[]; binCount: number }) {
  const bins = useMemo(() => createBins(data, binCount), [data, binCount]);
  if (data.length === 0) return <p className="graphs-panel-empty">No numeric values in this column.</p>;

  const m = mean(data);
  const { q1, q2: median, q3 } = fiveNum(data);
  const meanBin = binLabelFor(bins, m);
  const medianBin = binLabelFor(bins, median);
  const q1Bin = binLabelFor(bins, q1);
  const q3Bin = binLabelFor(bins, q3);

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bins} barCategoryGap="0%" margin={{ top: 20, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="bin" style={{ fontSize: "0.7rem" }} />
          <YAxis width={30} style={{ fontSize: "0.75rem" }} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [v, "Count"]}
            labelFormatter={(_, payload) => payload[0] ? `Range: ${payload[0].payload.range}` : ""}
          />
          <ReferenceArea x1={q1Bin} x2={q3Bin} fill="var(--maroon)" fillOpacity={0.08} ifOverflow="extendDomain" />
          <Bar dataKey="count" fill="var(--maroon-light)" stroke="var(--maroon)" strokeWidth={1}
            isAnimationActive={false} activeBar={{ fill: "var(--maroon)", fillOpacity: 0.6 }} />
          <ReferenceLine x={medianBin} stroke="#3b5b8a" strokeWidth={2}
            label={{ value: "Median", position: "top", fontSize: 10, fill: "#3b5b8a" }} />
          <ReferenceLine x={meanBin} stroke="var(--maroon)" strokeWidth={2} strokeDasharray="4 3"
            label={{ value: "Mean", position: "top", offset: 22, fontSize: 10, fill: "var(--maroon)" }} />
        </BarChart>
      </ResponsiveContainer>
      <p className="graphs-panel-stats-note">
        Mean = {m.toFixed(2)} · Median = {median.toFixed(2)} · IQR (shaded) = {q1.toFixed(2)} – {q3.toFixed(2)}
      </p>
    </>
  );
}

function SingleBoxplot({ data }: { data: number[] }) {
  if (data.length === 0) return <p className="graphs-panel-empty">No numeric values in this column.</p>;
  const { min, q1, q2, q3, max, outliers } = fiveNum(data);
  const domainMin = Math.min(min, ...outliers);
  const domainMax = Math.max(max, ...outliers);
  const left = 40, right = 540, width = right - left;
  const toX = (v: number) => left + ((v - domainMin) / (domainMax - domainMin || 1)) * width;
  const y = 40, h = 32;

  // Recharts covers the other chart types' hover tooltips; this box plot is
  // hand-drawn SVG, so each shape gets a native <title> instead -- hovering
  // any part shows the browser's own tooltip with its exact value.
  return (
    <svg viewBox={`0 0 580 110`} style={{ width: "100%", overflow: "visible" }}>
      <line x1={left} y1={y + h + 14} x2={right} y2={y + h + 14} stroke="var(--border)" strokeWidth={1} />
      <line x1={toX(min)} y1={y + h / 2} x2={toX(q1)} y2={y + h / 2} stroke="var(--maroon)" strokeWidth={1.5}>
        <title>Lower whisker: {min.toFixed(2)} to {q1.toFixed(2)}</title>
      </line>
      <line x1={toX(q3)} y1={y + h / 2} x2={toX(max)} y2={y + h / 2} stroke="var(--maroon)" strokeWidth={1.5}>
        <title>Upper whisker: {q3.toFixed(2)} to {max.toFixed(2)}</title>
      </line>
      <rect x={toX(q1)} y={y} width={toX(q3) - toX(q1)} height={h} fill="var(--maroon-light)" stroke="var(--maroon)" strokeWidth={1.5}
        style={{ cursor: "default" }}>
        <title>IQR (Q1–Q3): {q1.toFixed(2)} – {q3.toFixed(2)}</title>
      </rect>
      <line x1={toX(q2)} y1={y} x2={toX(q2)} y2={y + h} stroke="var(--maroon)" strokeWidth={2}>
        <title>Median: {q2.toFixed(2)}</title>
      </line>
      {outliers.map((o, i) => (
        <circle key={i} cx={toX(o)} cy={y + h / 2} r={3} fill="var(--background)" stroke="var(--maroon)" strokeWidth={1.5}
          style={{ cursor: "default" }}>
          <title>Outlier: {o.toFixed(2)}</title>
        </circle>
      ))}
      {[domainMin, q1, q2, q3, domainMax].map((v, i) => (
        <text key={i} x={toX(v)} y={y + h + 30} fontSize={10} textAnchor="middle" fill="var(--muted-foreground)">
          {v.toFixed(1)}
        </text>
      ))}
    </svg>
  );
}

function GroupedBoxplot({ dataset, numCol, catCol }: { dataset: Dataset; numCol: string; catCol: string }) {
  const numIndex = dataset.headers.indexOf(numCol);
  const catIndex = dataset.headers.indexOf(catCol);
  const groups = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const row of dataset.rows) {
      const g = row[catIndex];
      const v = Number(row[numIndex]);
      if (!g || g.trim() === "" || !Number.isFinite(v)) continue;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(v);
    }
    return [...map.entries()].map(([label, values]) => ({ label, values }));
  }, [dataset, numIndex, catIndex]);

  if (groups.length === 0) return <p className="graphs-panel-empty">No data to group.</p>;
  return <BoxplotChart groups={groups} yLabel={numCol} />;
}

function ScatterplotChart({ x, y, xLabel, yLabel }: { x: number[]; y: number[]; xLabel: string; yLabel: string }) {
  const n = Math.min(x.length, y.length);
  if (n === 0) return <p className="graphs-panel-empty">No paired numeric values.</p>;
  const points = Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i] }));
  const fit = linearFit(x, y);

  return (
    <>
      <ScatterFitChart points={points} slope={fit?.slope} intercept={fit?.intercept} xLabel={xLabel} yLabel={yLabel} />
      {fit && (
        <p className="graphs-panel-stats-note">
          Trend line: y = {fit.slope.toFixed(3)}x + {fit.intercept.toFixed(3)} · R² = {fit.r2.toFixed(3)}
        </p>
      )}
    </>
  );
}

function LineTrendChart({ x, y, xLabel, yLabel }: { x: number[]; y: number[]; xLabel: string; yLabel: string }) {
  const n = Math.min(x.length, y.length);
  if (n === 0) return <p className="graphs-panel-empty">No paired numeric values.</p>;
  const data = Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i] })).sort((a, b) => a.x - b.x);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="x" type="number" name={xLabel} style={{ fontSize: "0.72rem" }}
          label={{ value: xLabel, position: "insideBottom", offset: -4, fontSize: 10 }} />
        <YAxis dataKey="y" type="number" name={yLabel} width={44} style={{ fontSize: "0.72rem" }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ values }: { values: string[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of values) {
      if (v.trim() === "") continue;
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()].map(([category, count]) => ({ category, count }));
  }, [values]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={counts} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <XAxis dataKey="category" style={{ fontSize: "0.72rem" }} />
        <YAxis width={30} style={{ fontSize: "0.75rem" }} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, "Count"]} />
        <Bar dataKey="count" fill="var(--maroon-light)" stroke="var(--maroon)" strokeWidth={1}
          isAnimationActive={false} activeBar={{ fill: "var(--maroon)", fillOpacity: 0.6 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoryPieChart({ values }: { values: string[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of values) {
      if (v.trim() === "") continue;
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()].map(([category, count]) => ({ category, count }));
  }, [values]);

  if (counts.length === 0) return <p className="graphs-panel-empty">No categories to chart.</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={counts} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100}
          label={(props: { name?: string; value?: number }) => `${props.name} (${props.value})`}
          isAnimationActive={false}>
          {counts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [v, "Count"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
