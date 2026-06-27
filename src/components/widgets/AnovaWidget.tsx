import { useState, useMemo } from "react";

// Fixed within-group offsets (5 points per group)
const OFFSETS = [-2.1, 0.8, -0.5, 1.7, 0.2];
const COLORS = ["var(--maroon)", "#3b5b8a", "#2a7a3a"];
const GROUP_LABELS = ["Group A", "Group B", "Group C"];

function computeF(means: number[]) {
  const n = OFFSETS.length, k = 3, N = n * k;
  const grandMean = means.reduce((a, b) => a + b, 0) / k;
  const ssb = means.reduce((s, m) => s + n * (m - grandMean) ** 2, 0);
  const ssw = means.reduce((s, m) =>
    s + OFFSETS.reduce((a, o) => a + (m + o - m) ** 2, 0), 0);
  const msb = ssb / (k - 1);
  const msw = ssw / (N - k);
  return { grandMean, ssb, ssw, msb, msw, f: msb / msw, dfB: k - 1, dfW: N - k };
}

export function AnovaWidget() {
  const [means, setMeans] = useState([75, 82, 69]);
  const [showRCode, setShowRCode] = useState(false);

  const stats = useMemo(() => computeF(means), [means]);

  const allPoints = means.flatMap((m, g) =>
    OFFSETS.map(o => ({ group: g, y: m + o }))
  );
  const allY = allPoints.map(p => p.y);
  const yMin = Math.min(...allY) - 3, yMax = Math.max(...allY) + 3;

  const svgW = 320, svgH = 200;
  const PAD_L = 40, PAD_R = 20, PAD_T = 12, PAD_B = 24;
  const plotH = svgH - PAD_T - PAD_B;
  const plotW = svgW - PAD_L - PAD_R;
  const colW = plotW / 3;

  function toY(v: number) {
    return PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }

  const grandMeanY = toY(stats.grandMean);

  const rCode = `scores_A <- c(${OFFSETS.map(o => (means[0] + o).toFixed(1)).join(", ")})
scores_B <- c(${OFFSETS.map(o => (means[1] + o).toFixed(1)).join(", ")})
scores_C <- c(${OFFSETS.map(o => (means[2] + o).toFixed(1)).join(", ")})

df <- data.frame(
  score  = c(scores_A, scores_B, scores_C),
  group  = rep(c("A", "B", "C"), each = ${OFFSETS.length})
)
result <- aov(score ~ group, data = df)
summary(result)
# F(${stats.dfB}, ${stats.dfW}) = ${stats.f.toFixed(2)}`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>Grand mean = <strong>{stats.grandMean.toFixed(1)}</strong></span>
        <span>SSB = <strong>{stats.ssb.toFixed(2)}</strong></span>
        <span>SSW = <strong>{stats.ssw.toFixed(2)}</strong></span>
        <span>F({stats.dfB}, {stats.dfW}) = <strong style={{ color: "var(--maroon)" }}>{stats.f.toFixed(2)}</strong></span>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }}>
        {/* Y-axis ticks */}
        {[yMin, (yMin + yMax) / 2, yMax].map(v => (
          <g key={v}>
            <line x1={PAD_L - 4} y1={toY(v)} x2={PAD_L} y2={toY(v)} stroke="var(--border)" />
            <text x={PAD_L - 6} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={svgH - PAD_B} stroke="var(--border)" />

        {/* Grand mean dashed line */}
        <line x1={PAD_L} y1={grandMeanY} x2={svgW - PAD_R} y2={grandMeanY}
          stroke="#999" strokeWidth={1.5} strokeDasharray="5,3" />
        <text x={svgW - PAD_R + 2} y={grandMeanY + 4} fontSize="9" fill="#999">x̄̄</text>

        {/* Groups */}
        {means.map((m, g) => {
          const cx = PAD_L + g * colW + colW / 2;
          const meanY = toY(m);
          return (
            <g key={g}>
              {/* Group mean line */}
              <line x1={cx - 20} y1={meanY} x2={cx + 20} y2={meanY}
                stroke={COLORS[g]} strokeWidth={2.5} />
              {/* Data points */}
              {OFFSETS.map((o, j) => (
                <circle key={j} cx={cx + (j - 2) * 6} cy={toY(m + o)} r={4}
                  fill={COLORS[g]} opacity={0.8} />
              ))}
              {/* Group label */}
              <text x={cx} y={svgH - 6} textAnchor="middle" fontSize="10" fill={COLORS[g]} fontWeight={600}>
                {GROUP_LABELS[g]} (x̄={m})
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", textAlign: "center", marginBottom: "0.5rem" }}>
        Thick tick = group mean · dashed = grand mean · F = MSB/MSW = {stats.msb.toFixed(2)}/{stats.msw.toFixed(2)}
      </div>

      <div className="widget-controls">
        {means.map((m, g) => (
          <label key={g} className="widget-slider-label">
            <span style={{ color: COLORS[g] }}>
              {GROUP_LABELS[g]} mean: <strong>{m}</strong>
            </span>
            <input type="range" min={50} max={100} step={1} value={m}
              onChange={e => setMeans(prev => prev.map((v, i) => i === g ? Number(e.target.value) : v))} />
          </label>
        ))}
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
