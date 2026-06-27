import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dnorm, pnorm } from "@/lib/stats";

const MU0 = 50;
const SIGMA = 10;
const POINTS = 400;

const Z_CRIT: Record<string, number> = { "0.01": 2.576, "0.05": 1.960, "0.10": 1.645 };

export function TypeErrorPowerWidget() {
  const [muA, setMuA] = useState(58);
  const [n, setN] = useState(25);
  const [alpha, setAlpha] = useState("0.05");
  const [showRCode, setShowRCode] = useState(false);

  const se = SIGMA / Math.sqrt(n);
  const zCrit = Z_CRIT[alpha];
  const critLo = MU0 - zCrit * se;
  const critHi = MU0 + zCrit * se;

  const power = (1 - pnorm(critHi, muA, se)) + pnorm(critLo, muA, se);
  const beta = 1 - power;

  const xMin = Math.min(MU0, muA) - 4.5 * se;
  const xMax = Math.max(MU0, muA) + 4.5 * se;

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const x = xMin + (i / (POINTS - 1)) * (xMax - xMin);
      const h0 = dnorm(x, MU0, se);
      const ha = dnorm(x, muA, se);
      const inReject = x < critLo || x > critHi;
      return {
        x: parseFloat(x.toFixed(3)),
        h0: parseFloat(h0.toFixed(6)),
        ha: parseFloat(ha.toFixed(6)),
        typeI: inReject ? h0 : null,
        typeII: !inReject ? ha : null,
        pow: inReject ? ha : null,
      };
    });
  }, [muA, se, critLo, critHi, xMin, xMax]);

  const alphaNum = parseFloat(alpha);
  const rCode = `mu0 <- ${MU0}; muA <- ${muA}; sigma <- ${SIGMA}; n <- ${n}
se <- sigma / sqrt(n)   # ${se.toFixed(3)}

# Critical values (two-tailed, alpha = ${alpha})
z_crit <- qnorm(1 - ${alphaNum}/2)   # ${zCrit}
crit_lo <- mu0 - z_crit * se   # ${critLo.toFixed(2)}
crit_hi <- mu0 + z_crit * se   # ${critHi.toFixed(2)}

# Type II error (beta) and power
beta  <- pnorm(crit_hi, muA, se) - pnorm(crit_lo, muA, se)  # ${beta.toFixed(4)}
power <- 1 - beta                                              # ${power.toFixed(4)}`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span style={{ color: "var(--maroon)" }}>α (Type I) = <strong>{alpha}</strong></span>
        <span style={{ color: "#3b5b8a" }}>β (Type II) = <strong>{beta.toFixed(3)}</strong></span>
        <span style={{ color: "#2a7a3a" }}>Power = 1 − β = <strong>{power.toFixed(3)}</strong></span>
        <span style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
          SE = {se.toFixed(2)} | Critical values: {critLo.toFixed(1)}, {critHi.toFixed(1)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[xMin, xMax]} tickCount={7}
            tickFormatter={(v: number) => v.toFixed(0)} style={{ fontSize: "0.72rem" }} />
          <YAxis width={60} tickFormatter={(v: number) => v.toFixed(4)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `x̄ = ${l}`} />
          <Area type="monotone" dataKey="typeI" fill="var(--maroon)" fillOpacity={0.3}
            stroke="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="typeII" fill="#3b5b8a" fillOpacity={0.3}
            stroke="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="pow" fill="#2a7a3a" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} />
          <Line type="monotone" dataKey="h0" stroke="#aaa" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="ha" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={critLo} stroke="#666" strokeDasharray="4,3" strokeWidth={1.5} />
          <ReferenceLine x={critHi} stroke="#666" strokeDasharray="4,3" strokeWidth={1.5} />
          <ReferenceLine x={MU0} stroke="#999" strokeWidth={1}
            label={{ value: `μ₀ = ${MU0}`, position: "insideTopLeft", fontSize: 9, fill: "#888" }} />
          <ReferenceLine x={muA} stroke="var(--maroon)" strokeWidth={1}
            label={{ value: `μₐ = ${muA}`, position: "insideTopRight", fontSize: 9, fill: "var(--maroon)" }} />
        </ComposedChart>
      </ResponsiveContainer>

      <p style={{ fontSize: "0.78rem", margin: "0.3rem 0 0.6rem", lineHeight: 1.5 }}>
        <strong style={{ color: "var(--maroon)" }}>Red</strong> = Type I error (α) — rejecting a true H₀ (false positive).{" "}
        <strong style={{ color: "#3b5b8a" }}>Blue</strong> = Type II error (β) — missing a false H₀ (false negative).{" "}
        <strong style={{ color: "#2a7a3a" }}>Green</strong> = Power (1−β) — correctly detecting the true effect.
        <br />
        Gray curve = H₀ distribution (N({MU0}, σ/√n)). Red curve = Hₐ distribution (N(μₐ, σ/√n)).
      </p>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["0.01", "0.05", "0.10"].map(a => (
            <button key={a} className={`widget-toggle-btn${alpha === a ? " active" : ""}`}
              onClick={() => setAlpha(a)}>
              α = {a}
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>True mean μₐ: <strong>{muA}</strong> (move further from μ₀ = {MU0} to increase power)</span>
          <input type="range" min={30} max={70} step={1} value={muA}
            onChange={e => setMuA(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>Sample size n: <strong>{n}</strong> (larger n → narrower curves → more power)</span>
          <input type="range" min={4} max={100} step={1} value={n}
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
