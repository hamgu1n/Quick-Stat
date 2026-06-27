import { useState, useMemo } from "react";
import { ComposedChart, Scatter, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// Fixed dataset: study hours vs exam score
const DATA = [
  { x: 1, y: 45 }, { x: 2, y: 55 }, { x: 2, y: 52 }, { x: 3, y: 62 },
  { x: 3, y: 65 }, { x: 4, y: 70 }, { x: 4, y: 72 }, { x: 5, y: 78 },
  { x: 5, y: 80 }, { x: 6, y: 85 }, { x: 6, y: 82 }, { x: 7, y: 90 },
];

function leastSquares(data: { x: number; y: number }[]) {
  const n = data.length;
  const xbar = data.reduce((a, p) => a + p.x, 0) / n;
  const ybar = data.reduce((a, p) => a + p.y, 0) / n;
  const sxx = data.reduce((a, p) => a + (p.x - xbar) ** 2, 0);
  const sxy = data.reduce((a, p) => a + (p.x - xbar) * (p.y - ybar), 0);
  const b1 = sxy / sxx;
  const b0 = ybar - b1 * xbar;
  const syy = data.reduce((a, p) => a + (p.y - ybar) ** 2, 0);
  const sse = data.reduce((a, p) => a + (p.y - (b0 + b1 * p.x)) ** 2, 0);
  const r2 = 1 - sse / syy;
  return { b0, b1, xbar, ybar, r2 };
}

const { b0, b1, r2 } = leastSquares(DATA);

export function RegressionWidget() {
  const [showResiduals, setShowResiduals] = useState(false);
  const [predX, setPredX] = useState(4);
  const [showRCode, setShowRCode] = useState(false);

  const predY = b0 + b1 * predX;

  // Build line data
  const lineData = useMemo(() => [
    { x: 0, yhat: b0 },
    { x: 8, yhat: b0 + b1 * 8 },
  ], []);

  // Residual segments drawn as SVG lines (not easy in Recharts natively)
  // We'll overlay them as a note; for simplicity show residuals as text
  const residuals = DATA.map(p => ({ ...p, yhat: b0 + b1 * p.x, e: p.y - (b0 + b1 * p.x) }));

  const rCode = `hours  <- c(${DATA.map(p => p.x).join(", ")})
scores <- c(${DATA.map(p => p.y).join(", ")})

fit <- lm(scores ~ hours)
summary(fit)
# Intercept (b0): ${b0.toFixed(3)}
# Slope    (b1): ${b1.toFixed(3)}
# R²:            ${r2.toFixed(4)}

# Predict for x = ${predX} hours
predict(fit, newdata = data.frame(hours = ${predX}))  # ${predY.toFixed(2)}

plot(hours, scores, pch = 19, col = "darkred",
     main = paste("R² =", round(summary(fit)$r.squared, 3)))
abline(fit, col = "#3b5b8a", lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>ŷ = <strong>{b0.toFixed(2)} + {b1.toFixed(2)}x</strong></span>
        <span>R² = <strong style={{ color: "var(--maroon)" }}>{r2.toFixed(4)}</strong></span>
        <span>Predict (x={predX}h): <strong>ŷ = {predY.toFixed(1)}</strong></span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" dataKey="x" domain={[0, 8]} name="Hours studied"
            label={{ value: "Hours studied", position: "insideBottom", offset: -2, fontSize: 11 }}
            tickCount={9} style={{ fontSize: "0.72rem" }} />
          <YAxis type="number" dataKey="y" domain={[30, 100]} name="Exam score"
            width={40} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v, ""]} />
          <Line data={lineData} type="linear" dataKey="yhat" name="Regression line"
            stroke="#3b5b8a" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Scatter data={DATA} name="Data" fill="var(--maroon)" opacity={0.85} />
          <ReferenceLine x={predX} stroke="#e07b00" strokeWidth={1.5} strokeDasharray="4,3"
            label={{ value: `x=${predX}`, position: "top", fontSize: 10, fill: "#e07b00" }} />
          <ReferenceLine y={predY} stroke="#e07b00" strokeWidth={1.5} strokeDasharray="4,3"
            label={{ value: `ŷ=${predY.toFixed(1)}`, position: "insideRight", fontSize: 10, fill: "#e07b00" }} />
        </ComposedChart>
      </ResponsiveContainer>

      {showResiduals && (
        <div style={{ fontSize: "0.78rem", margin: "0.5rem 0", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 320 }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                <th style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)" }}>x</th>
                <th style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)" }}>y</th>
                <th style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)" }}>ŷ</th>
                <th style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", color: "var(--maroon)" }}>e = y − ŷ</th>
              </tr>
            </thead>
            <tbody>
              {residuals.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "0.15rem 0.5rem", border: "1px solid var(--border)", textAlign: "center" }}>{r.x}</td>
                  <td style={{ padding: "0.15rem 0.5rem", border: "1px solid var(--border)", textAlign: "center" }}>{r.y}</td>
                  <td style={{ padding: "0.15rem 0.5rem", border: "1px solid var(--border)", textAlign: "center" }}>{r.yhat.toFixed(1)}</td>
                  <td style={{ padding: "0.15rem 0.5rem", border: "1px solid var(--border)", textAlign: "center",
                    color: r.e > 0 ? "green" : "var(--maroon)" }}>
                    {r.e.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Predict for x = <strong>{predX}</strong> hours → ŷ = <strong>{predY.toFixed(1)}</strong></span>
          <input type="range" min={0} max={8} step={0.5} value={predX}
            onChange={e => setPredX(Number(e.target.value))} />
        </label>
        <button
          className={`widget-toggle-btn${showResiduals ? " active" : ""}`}
          onClick={() => setShowResiduals(v => !v)}
        >
          {showResiduals ? "Hide residuals table" : "Show residuals table"}
        </button>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
