import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateBase(n = 60, seed = 42) {
  const rand = mulberry32(seed);
  const randn = () => {
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  return {
    xs: Array.from({ length: n }, randn),
    noise: Array.from({ length: n }, randn),
  };
}

const BASE = generateBase();

function generateScatterData(rho: number) {
  return BASE.xs.map((z1, i) => ({
    x: parseFloat((z1 * 12 + 50).toFixed(1)),
    y: parseFloat(((rho * z1 + Math.sqrt(1 - rho ** 2) * BASE.noise[i]) * 12 + 50).toFixed(1)),
  }));
}

function describeCorrelation(rho: number) {
  const abs = Math.abs(rho);
  const dir = rho > 0 ? "Positive" : rho < 0 ? "Negative" : "";
  const str = abs >= 0.8 ? "Strong" : abs >= 0.5 ? "Moderate" : abs >= 0.2 ? "Weak" : "No";
  return abs < 0.1 ? "No Association" : `${str} ${dir} Association`;
}

export function ScatterplotWidget() {
  const [rho, setRho] = useState(0.7);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(() => generateScatterData(rho), [rho]);

  const rCode = `set.seed(42)
n   <- 60
z1  <- rnorm(n); z2 <- rnorm(n)
rho <- ${rho}
x   <- z1 * 12 + 50
y   <- (rho * z1 + sqrt(1 - rho^2) * z2) * 12 + 50

plot(x, y,
     main = paste("Correlation ≈", rho),
     xlab = "x", ylab = "y",
     pch = 19, col = "steelblue")
abline(lm(y ~ x), col = "red", lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>
          r ≈ <strong style={{ color: "var(--maroon)" }}>{rho.toFixed(1)}</strong>
        </span>
        <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
          {describeCorrelation(rho)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[10, 90]}
            tickCount={7}
            style={{ fontSize: "0.75rem" }}
            name="x"
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[10, 90]}
            tickCount={7}
            width={40}
            style={{ fontSize: "0.75rem" }}
            name="y"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v]}
          />
          <Scatter
            data={data}
            fill="var(--maroon)"
            fillOpacity={0.6}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>
            Correlation (r): <strong>{rho.toFixed(1)}</strong>
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={rho}
            onChange={(e) => setRho(Number(e.target.value))}
          />
        </label>
      </div>
      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && (
        <pre className="widget-rcode">
          <code>{rCode}</code>
        </pre>
      )}
    </div>
  );
}
