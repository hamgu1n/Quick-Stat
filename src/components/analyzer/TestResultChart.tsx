import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import {
  ComposedChart, ScatterChart, Area, Line, Scatter,
  XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip,
} from "recharts";
import { dt, dnorm, dchisq, qt, qnorm, qchisq } from "@/lib/stats";
import type { ChartSpec, Tail } from "@/lib/testRunners";

const POINTS = 300;

/** Splits a density series into "reject" vs "fail to reject" segments so
 * the rejection region can be shaded, using the same null-splitting trick
 * as TypeErrorPowerWidget (a value present on one series and null on the
 * other draws as a gap, not a dip to zero). */
function tailMask(x: number, lo: number, hi: number): boolean {
  return x < lo || x > hi;
}

function critBounds(tail: Tail, alpha: number, quantileAt: (p: number) => number): [number, number] {
  if (tail === "less") return [-Infinity, quantileAt(alpha)];
  if (tail === "greater") return [quantileAt(1 - alpha), Infinity];
  return [quantileAt(alpha / 2), quantileAt(1 - alpha / 2)];
}

/** The R code that would draw this chart in RStudio, in both base R and
 * ggplot2 -- shown under a "Show R Code" toggle, same pattern as the
 * textbook widgets. */
function chartRCode(chart: ChartSpec): { base: string; ggplot: string } {
  if (chart.kind === "t-dist") {
    return {
      base: `curve(dt(x, df = ${chart.df}),
      from = -4, to = 4,
      main = "t distribution (df = ${chart.df})",
      ylab = "Density")
abline(v = ${chart.stat.toFixed(4)}, col = "blue", lwd = 2)   # observed ${chart.statLabel}
# rejection region (alpha = ${chart.alpha}, ${chart.tail}) shaded in the plot above`,
      ggplot: `ggplot(data.frame(x = c(-4, 4)), aes(x)) +
  stat_function(fun = dt, args = list(df = ${chart.df})) +
  geom_vline(xintercept = ${chart.stat.toFixed(4)}, color = "blue", linewidth = 1) +
  labs(title = "t distribution (df = ${chart.df})", x = "t", y = "Density")
# rejection region (alpha = ${chart.alpha}, ${chart.tail}) shaded in the plot above`,
    };
  }
  if (chart.kind === "z-dist") {
    return {
      base: `curve(dnorm(x),
      from = -4, to = 4,
      main = "Standard normal distribution",
      ylab = "Density")
abline(v = ${chart.stat.toFixed(4)}, col = "blue", lwd = 2)   # observed ${chart.statLabel}
# rejection region (alpha = ${chart.alpha}, ${chart.tail}) shaded in the plot above`,
      ggplot: `ggplot(data.frame(x = c(-4, 4)), aes(x)) +
  stat_function(fun = dnorm) +
  geom_vline(xintercept = ${chart.stat.toFixed(4)}, color = "blue", linewidth = 1) +
  labs(title = "Standard normal distribution", x = "z", y = "Density")
# rejection region (alpha = ${chart.alpha}, ${chart.tail}) shaded in the plot above`,
    };
  }
  if (chart.kind === "chisq-dist") {
    const upper = (chart.stat * 1.5 + 1).toFixed(1);
    return {
      base: `curve(dchisq(x, df = ${chart.df}),
      from = 0, to = ${upper},
      main = "Chi-square distribution (df = ${chart.df})",
      ylab = "Density")
abline(v = ${chart.stat.toFixed(4)}, col = "blue", lwd = 2)   # observed ${chart.statLabel}
# rejection region (alpha = ${chart.alpha}) shaded in the plot above`,
      ggplot: `ggplot(data.frame(x = c(0, ${upper})), aes(x)) +
  stat_function(fun = dchisq, args = list(df = ${chart.df})) +
  geom_vline(xintercept = ${chart.stat.toFixed(4)}, color = "blue", linewidth = 1) +
  labs(title = "Chi-square distribution (df = ${chart.df})", x = expression(chi^2), y = "Density")
# rejection region (alpha = ${chart.alpha}) shaded in the plot above`,
    };
  }
  if (chart.kind === "boxplot") {
    return {
      base: `boxplot(${chart.yLabel} ~ ${chart.xLabel}, data = data,
        main = "${chart.yLabel} by ${chart.xLabel}",
        xlab = "${chart.xLabel}", ylab = "${chart.yLabel}")`,
      ggplot: `ggplot(data, aes(x = ${chart.xLabel}, y = ${chart.yLabel})) +
  geom_boxplot(fill = "steelblue") +
  labs(title = "${chart.yLabel} by ${chart.xLabel}", x = "${chart.xLabel}", y = "${chart.yLabel}")`,
    };
  }
  const hasFit = chart.slope !== undefined && chart.intercept !== undefined;
  const fitLine = hasFit
    ? `\nabline(lm(${chart.yLabel} ~ ${chart.xLabel}, data = data), col = "blue", lwd = 2)`
    : "";
  const smooth = hasFit ? `\n  geom_smooth(method = "lm", se = FALSE) +` : "";
  return {
    base: `plot(data$${chart.xLabel}, data$${chart.yLabel},
     main = "${chart.yLabel} vs ${chart.xLabel}",
     xlab = "${chart.xLabel}", ylab = "${chart.yLabel}")${fitLine}`,
    ggplot: `ggplot(data, aes(x = ${chart.xLabel}, y = ${chart.yLabel})) +
  geom_point() +${smooth}
  labs(title = "${chart.yLabel} vs ${chart.xLabel}", x = "${chart.xLabel}", y = "${chart.yLabel}")`,
  };
}

function DistChart({
  density, stat, lo, hi, statLabel, xDomain,
}: {
  density: (x: number) => number;
  stat: number;
  lo: number;
  hi: number;
  statLabel: string;
  xDomain: [number, number];
}) {
  const data = useMemo(() => {
    const [xMin, xMax] = xDomain;
    return Array.from({ length: POINTS }, (_, i) => {
      const x = xMin + (i / (POINTS - 1)) * (xMax - xMin);
      const y = density(x);
      const reject = tailMask(x, lo, hi);
      return {
        x: parseFloat(x.toFixed(4)),
        keep: reject ? null : y,
        reject: reject ? y : null,
      };
    });
  }, [xDomain, lo, hi, density]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
        <XAxis dataKey="x" type="number" domain={xDomain} tickCount={7}
          tickFormatter={(v: number) => v.toFixed(1)} style={{ fontSize: "0.7rem" }} />
        <YAxis width={40} tickFormatter={(v: number) => v.toFixed(2)} style={{ fontSize: "0.7rem" }} />
        <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v, "density"]}
          labelFormatter={(l) => `x = ${l}`} />
        <Area type="monotone" dataKey="keep" stroke="var(--maroon)" strokeWidth={2}
          fill="var(--maroon)" fillOpacity={0.08} isAnimationActive={false} />
        <Area type="monotone" dataKey="reject" stroke="var(--maroon)" strokeWidth={2}
          fill="var(--maroon)" fillOpacity={0.4} isAnimationActive={false} />
        <ReferenceLine
          x={stat}
          stroke="#3b5b8a"
          strokeWidth={2}
          label={{
            value: statLabel,
            position: stat > (xDomain[0] + xDomain[1]) / 2 ? "insideTopLeft" : "insideTopRight",
            fontSize: 11,
            fill: "#3b5b8a",
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Multi-group box plot -- used for ANOVA results here, and reused as-is
 * for the Graphs tab's "Grouped Boxplot" chart type. */
export function BoxplotChart({ groups, yLabel }: { groups: { label: string; values: number[] }[]; yLabel: string }) {
  const boxes = useMemo(() => {
    return groups.map((g) => {
      const s = [...g.values].sort((a, b) => a - b);
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
      return { label: g.label, min: s[0], q1, q2, q3, max: s[n - 1] };
    });
  }, [groups]);

  const allValues = groups.flatMap((g) => g.values);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const pad = (yMax - yMin) * 0.1 || 1;
  const scaleMin = yMin - pad;
  const scaleMax = yMax + pad;

  const width = 480;
  const left = 56;
  const right = width - 16;
  const rowH = 56;
  const boxH = 26;
  const height = boxes.length * rowH + 24;

  const toX = (v: number) => left + ((v - scaleMin) / (scaleMax - scaleMin)) * (right - left);

  const [hovered, setHovered] = useState<number | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleMove(e: ReactMouseEvent, i: number) {
    setHovered(i);
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (bounds) setCursor({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
  }

  return (
    <div className="test-result-boxplot" ref={wrapperRef}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={`Boxplot of ${yLabel} by group`}>
        {boxes.map((b, i) => {
          const y = 12 + i * rowH;
          const midY = y + boxH / 2;
          const isHovered = hovered === i;
          return (
            // Recharts drives hover tooltips on the other chart kinds; this
            // box plot is hand-drawn SVG, so it gets its own hover state
            // and a floating tooltip that follows the cursor (see below).
            // A transparent full-row rect is the hit area (not just the
            // thin whisker/box lines) so hovering anywhere near a group
            // triggers it.
            <g key={b.label}>
              <rect
                x={left} y={y - 10} width={right - left} height={boxH + 20}
                fill="transparent"
                style={{ cursor: "default" }}
                onMouseMove={(e) => handleMove(e, i)}
                onMouseLeave={() => setHovered(null)}
              />
              <text x={4} y={midY} dy={4} fontSize={11}
                fill={isHovered ? "var(--foreground)" : "var(--muted-foreground)"}
                fontWeight={isHovered ? 600 : undefined}>
                {b.label}
              </text>
              <line x1={toX(b.min)} x2={toX(b.q1)} y1={midY} y2={midY} stroke="var(--foreground)" strokeWidth={1} />
              <line x1={toX(b.q3)} x2={toX(b.max)} y1={midY} y2={midY} stroke="var(--foreground)" strokeWidth={1} />
              <rect x={toX(b.q1)} y={y} width={Math.max(toX(b.q3) - toX(b.q1), 1)} height={boxH}
                fill="var(--maroon)" fillOpacity={isHovered ? 0.4 : 0.25} stroke="var(--maroon)"
                strokeWidth={isHovered ? 2.5 : 1.5} style={{ pointerEvents: "none" }} />
              <line x1={toX(b.q2)} x2={toX(b.q2)} y1={y} y2={y + boxH} stroke="var(--maroon)" strokeWidth={2} />
              <line x1={toX(b.min)} x2={toX(b.min)} y1={midY - 6} y2={midY + 6} stroke="var(--foreground)" strokeWidth={1} />
              <line x1={toX(b.max)} x2={toX(b.max)} y1={midY - 6} y2={midY + 6} stroke="var(--foreground)" strokeWidth={1} />
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div
          className="chart-floating-tooltip"
          style={{ left: cursor.x + 14, top: cursor.y + 14 }}
        >
          <strong>{boxes[hovered].label}</strong>
          <span>Min {boxes[hovered].min.toFixed(2)}</span>
          <span>Q1 {boxes[hovered].q1.toFixed(2)}</span>
          <span>Median {boxes[hovered].q2.toFixed(2)}</span>
          <span>Q3 {boxes[hovered].q3.toFixed(2)}</span>
          <span>Max {boxes[hovered].max.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

/** Scatter + optional fit line -- used for correlation/regression results
 * here, and reused as-is for the Graphs tab's plain scatterplot (with an
 * always-on trend line rather than only on a run test). */
export function ScatterFitChart({
  points, slope, intercept, xLabel, yLabel,
}: {
  points: { x: number; y: number }[];
  slope?: number;
  intercept?: number;
  xLabel: string;
  yLabel: string;
}) {
  const xs = points.map((p) => p.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const line = slope !== undefined && intercept !== undefined
    ? [{ x: xMin, y: intercept + slope * xMin }, { x: xMax, y: intercept + slope * xMax }]
    : null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <XAxis dataKey="x" type="number" name={xLabel} domain={["auto", "auto"]} style={{ fontSize: "0.7rem" }} />
        <YAxis dataKey="y" type="number" name={yLabel} width={44} style={{ fontSize: "0.7rem" }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }}
          formatter={(v) => typeof v === "number" ? v.toFixed(3) : v} />
        {/* A plain dot's hit area is just its own tiny radius, so the
            tooltip only fires when the cursor lands almost exactly on a
            point. Draw a larger transparent circle underneath each dot to
            make hovering near a point actually trigger it. */}
        <Scatter data={points} isAnimationActive={false} shape={(props: { cx?: number; cy?: number }) => (
          <g>
            <circle cx={props.cx} cy={props.cy} r={10} fill="transparent" />
            <circle cx={props.cx} cy={props.cy} r={4} fill="var(--maroon)" fillOpacity={0.6} />
          </g>
        )} />
        {line && (
          <Line data={line} dataKey="y" stroke="#3b5b8a" strokeWidth={2} dot={false}
            isAnimationActive={false} legendType="none" />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function TestResultChart({ chart }: { chart: ChartSpec }) {
  const [showRCode, setShowRCode] = useState(false);

  let content: ReactNode;
  if (chart.kind === "t-dist") {
    const { stat, df, tail, alpha, statLabel } = chart;
    const [lo, hi] = critBounds(tail, alpha, (p) => qt(p, df));
    const domainEdge = Math.max(4, Math.abs(stat) + 1);
    content = (
      <DistChart
        density={(x) => dt(x, df)}
        stat={stat}
        lo={lo}
        hi={hi}
        statLabel={statLabel}
        xDomain={[-domainEdge, domainEdge]}
      />
    );
  } else if (chart.kind === "z-dist") {
    const { stat, tail, alpha, statLabel } = chart;
    const [lo, hi] = critBounds(tail, alpha, qnorm);
    const domainEdge = Math.max(4, Math.abs(stat) + 1);
    content = (
      <DistChart
        density={(x) => dnorm(x)}
        stat={stat}
        lo={lo}
        hi={hi}
        statLabel={statLabel}
        xDomain={[-domainEdge, domainEdge]}
      />
    );
  } else if (chart.kind === "chisq-dist") {
    const { stat, df, alpha, statLabel } = chart;
    const critHi = qchisq(1 - alpha, df);
    const domainEdge = Math.max(critHi, stat) * 1.25 + 1;
    // dchisq(x) diverges as x -> 0 when df = 1 (e.g. a goodness-of-fit test
    // on a 2-category column) -- starting just above 0 avoids that spike
    // blowing out the y-axis scale and flattening the rest of the curve.
    content = (
      <DistChart
        density={(x) => dchisq(x, df)}
        stat={stat}
        lo={-Infinity}
        hi={critHi}
        statLabel={statLabel}
        xDomain={[domainEdge * 0.01, domainEdge]}
      />
    );
  } else if (chart.kind === "boxplot") {
    content = <BoxplotChart groups={chart.groups} yLabel={chart.yLabel} />;
  } else {
    content = (
      <ScatterFitChart
        points={chart.points}
        slope={chart.slope}
        intercept={chart.intercept}
        xLabel={chart.xLabel}
        yLabel={chart.yLabel}
      />
    );
  }

  return (
    <>
      {content}
      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && (() => {
        const code = chartRCode(chart);
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
