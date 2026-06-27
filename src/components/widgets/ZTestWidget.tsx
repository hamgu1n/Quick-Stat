import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dnorm, pnorm } from "@/lib/stats";

type Tail = "left" | "two" | "right";

const POINTS = 300;

export function ZTestWidget() {
  const [xbar, setXbar] = useState(15.8);
  const [mu0, setMu0] = useState(16);
  const [sigma, setSigma] = useState(0.5);
  const [n, setN] = useState(36);
  const [tail, setTail] = useState<Tail>("two");
  const [showRCode, setShowRCode] = useState(false);

  const se = sigma / Math.sqrt(n);
  const z = (xbar - mu0) / se;

  let pValue: number;
  if (tail === "left") pValue = pnorm(z);
  else if (tail === "right") pValue = 1 - pnorm(z);
  else pValue = 2 * Math.min(pnorm(z), 1 - pnorm(z));

  const xMin = mu0 - 4 * se, xMax = mu0 + 4 * se;

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const x = xMin + (i / (POINTS - 1)) * (xMax - xMin);
      const y = dnorm(x, mu0, se);
      let shade: number | null = null;
      if (tail === "left" && x <= xbar) shade = y;
      else if (tail === "right" && x >= xbar) shade = y;
      else if (tail === "two") {
        if (x <= mu0 - Math.abs(z) * se || x >= mu0 + Math.abs(z) * se) shade = y;
      }
      return { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(6)), shade };
    });
  }, [mu0, se, xbar, z, tail, xMin, xMax]);

  const tailLabel = { left: "left-tailed", two: "two-tailed", right: "right-tailed" }[tail];
  const rCode = `xbar <- ${xbar}; mu0 <- ${mu0}; sigma <- ${sigma}; n <- ${n}
se <- sigma / sqrt(n)      # ${se.toFixed(4)}
z <- (xbar - mu0) / se    # ${z.toFixed(4)}

# p-value (${tailLabel})
${tail === "left" ? `pnorm(z)` : tail === "right" ? `pnorm(z, lower.tail = FALSE)` : `2 * pnorm(-abs(z))`}   # ${pValue.toFixed(4)}`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>z = <strong style={{ color: "var(--maroon)" }}>{z.toFixed(3)}</strong></span>
        <span>SE = σ/√n = <strong>{se.toFixed(4)}</strong></span>
        <span>p-value = <strong style={{ color: pValue < 0.05 ? "green" : "inherit" }}>{pValue.toFixed(4)}</strong></span>
        {pValue < 0.05 && <span style={{ color: "green", fontSize: "0.82rem" }}>Reject H₀ at α = 0.05</span>}
        {pValue >= 0.05 && <span style={{ color: "var(--muted-foreground)", fontSize: "0.82rem" }}>Fail to reject H₀ at α = 0.05</span>}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[xMin, xMax]} tickCount={7}
            tickFormatter={(v: number) => v.toFixed(2)} style={{ fontSize: "0.72rem" }} />
          <YAxis width={55} tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `x = ${l}`} />
          <Area type="monotone" dataKey="shade" fill="var(--maroon)" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} />
          <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={xbar} stroke="#3b5b8a" strokeWidth={2}
            label={{ value: `x̄=${xbar}`, position: "top", fontSize: 10, fill: "#3b5b8a" }} />
          <ReferenceLine x={mu0} stroke="#999" strokeWidth={1.5} strokeDasharray="4,3"
            label={{ value: `μ₀=${mu0}`, position: "insideTopLeft", fontSize: 10, fill: "#999" }} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["left", "two", "right"] as Tail[]).map(t => (
            <button key={t} className={`widget-toggle-btn${tail === t ? " active" : ""}`}
              onClick={() => setTail(t)}>
              {t === "left" ? "Left-tailed" : t === "two" ? "Two-tailed" : "Right-tailed"}
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>x̄ (sample mean): <strong>{xbar}</strong></span>
          <input type="range" min={xMin} max={xMax} step={0.01} value={xbar}
            onChange={e => setXbar(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>μ₀ (null hypothesis mean): <strong>{mu0}</strong></span>
          <input type="range" min={10} max={20} step={0.5} value={mu0}
            onChange={e => setMu0(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>σ (population SD): <strong>{sigma}</strong></span>
          <input type="range" min={0.1} max={3} step={0.1} value={sigma}
            onChange={e => setSigma(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>n (sample size): <strong>{n}</strong></span>
          <input type="range" min={1} max={100} step={1} value={n}
            onChange={e => setN(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
