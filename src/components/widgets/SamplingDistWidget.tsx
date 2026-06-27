import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { dnorm } from "@/lib/stats";

const MU = 75, SIGMA = 15;
const X_MIN = 30, X_MAX = 120, POINTS = 200;

const N_OPTIONS = [1, 4, 9, 16, 25, 36, 100];

function generateCurves(n: number) {
  const se = SIGMA / Math.sqrt(n);
  return Array.from({ length: POINTS }, (_, i) => {
    const x = X_MIN + (i / (POINTS - 1)) * (X_MAX - X_MIN);
    return {
      x: parseFloat(x.toFixed(2)),
      pop: parseFloat(dnorm(x, MU, SIGMA).toFixed(5)),
      samp: parseFloat(dnorm(x, MU, se).toFixed(5)),
    };
  });
}

export function SamplingDistWidget() {
  const [n, setN] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const se = SIGMA / Math.sqrt(n);
  const data = useMemo(() => generateCurves(n), [n]);

  const rCode = `mu <- ${MU}; sigma <- ${SIGMA}; n <- ${n}
se <- sigma / sqrt(n)   # ${se.toFixed(3)}

# Population distribution
curve(dnorm(x, mu, sigma), from = ${X_MIN}, to = ${X_MAX},
      col = "#aaa", lwd = 2, main = "Sampling Distribution",
      xlab = "x", ylab = "Density")

# Sampling distribution of x-bar
curve(dnorm(x, mu, se), add = TRUE, col = "darkred", lwd = 2)
legend("topright", c("Population (σ=${SIGMA})", paste0("Sampling dist (SE=", round(se,2), ")")),
       col = c("#aaa", "darkred"), lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>μ = <strong>{MU}</strong></span>
        <span>σ = <strong>{SIGMA}</strong></span>
        <span>n = <strong>{n}</strong></span>
        <span>SE = σ/√n = <strong style={{ color: "var(--maroon)" }}>{se.toFixed(3)}</strong></span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[X_MIN, X_MAX]} tickCount={7}
            tickFormatter={(v: number) => v.toFixed(0)} style={{ fontSize: "0.75rem" }} />
          <YAxis width={55} tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.7rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `x = ${l}`} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Line type="monotone" dataKey="pop" name={`Population (σ=${SIGMA})`}
            stroke="#bbb" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="samp" name={`Sampling dist (SE=${se.toFixed(2)})`}
            stroke="var(--maroon)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {N_OPTIONS.map(v => (
            <button key={v} className={`widget-toggle-btn${n === v ? " active" : ""}`}
              onClick={() => setN(v)}>
              n = {v}
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
