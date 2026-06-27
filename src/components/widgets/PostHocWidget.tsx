import { useState } from "react";
import { pt } from "@/lib/stats";

// Fixed within-group assumptions: n=5 per group, pooled s=7
const N_PER = 5;
const S_POOLED = 7;
const DF_WITHIN = 3 * (N_PER - 1); // 12
const SE_PAIR = S_POOLED * Math.sqrt(2 / N_PER);

function computePair(m1: number, m2: number) {
  const diff = Math.abs(m1 - m2);
  const tStat = diff / SE_PAIR;
  const pRaw = 2 * pt(-tStat, DF_WITHIN);
  const pBonf = Math.min(pRaw * 3, 1);
  return { diff, tStat, pRaw, pBonf };
}

const GROUPS = ["A", "B", "C"] as const;
const COLORS = ["var(--maroon)", "#3b5b8a", "#2a7a3a"];
const DOT_OFFSETS = [-1.5, -0.5, 0.5, 1.5, 2.5];

export function PostHocWidget() {
  const [means, setMeans] = useState([72, 85, 78]);
  const [showRCode, setShowRCode] = useState(false);

  const pairs = [
    { label: "A vs B", m1: means[0], m2: means[1] },
    { label: "A vs C", m1: means[0], m2: means[2] },
    { label: "B vs C", m1: means[1], m2: means[2] },
  ].map(p => ({ ...p, ...computePair(p.m1, p.m2) }));

  const allMeans = means;
  const grandMean = allMeans.reduce((a, b) => a + b, 0) / 3;

  // SVG dot plot settings
  const SVG_W = 460, SVG_H = 140;
  const Y_SCALE_MIN = 50, Y_SCALE_MAX = 100;
  const toSvgY = (v: number) => SVG_H - 20 - ((v - Y_SCALE_MIN) / (Y_SCALE_MAX - Y_SCALE_MIN)) * (SVG_H - 40);
  const toSvgX = (g: number, offset: number) => 60 + g * 130 + offset * 14;

  const rCode = `scores <- c(${means.map(m => `rep(${m}, ${N_PER}) + rnorm(${N_PER}, 0, ${S_POOLED})`).join(",\n          ")})
method <- rep(c("A", "B", "C"), each = ${N_PER})
df <- data.frame(score = scores, method = method)

fit <- aov(score ~ method, data = df)
summary(fit)

# Post-hoc: Tukey HSD
TukeyHSD(fit)
# Group means: A=${means[0]}, B=${means[1]}, C=${means[2]}

# Bonferroni approach (for reference):
pairwise.t.test(df$score, df$method, p.adjust.method = "bonferroni")`;

  return (
    <div className="widget">
      <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", margin: "0 0 0.5rem" }}>
        Assumptions: n = {N_PER} per group, pooled s = {S_POOLED}, df_within = {DF_WITHIN}
      </p>

      {/* SVG dot plot */}
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: "visible" }}>
        {/* Y-axis ticks */}
        {[50, 60, 70, 80, 90, 100].map(v => (
          <g key={v}>
            <line x1={40} y1={toSvgY(v)} x2={SVG_W - 20} y2={toSvgY(v)}
              stroke="#eee" strokeWidth={1} />
            <text x={36} y={toSvgY(v) + 4} textAnchor="end" fontSize={9} fill="#999">{v}</text>
          </g>
        ))}
        {/* Grand mean line */}
        <line x1={40} x2={SVG_W - 20} y1={toSvgY(grandMean)} y2={toSvgY(grandMean)}
          stroke="#999" strokeWidth={1.5} strokeDasharray="6,3" />
        <text x={SVG_W - 18} y={toSvgY(grandMean) + 4} fontSize={9} fill="#999">x̄̄</text>

        {means.map((mean, g) => (
          <g key={g}>
            {/* Group mean marker */}
            <line x1={toSvgX(g, -2.5)} x2={toSvgX(g, 4.5)} y1={toSvgY(mean)} y2={toSvgY(mean)}
              stroke={COLORS[g]} strokeWidth={2.5} />
            {/* Dots with fixed offsets (simulated ±S_POOLED noise) */}
            {DOT_OFFSETS.map((off, j) => {
              const noise = [2, -3, 4, -2, 3][j] * (S_POOLED / 5);
              return (
                <circle key={j} cx={toSvgX(g, off)} cy={toSvgY(mean + noise)}
                  r={4} fill={COLORS[g]} opacity={0.6} />
              );
            })}
            {/* Group label */}
            <text x={toSvgX(g, 1)} y={SVG_H - 3} textAnchor="middle"
              fontSize={11} fontWeight="bold" fill={COLORS[g]}>
              Group {GROUPS[g]} (μ̂={mean})
            </text>
          </g>
        ))}
      </svg>

      {/* Mean sliders */}
      <div className="widget-controls" style={{ marginTop: "0.25rem" }}>
        {means.map((m, i) => (
          <label key={i} className="widget-slider-label">
            <span>Group {GROUPS[i]} mean: <strong style={{ color: COLORS[i] }}>{m}</strong></span>
            <input type="range" min={50} max={100} step={1} value={m}
              onChange={e => {
                const next = [...means];
                next[i] = Number(e.target.value);
                setMeans(next);
              }} />
          </label>
        ))}
      </div>

      {/* Pairwise comparison table */}
      <p style={{ fontSize: "0.82rem", fontWeight: 600, margin: "0.75rem 0 0.25rem" }}>
        Pairwise Comparisons (Bonferroni correction, k = 3 tests)
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ background: "var(--muted)" }}>
              {["Pair", "|Diff|", "t-stat", "Raw p", "Bonferroni p", "Significant?"].map(h => (
                <th key={h} style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pairs.map(p => (
              <tr key={p.label}>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", fontWeight: 600 }}>{p.label}</td>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "right" }}>{p.diff.toFixed(1)}</td>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "right" }}>{p.tStat.toFixed(3)}</td>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "right" }}>{p.pRaw.toFixed(4)}</td>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "right",
                  color: p.pBonf < 0.05 ? "green" : "inherit" }}>{p.pBonf.toFixed(4)}</td>
                <td style={{ padding: "0.2rem 0.5rem", border: "1px solid var(--border)", textAlign: "center",
                  color: p.pBonf < 0.05 ? "green" : "var(--muted-foreground)", fontWeight: 600 }}>
                  {p.pBonf < 0.05 ? "Yes ✓" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: "0.3rem 0 0.5rem" }}>
        Bonferroni: multiply each raw p-value by the number of comparisons (3). Significant at α = 0.05.
      </p>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
