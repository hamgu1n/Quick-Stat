import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dnorm, pnorm, qnorm } from "@/lib/stats";

type Mode = "below" | "above" | "between";

const POINTS = 300;

/**
 * Shades the area under a normal curve and reports it as a probability.
 * Defaults match Example 5.4.2 (SAT math: mean 520, SD 115).
 */
export function NormalProbabilityWidget() {
  const [mu, setMu] = useState(520);
  const [sigma, setSigma] = useState(115);
  const [mode, setMode] = useState<Mode>("between");
  const [a, setA] = useState(450);
  const [b, setB] = useState(600);
  const [showRCode, setShowRCode] = useState(false);

  const xMin = mu - 4 * sigma, xMax = mu + 4 * sigma;

  // In "between" mode, keep the interval ordered even if the sliders cross.
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const zA = (a - mu) / sigma;
  const zLo = (lo - mu) / sigma, zHi = (hi - mu) / sigma;

  let prob: number;
  if (mode === "below") prob = pnorm(zA);
  else if (mode === "above") prob = 1 - pnorm(zA);
  else prob = pnorm(zHi) - pnorm(zLo);

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const x = xMin + (i / (POINTS - 1)) * (xMax - xMin);
      const y = dnorm(x, mu, sigma);
      let inside: boolean;
      if (mode === "below") inside = x <= a;
      else if (mode === "above") inside = x >= a;
      else inside = x >= lo && x <= hi;
      return { x: parseFloat(x.toFixed(3)), y, shade: inside ? y : null };
    });
  }, [mu, sigma, mode, a, lo, hi, xMin, xMax]);

  // Snap a and b to mu ± k·sigma to demonstrate the 68-95-99.7 rule.
  function setBand(k: number) {
    setMode("between");
    setA(mu - k * sigma);
    setB(mu + k * sigma);
  }

  const fmt = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);
  const probLabel =
    mode === "below" ? `P(X ≤ ${fmt(a)})`
      : mode === "above" ? `P(X ≥ ${fmt(a)})`
        : `P(${fmt(lo)} ≤ X ≤ ${fmt(hi)})`;

  const rCode =
    mode === "below"
      ? `mu <- ${mu}; sigma <- ${sigma}

z <- (${fmt(a)} - mu) / sigma          # ${zA.toFixed(3)}
pnorm(${fmt(a)}, mean = mu, sd = sigma)   # ${prob.toFixed(4)}`
      : mode === "above"
        ? `mu <- ${mu}; sigma <- ${sigma}

z <- (${fmt(a)} - mu) / sigma          # ${zA.toFixed(3)}
# Area to the RIGHT: use the complement (or lower.tail = FALSE)
1 - pnorm(${fmt(a)}, mean = mu, sd = sigma)   # ${prob.toFixed(4)}`
        : `mu <- ${mu}; sigma <- ${sigma}

# Area between two values = difference of two left areas
pnorm(${fmt(hi)}, mean = mu, sd = sigma) - pnorm(${fmt(lo)}, mean = mu, sd = sigma)   # ${prob.toFixed(4)}

# Working backwards: the value at the 90th percentile
qnorm(0.90, mean = mu, sd = sigma)   # ${(mu + qnorm(0.9) * sigma).toFixed(1)}`;

  const sliderStep = sigma >= 20 ? 1 : 0.1;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>{probLabel} = <strong style={{ color: "var(--maroon)" }}>{prob.toFixed(4)}</strong></span>
        {mode === "between"
          ? <span>z-scores: <strong>{zLo.toFixed(2)}</strong> to <strong>{zHi.toFixed(2)}</strong></span>
          : <span>z = <strong>{zA.toFixed(2)}</strong></span>}
        <span>≈ <strong>{(prob * 100).toFixed(1)}%</strong> of values</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[xMin, xMax]} tickCount={9}
            tickFormatter={(v: number) => fmt(v)} style={{ fontSize: "0.72rem" }} />
          <YAxis hide />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, "density"]}
            labelFormatter={l => `x = ${l}`} />
          <Area type="monotone" dataKey="shade" fill="var(--maroon)" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} connectNulls={false} />
          <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={mu} stroke="#999" strokeDasharray="4,3"
            label={{ value: `μ = ${mu}`, position: "top", fontSize: 10, fill: "#999" }} />
          {mode === "between" ? (
            <>
              <ReferenceLine x={lo} stroke="#3b5b8a" strokeWidth={1.5} />
              <ReferenceLine x={hi} stroke="#3b5b8a" strokeWidth={1.5} />
            </>
          ) : (
            <ReferenceLine x={a} stroke="#3b5b8a" strokeWidth={1.5} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["below", "above", "between"] as Mode[]).map(m => (
            <button key={m} className={`widget-toggle-btn${mode === m ? " active" : ""}`}
              onClick={() => setMode(m)}>
              {m === "below" ? "Below a" : m === "above" ? "Above a" : "Between a and b"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>68-95-99.7 rule:</span>
          {[1, 2, 3].map(k => (
            <button key={k} className="widget-toggle-btn" onClick={() => setBand(k)}>
              μ ± {k}σ
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>a: <strong>{fmt(a)}</strong></span>
          <input type="range" min={xMin} max={xMax} step={sliderStep} value={a}
            onChange={e => setA(Number(e.target.value))} />
        </label>
        {mode === "between" && (
          <label className="widget-slider-label">
            <span>b: <strong>{fmt(b)}</strong></span>
            <input type="range" min={xMin} max={xMax} step={sliderStep} value={b}
              onChange={e => setB(Number(e.target.value))} />
          </label>
        )}
        <label className="widget-slider-label">
          <span>μ (mean): <strong>{mu}</strong></span>
          <input type="range" min={0} max={1000} step={1} value={mu}
            onChange={e => setMu(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>σ (standard deviation): <strong>{sigma}</strong></span>
          <input type="range" min={1} max={200} step={1} value={sigma}
            onChange={e => setSigma(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
