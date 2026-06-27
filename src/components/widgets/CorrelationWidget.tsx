import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { makeLCG } from "@/lib/stats";

const N_PTS = 25;
const SEED = 42;

function generatePoints(targetR: number) {
  const rand = makeLCG(SEED);
  const xs = Array.from({ length: N_PTS }, () => rand() * 10);
  const noise = Array.from({ length: N_PTS }, () => rand() * 10);

  // Standardize xs and noise
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);

  const xm = mean(xs), nm = mean(noise);
  const xs_ = xs.map(x => (x - xm) / (std(xs, xm) || 1));
  const ns_ = noise.map(n => (n - nm) / (std(noise, nm) || 1));

  const r = Math.max(-0.999, Math.min(0.999, targetR));
  const ys_ = xs_.map((x, i) => r * x + Math.sqrt(1 - r * r) * ns_[i]);

  // Scale to display range
  const ym = mean(ys_), ystd = std(ys_, ym) || 1;
  return xs_.map((x, i) => ({
    x: parseFloat((5 + x * 2).toFixed(2)),
    y: parseFloat((50 + (ys_[i] - ym) / ystd * 15).toFixed(2)),
  }));
}

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

export function CorrelationWidget() {
  const [targetR, setTargetR] = useState(0.7);
  const [showRCode, setShowRCode] = useState(false);

  const points = useMemo(() => generatePoints(targetR), [targetR]);
  const actualR = useMemo(() => computeR(points), [points]);

  const rCode = `# Simulated data with r ≈ ${targetR}
x <- c(${points.map(p => p.x).join(", ")})
y <- c(${points.map(p => p.y).join(", ")})
cor(x, y, method = "pearson")   # ${actualR.toFixed(3)}
plot(x, y, main = paste("r =", round(cor(x,y), 3)),
     pch = 19, col = "darkred")
abline(lm(y ~ x), col = "#3b5b8a")`;

  const rColor = Math.abs(actualR) > 0.7 ? "var(--maroon)" : Math.abs(actualR) > 0.4 ? "#e07b00" : "#2a7a3a";

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>Target r: <strong>{targetR.toFixed(2)}</strong></span>
        <span>Computed r: <strong style={{ color: rColor }}>{actualR.toFixed(3)}</strong></span>
        <span style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
          {Math.abs(actualR) > 0.8 ? "Strong" : Math.abs(actualR) > 0.5 ? "Moderate" : "Weak"}
          {" "}{actualR < 0 ? "negative" : "positive"} association
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" name="x" domain={[0, 10]}
            tickCount={6} style={{ fontSize: "0.72rem" }} />
          <YAxis dataKey="y" type="number" name="y" domain={[10, 90]}
            width={42} style={{ fontSize: "0.72rem" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(2) : v, ""]} />
          <Scatter data={points} fill="var(--maroon)" opacity={0.8} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Correlation r: <strong>{targetR.toFixed(2)}</strong></span>
          <input type="range" min={-0.99} max={0.99} step={0.01} value={targetR}
            onChange={e => setTargetR(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
