import { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE_DATA = [
  { x: 1, y: 28 }, { x: 2, y: 44 }, { x: 3, y: 36 }, { x: 4, y: 52 },
  { x: 5, y: 60 }, { x: 6, y: 55 }, { x: 7, y: 72 }, { x: 8, y: 80 },
  { x: 9, y: 70 }, { x: 10, y: 88 }, { x: 11, y: 95 }, { x: 12, y: 100 },
];
const OUTLIER = { x: 13, y: 18 };

function computeR(pts: { x: number; y: number }[]): number {
  const n = pts.length;
  const xm = pts.reduce((a, p) => a + p.x, 0) / n;
  const ym = pts.reduce((a, p) => a + p.y, 0) / n;
  const num = pts.reduce((a, p) => a + (p.x - xm) * (p.y - ym), 0);
  const den = Math.sqrt(
    pts.reduce((a, p) => a + (p.x - xm) ** 2, 0) *
    pts.reduce((a, p) => a + (p.y - ym) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

const R_BASE = computeR(BASE_DATA);
const R_WITH = computeR([...BASE_DATA, OUTLIER]);

export function OutlierCorrelationWidget() {
  const [showOutlier, setShowOutlier] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const rNow = showOutlier ? R_WITH : R_BASE;
  const strength = Math.abs(rNow) >= 0.8 ? "strong" : Math.abs(rNow) >= 0.5 ? "moderate" : "weak";

  const rCode = `x <- c(${BASE_DATA.map(p => p.x).join(", ")})
y <- c(${BASE_DATA.map(p => p.y).join(", ")})

cor(x, y)   # Without outlier: ${R_BASE.toFixed(3)}

# Add outlier at (${OUTLIER.x}, ${OUTLIER.y})
x2 <- c(x, ${OUTLIER.x}); y2 <- c(y, ${OUTLIER.y})
cor(x2, y2)   # With outlier: ${R_WITH.toFixed(3)}

# Always inspect the scatterplot before reporting r!
plot(x, y, pch = 19, col = "darkred")
abline(lm(y ~ x), col = "#3b5b8a")`;

  const outlierNode = useMemo(
    () => showOutlier ? <Scatter data={[OUTLIER]} fill="#e07b00" opacity={1} /> : null,
    [showOutlier]
  );

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>r (12 points) = <strong style={{ color: "var(--maroon)" }}>{R_BASE.toFixed(3)}</strong></span>
        <span>r (+ outlier) = <strong style={{ color: "#e07b00" }}>{R_WITH.toFixed(3)}</strong></span>
        <span>Shift in r: <strong>
          {(R_WITH - R_BASE) > 0 ? "+" : ""}{(R_WITH - R_BASE).toFixed(3)} from one point
        </strong></span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0" }}>
        <button
          className={`widget-toggle-btn${showOutlier ? " active" : ""}`}
          onClick={() => setShowOutlier(v => !v)}
          style={{ minWidth: 140 }}>
          {showOutlier ? "Remove Outlier" : "Add Outlier"}
        </button>
        <span style={{ fontSize: "0.82rem" }}>
          Current r = <strong style={{ color: showOutlier ? "#e07b00" : "var(--maroon)" }}>
            {rNow.toFixed(3)}
          </strong> ({strength} positive association)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" dataKey="x" name="x" domain={[0, 15]}
            tickCount={8} style={{ fontSize: "0.72rem" }} />
          <YAxis type="number" dataKey="y" name="y" domain={[0, 110]}
            width={38} style={{ fontSize: "0.72rem" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v, ""]} />
          <Scatter data={BASE_DATA} fill="var(--maroon)" opacity={0.85} />
          {outlierNode}
        </ScatterChart>
      </ResponsiveContainer>

      {showOutlier && (
        <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", margin: "0.3rem 0 0.5rem" }}>
          The orange point ({OUTLIER.x}, {OUTLIER.y}) is a <strong>high-leverage outlier</strong> —
          it sits at an extreme x-value with a y-value far below the trend.
          One point shifts r by {Math.abs(R_WITH - R_BASE).toFixed(3)}: from {R_BASE.toFixed(3)} down to {R_WITH.toFixed(3)}.
        </p>
      )}

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
