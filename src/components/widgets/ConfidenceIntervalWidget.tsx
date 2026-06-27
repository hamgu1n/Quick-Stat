import { useState, useMemo } from "react";
import { makeLCG } from "@/lib/stats";

const TRUE_MU = 50, SIGMA = 10;
const N_INTERVALS = 20;

const CONF_OPTIONS: { level: number; z: number }[] = [
  { level: 90, z: 1.645 },
  { level: 95, z: 1.96 },
  { level: 99, z: 2.576 },
];

function generateIntervals(n: number, z: number, seed: number) {
  const rand = makeLCG(seed);
  const se = SIGMA / Math.sqrt(n);
  return Array.from({ length: N_INTERVALS }, () => {
    // Box-Muller for normal sample mean
    const u1 = Math.max(1e-10, rand()), u2 = rand();
    const xbar = TRUE_MU + se * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const lo = xbar - z * se, hi = xbar + z * se;
    return { xbar, lo, hi, contains: lo <= TRUE_MU && TRUE_MU <= hi };
  });
}

export function ConfidenceIntervalWidget() {
  const [confIdx, setConfIdx] = useState(1); // default 95%
  const [n, setN] = useState(25);
  const [seed, setSeed] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const { level, z } = CONF_OPTIONS[confIdx];
  const intervals = useMemo(() => generateIntervals(n, z, seed), [n, z, seed]);
  const captured = intervals.filter(ci => ci.contains).length;

  const allLo = Math.min(...intervals.map(ci => ci.lo));
  const allHi = Math.max(...intervals.map(ci => ci.hi));
  const margin = (allHi - allLo) * 0.05;
  const svgMin = allLo - margin, svgMax = allHi + margin;
  const svgW = 360, svgH = N_INTERVALS * 14 + 30;

  function toX(v: number) {
    return ((v - svgMin) / (svgMax - svgMin)) * (svgW - 60) + 30;
  }

  const muX = toX(TRUE_MU);

  const se = SIGMA / Math.sqrt(n);
  const rCode = `mu <- ${TRUE_MU}; sigma <- ${SIGMA}; n <- ${n}
z_star <- ${z}   # ${level}% CI
set.seed(${seed})

# Generate ${N_INTERVALS} sample means and CIs
xbars <- rnorm(${N_INTERVALS}, mean = mu, sd = sigma / sqrt(n))
lo <- xbars - z_star * sigma / sqrt(n)
hi <- xbars + z_star * sigma / sqrt(n)

# Count CIs that capture mu
sum(lo <= mu & mu <= hi)   # expected ≈ ${level}% of ${N_INTERVALS}`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>Confidence level: <strong style={{ color: "var(--maroon)" }}>{level}%</strong></span>
        <span>z* = <strong>{z}</strong></span>
        <span>n = <strong>{n}</strong></span>
        <span>SE = <strong>{se.toFixed(2)}</strong></span>
        <span>Captured μ: <strong style={{ color: captured / N_INTERVALS >= level / 100 - 0.1 ? "green" : "red" }}>
          {captured}/{N_INTERVALS}
        </strong></span>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", display: "block", margin: "0.5rem auto" }}>
        {/* True mean line */}
        <line x1={muX} y1={8} x2={muX} y2={svgH - 18} stroke="var(--maroon)" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={muX} y={svgH - 4} textAnchor="middle" fontSize="10" fill="var(--maroon)">μ = {TRUE_MU}</text>

        {intervals.map((ci, i) => {
          const y = 12 + i * 14;
          const x1 = toX(ci.lo), x2 = toX(ci.hi), cx = toX(ci.xbar);
          const color = ci.contains ? "#2a7a3a" : "#c0392b";
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={2} />
              <line x1={x1} y1={y - 3} x2={x1} y2={y + 3} stroke={color} strokeWidth={1.5} />
              <line x1={x2} y1={y - 3} x2={x2} y2={y + 3} stroke={color} strokeWidth={1.5} />
              <circle cx={cx} cy={y} r={2.5} fill={color} />
            </g>
          );
        })}
      </svg>

      <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", marginBottom: "0.5rem" }}>
        <span style={{ color: "#2a7a3a" }}>—</span> Contains μ &nbsp;
        <span style={{ color: "#c0392b" }}>—</span> Misses μ &nbsp; · = sample mean
      </div>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {CONF_OPTIONS.map((opt, i) => (
            <button key={opt.level} className={`widget-toggle-btn${confIdx === i ? " active" : ""}`}
              onClick={() => setConfIdx(i)}>
              {opt.level}%
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>Sample size n: <strong>{n}</strong></span>
          <input type="range" min={5} max={100} step={5} value={n}
            onChange={e => setN(Number(e.target.value))} />
        </label>
        <button className="widget-toggle-btn" onClick={() => setSeed(s => s + 1)}>
          New samples
        </button>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
