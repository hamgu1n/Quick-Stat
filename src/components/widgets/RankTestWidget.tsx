import { useState, useMemo } from "react";
import { pt } from "@/lib/stats";

// Time on a web page (seconds) for two page designs. Group A's largest
// value is controlled by the slider; the slider's minimum sits above every
// other value, so there are never ties and the exact test always applies.
const A_FIXED = [34, 41, 47, 52, 58];
const B = [22, 26, 29, 33, 37, 44];
const X_MIN = 60, X_MAX = 400;

/**
 * Exact two-sided Mann-Whitney p-value (no ties), matching R's
 * wilcox.test(a, b). W = (rank sum of a) - nA(nA + 1)/2.
 * counts[w] = number of ways to choose nA ranks out of 1..N with that W,
 * built with a subset-sum dynamic program.
 */
function mannWhitneyExact(W: number, nA: number, nB: number): number {
  const N = nA + nB;
  const maxSum = (N * (N + 1)) / 2;
  // ways[j][s] = number of j-element subsets of the ranks seen so far summing to s
  let ways: number[][] = Array.from({ length: nA + 1 }, () => Array(maxSum + 1).fill(0));
  ways[0][0] = 1;
  for (let r = 1; r <= N; r++) {
    const next = ways.map(row => row.slice());
    for (let j = 1; j <= nA; j++) {
      for (let s = r; s <= maxSum; s++) next[j][s] += ways[j - 1][s - r];
    }
    ways = next;
  }
  const offset = (nA * (nA + 1)) / 2;
  const counts = ways[nA].slice(offset); // index = W
  const total = counts.reduce((a, b) => a + b, 0);
  const cdf = (w: number) => counts.slice(0, w + 1).reduce((a, b) => a + b, 0) / total;
  // Same tail rule R uses: look at whichever tail W falls in, then double.
  const p = W > (nA * nB) / 2 ? 1 - cdf(W - 1) : cdf(W);
  return Math.min(1, 2 * p);
}

/** Welch two-sample t-test, matching R's t.test(a, b) default. */
function welch(a: number[], b: number[]) {
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const variance = (v: number[], m: number) => v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1);
  const mA = mean(a), mB = mean(b);
  const qA = variance(a, mA) / a.length, qB = variance(b, mB) / b.length;
  const t = (mA - mB) / Math.sqrt(qA + qB);
  const df = (qA + qB) ** 2 / (qA ** 2 / (a.length - 1) + qB ** 2 / (b.length - 1));
  return { mA, mB, t, df, p: 2 * (1 - pt(Math.abs(t), df)) };
}

const median = (v: number[]) => {
  const s = [...v].sort((x, y) => x - y), m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
};

export function RankTestWidget() {
  const [xOut, setXOut] = useState(65);
  const [showRCode, setShowRCode] = useState(false);

  const A = useMemo(() => [...A_FIXED, xOut], [xOut]);

  const result = useMemo(() => {
    const combined = [
      ...A.map(v => ({ v, g: "A" as const })),
      ...B.map(v => ({ v, g: "B" as const })),
    ].sort((p, q) => p.v - q.v);
    const ranked = combined.map((d, i) => ({ ...d, rank: i + 1 }));
    const rankSumA = ranked.filter(d => d.g === "A").reduce((s, d) => s + d.rank, 0);
    const rankSumB = ranked.filter(d => d.g === "B").reduce((s, d) => s + d.rank, 0);
    const W = rankSumA - (A.length * (A.length + 1)) / 2;
    return {
      ranked, rankSumA, rankSumB, W,
      pMW: mannWhitneyExact(W, A.length, B.length),
      tt: welch(A, B),
    };
  }, [A]);

  const { ranked, rankSumA, rankSumB, W, pMW, tt } = result;
  const fmtP = (p: number) => (p < 0.0001 ? "< 0.0001" : p.toFixed(4));
  const sigColor = (p: number) => (p < 0.05 ? "green" : "#c0392b");

  // Dot plot scale: always span the slider's full range so the outlier
  // visibly runs away from the rest of the data as it moves.
  const svgW = 360, padL = 28, padR = 12;
  const toX = (v: number) => padL + ((v - 0) / (X_MAX + 10)) * (svgW - padL - padR);
  const rankOf = new Map(ranked.map(d => [`${d.g}${d.v}`, d.rank]));

  const rCode = `a <- c(${A.join(", ")})   # design A
b <- c(${B.join(", ")})        # design B

# Parametric: Welch two-sample t-test (compares means)
t.test(a, b)
# t = ${tt.t.toFixed(3)}, df = ${tt.df.toFixed(2)}, p-value = ${tt.p.toFixed(4)}

# Nonparametric: Mann-Whitney U / Wilcoxon rank-sum test (uses ranks)
wilcox.test(a, b)
# W = ${W}, p-value = ${pMW.toFixed(4)}

# See the ranks R uses
rank(c(a, b))`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>Two-sample t-test p = <strong style={{ color: sigColor(tt.p) }}>{fmtP(tt.p)}</strong></span>
        <span>Mann-Whitney p = <strong style={{ color: sigColor(pMW) }}>{fmtP(pMW)}</strong></span>
      </div>

      <svg viewBox={`0 0 ${svgW} 112`} style={{ width: "100%", display: "block" }}>
        {(["A", "B"] as const).map((g, row) => {
          const y = 34 + row * 44;
          const vals = g === "A" ? A : B;
          const color = g === "A" ? "var(--maroon)" : "#3b5b8a";
          return (
            <g key={g}>
              <text x={4} y={y + 4} fontSize="11" fontWeight="600" fill={color}>{g}</text>
              <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="var(--border)" />
              {vals.map(v => (
                <g key={v}>
                  <circle cx={toX(v)} cy={y} r={5} fill={color} fillOpacity={v === xOut && g === "A" ? 1 : 0.75}
                    stroke={v === xOut && g === "A" ? "var(--foreground)" : "none"} strokeWidth={1.5} />
                  <text x={toX(v)} y={y - 9} textAnchor="middle" fontSize="8.5" fill="var(--muted-foreground)">
                    {rankOf.get(`${g}${v}`)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {[0, 100, 200, 300, 400].map(t => (
          <text key={t} x={toX(t)} y={108} textAnchor="middle" fontSize="8.5" fill="var(--muted-foreground)">{t}s</text>
        ))}
      </svg>
      <p style={{ fontSize: "0.78rem", margin: "0 0 0.5rem", color: "var(--muted-foreground)", textAlign: "center" }}>
        Small numbers above each point are its rank among all 12 values.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
        <div>
          <div className="widget-rcode-label">t-test uses the values</div>
          Mean A = <strong>{tt.mA.toFixed(1)}</strong>, mean B = <strong>{tt.mB.toFixed(1)}</strong><br />
          Median A = <strong>{median(A)}</strong>, median B = <strong>{median(B)}</strong>
        </div>
        <div>
          <div className="widget-rcode-label">Mann-Whitney uses the ranks</div>
          Rank sum A = <strong>{rankSumA}</strong>, rank sum B = <strong>{rankSumB}</strong><br />
          W = <strong>{W}</strong> (out of a possible {A.length * B.length})
        </div>
      </div>

      <p style={{ fontSize: "0.85rem", margin: "0.75rem 0 0", color: "var(--muted-foreground)" }}>
        {xOut <= 80
          ? "Drag the slider to turn A's largest value into an extreme outlier and watch the two p-values."
          : "The outlier inflates A's standard deviation, which weakens the t-test. Its rank is still 12, so the Mann-Whitney result doesn't change at all."}
      </p>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Largest value in group A: <strong>{xOut} seconds</strong></span>
          <input type="range" min={X_MIN} max={X_MAX} step={5} value={xOut}
            onChange={e => setXOut(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
