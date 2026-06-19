import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const X_MIN = -21;
const X_MAX = 21;
const Y_MAX = 0.85;

function dnorm(x: number, mean: number, sd: number): number {
  return (
    (1 / (sd * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mean) / sd) ** 2)
  );
}

function generateCurve(mean: number, sd: number) {
  return Array.from({ length: 200 }, (_, i) => {
    const x = X_MIN + (i / 199) * (X_MAX - X_MIN);
    return { x: parseFloat(x.toFixed(2)), y: parseFloat(dnorm(x, mean, sd).toFixed(4)) };
  });
}

export function ZScoreWidget() {
  const [mean, setMean] = useState(0);
  const [sd, setSd] = useState(1);
  const [x, setX] = useState(1.5);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(() => generateCurve(mean, sd), [mean, sd]);
  const z = (x - mean) / sd;

  const rCode = `mu <- ${mean}; sigma <- ${sd}; x0 <- ${x}
z <- (x0 - mu) / sigma
cat("z-score:", round(z, 2))   # ${z.toFixed(2)}

curve(dnorm(x, mean = mu, sd = sigma),
      from = ${X_MIN}, to = ${X_MAX},
      main = paste("z =", round(z, 2)),
      xlab = "x", ylab = "Density")
abline(v = x0, col = "red", lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>
          z = (x − μ) / σ = ({x} − {mean}) / {sd} ={" "}
          <strong style={{ color: "var(--maroon)" }}>{z.toFixed(2)}</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[X_MIN, X_MAX]}
            tickCount={9}
            tickFormatter={(v: number) => v.toFixed(0)}
            style={{ fontSize: "0.75rem" }}
          />
          <YAxis
            domain={[0, Y_MAX]}
            width={52}
            tickFormatter={(v: number) => v.toFixed(2)}
            style={{ fontSize: "0.75rem" }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v, "Density"]}
            labelFormatter={(l) => `x = ${l}`}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="var(--maroon)"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={x}
            stroke="#3b5b8a"
            strokeWidth={2}
            label={{ value: `x = ${x}`, position: "top", fontSize: 11, fill: "#3b5b8a" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>
            x: <strong>{x}</strong>
          </span>
          <input
            type="range"
            min={X_MIN}
            max={X_MAX}
            step={0.5}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </label>
        <label className="widget-slider-label">
          <span>
            Mean (μ): <strong>{mean}</strong>
          </span>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={mean}
            onChange={(e) => setMean(Number(e.target.value))}
          />
        </label>
        <label className="widget-slider-label">
          <span>
            Std Dev (σ): <strong>{sd}</strong>
          </span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={sd}
            onChange={(e) => setSd(Number(e.target.value))}
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
