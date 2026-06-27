import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { dnorm, dt } from "@/lib/stats";

const X_MIN = -5, X_MAX = 5, POINTS = 300;
const DF_OPTIONS = [1, 2, 3, 5, 10, 20, 30];

export function TDistWidget() {
  const [df, setDf] = useState(5);
  const [showRCode, setShowRCode] = useState(false);

  // Two-tailed t* for alpha=0.05 (approximate via iteration)
  // We use a precomputed lookup for the common df values
  const T_STAR: Record<number, number> = { 1: 12.706, 2: 4.303, 3: 3.182, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042 };
  const tStar = T_STAR[df] ?? 1.96;

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const x = X_MIN + (i / (POINTS - 1)) * (X_MAX - X_MIN);
      return {
        x: parseFloat(x.toFixed(3)),
        t: parseFloat(dt(x, df).toFixed(6)),
        normal: parseFloat(dnorm(x).toFixed(6)),
      };
    });
  }, [df]);

  const rCode = `df <- ${df}

# t-distribution PDF
curve(dt(x, df), from = ${X_MIN}, to = ${X_MAX},
      col = "darkred", lwd = 2, main = paste("t-distribution (df =", df, ")"),
      xlab = "t", ylab = "Density")

# Standard normal for comparison
curve(dnorm(x), add = TRUE, col = "#3b5b8a", lwd = 2, lty = 2)

# Two-tailed critical value at alpha = 0.05
qt(0.975, df = df)   # t* = ${tStar}
legend("topright", c(paste("t(df =", df, ")"), "Normal"),
       col = c("darkred", "#3b5b8a"), lwd = 2, lty = c(1, 2))`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>df = <strong>{df}</strong></span>
        <span>t* (α=0.05, two-tailed) = <strong style={{ color: "var(--maroon)" }}>{tStar}</strong></span>
        <span style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
          {df >= 30 ? "≈ Normal (df ≥ 30)" : "Heavier tails than Normal"}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[X_MIN, X_MAX]} tickCount={11}
            tickFormatter={(v: number) => v.toFixed(1)} style={{ fontSize: "0.72rem" }} />
          <YAxis width={52} tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `t = ${l}`} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Line type="monotone" dataKey="t" name={`t (df = ${df})`}
            stroke="var(--maroon)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="normal" name="Standard Normal"
            stroke="#3b5b8a" strokeWidth={1.5} strokeDasharray="5,3"
            dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {DF_OPTIONS.map(v => (
            <button key={v} className={`widget-toggle-btn${df === v ? " active" : ""}`}
              onClick={() => setDf(v)}>
              df = {v}
            </button>
          ))}
        </div>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
