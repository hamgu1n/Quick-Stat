import { useState, useMemo } from "react";
import { makeLCG, pnorm } from "@/lib/stats";

const Z_STAR = 1.96; // 95% confidence

/** Simulates one group's successes: n independent trials with success rate p. */
function simulateCount(n: number, p: number, rand: () => number): number {
  let x = 0;
  for (let i = 0; i < n; i++) if (rand() < p) x++;
  return x;
}

/** Pooled two-proportion z-test plus an unpooled 95% CI for pB - pA. */
function analyze(xA: number, xB: number, n: number) {
  const pA = xA / n, pB = xB / n;
  const diff = pB - pA;
  const pool = (xA + xB) / (2 * n);
  const sePool = Math.sqrt(pool * (1 - pool) * (2 / n));
  const z = sePool > 0 ? diff / sePool : 0;
  const pValue = sePool > 0 ? 2 * (1 - pnorm(Math.abs(z))) : 1;
  const seCI = Math.sqrt((pA * (1 - pA)) / n + (pB * (1 - pB)) / n);
  return { pA, pB, diff, pool, z, pValue, lo: diff - Z_STAR * seCI, hi: diff + Z_STAR * seCI };
}

type Tally = { key: string; runs: number; significant: number };

/**
 * A/B test simulator. Defaults roughly match Example 8.3.2
 * (1,500 visitors per version, about 6.4% vs. 8.6% purchase rates).
 */
export function TwoPropWidget() {
  const [n, setN] = useState(1500);
  const [rateA, setRateA] = useState(0.064);
  const [rateB, setRateB] = useState(0.086);
  const [seed, setSeed] = useState(1);
  const [tally, setTally] = useState<Tally>({ key: "", runs: 0, significant: 0 });
  const [showRCode, setShowRCode] = useState(false);

  const { xA, xB } = useMemo(() => {
    const rand = makeLCG(seed);
    return { xA: simulateCount(n, rateA, rand), xB: simulateCount(n, rateB, rand) };
  }, [n, rateA, rateB, seed]);

  const r = analyze(xA, xB, n);
  const sig = r.pValue < 0.05;

  // The tally belongs to one set of true rates and n. Tagging it with a key
  // (instead of resetting it in an effect) means that changing a slider
  // automatically starts a fresh count.
  const paramKey = `${n}|${rateA}|${rateB}`;
  const current = tally.key === paramKey ? tally : { key: paramKey, runs: 0, significant: 0 };

  function runTest() {
    // Score the *next* simulated test, then display it.
    const next = seed + 1;
    const rand = makeLCG(next);
    const a = simulateCount(n, rateA, rand), b = simulateCount(n, rateB, rand);
    const nextSig = analyze(a, b, n).pValue < 0.05;
    setTally({
      key: paramKey,
      runs: current.runs + 1,
      significant: current.significant + (nextSig ? 1 : 0),
    });
    setSeed(next);
  }

  // Shared horizontal scale for the CI plot, centered on 0.
  const span = Math.max(0.02, Math.abs(r.lo), Math.abs(r.hi), Math.abs(rateB - rateA)) * 1.2;
  const svgW = 360, pad = 24;
  const toX = (v: number) => pad + ((v + span) / (2 * span)) * (svgW - 2 * pad);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const ciContainsZero = r.lo <= 0 && r.hi >= 0;

  const rCode = `# Simulate one A/B test with true rates ${rateA} (A) and ${rateB} (B)
set.seed(${seed})
n <- ${n}
xA <- rbinom(1, n, ${rateA})   # this run: ${xA}
xB <- rbinom(1, n, ${rateB})   # this run: ${xB}

# Pooled two-proportion z-test (correct = FALSE matches the hand formula)
prop.test(c(xB, xA), c(n, n), correct = FALSE)
# z = ${r.z.toFixed(3)}, p-value = ${r.pValue.toFixed(4)}

# 95% CI for pB - pA (unpooled standard error)
pA <- xA / n; pB <- xB / n
se <- sqrt(pA * (1 - pA) / n + pB * (1 - pB) / n)
(pB - pA) + c(-1, 1) * 1.96 * se   # (${r.lo.toFixed(4)}, ${r.hi.toFixed(4)})`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>p̂<sub>A</sub> = {xA}/{n} = <strong>{pct(r.pA)}</strong></span>
        <span>p̂<sub>B</sub> = {xB}/{n} = <strong>{pct(r.pB)}</strong></span>
        <span>z = <strong style={{ color: "var(--maroon)" }}>{r.z.toFixed(2)}</strong></span>
        <span>p-value = <strong style={{ color: sig ? "green" : "inherit" }}>{r.pValue < 0.0001 ? "< 0.0001" : r.pValue.toFixed(4)}</strong></span>
      </div>

      <div className="widget-rcode-label">95% confidence interval for p<sub>B</sub> − p<sub>A</sub></div>
      <svg viewBox={`0 0 ${svgW} 70`} style={{ width: "100%", display: "block" }}>
        <line x1={pad} y1={40} x2={svgW - pad} y2={40} stroke="var(--border)" />
        {/* zero = "no difference" */}
        <line x1={toX(0)} y1={12} x2={toX(0)} y2={52} stroke="#999" strokeDasharray="4,3" />
        <text x={toX(0)} y={64} textAnchor="middle" fontSize="9" fill="#999">0 (no difference)</text>
        {/* true difference */}
        <line x1={toX(rateB - rateA)} y1={16} x2={toX(rateB - rateA)} y2={48} stroke="var(--maroon)" strokeWidth={1.5} />
        <text x={toX(rateB - rateA)} y={11} textAnchor="middle" fontSize="9" fill="var(--maroon)">true difference</text>
        {/* observed CI */}
        <line x1={toX(r.lo)} y1={32} x2={toX(r.hi)} y2={32} stroke="#3b5b8a" strokeWidth={3} />
        <line x1={toX(r.lo)} y1={27} x2={toX(r.lo)} y2={37} stroke="#3b5b8a" strokeWidth={2} />
        <line x1={toX(r.hi)} y1={27} x2={toX(r.hi)} y2={37} stroke="#3b5b8a" strokeWidth={2} />
        <circle cx={toX(r.diff)} cy={32} r={3.5} fill="#3b5b8a" />
      </svg>
      <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0", color: "var(--muted-foreground)" }}>
        Observed difference {r.diff >= 0 ? "+" : ""}{pct(r.diff)}, CI ({pct(r.lo)}, {pct(r.hi)}).{" "}
        {ciContainsZero
          ? "The interval contains 0, so \"no difference\" is still plausible."
          : `The interval is entirely ${r.lo > 0 ? "above" : "below"} 0, so the data suggest a real difference.`}
      </p>

      <div className="widget-stats" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
        <span>Tests run: <strong>{current.runs}</strong></span>
        <span>Found a significant difference: <strong>{current.significant}</strong>
          {current.runs > 0 && <> ({((current.significant / current.runs) * 100).toFixed(0)}%)</>}
        </span>
      </div>
      <p style={{ fontSize: "0.8rem", margin: "0.25rem 0 0", color: "var(--muted-foreground)" }}>
        {rateA === rateB
          ? "The true rates are equal, so every significant result is a Type I error. Expect about 5%."
          : "The true rates differ, so the percentage of significant results estimates the test's power."}
      </p>

      <div className="widget-controls">
        <button className="widget-toggle-btn" onClick={runTest}>Run test</button>
        <label className="widget-slider-label">
          <span>True rate for A (original): <strong>{pct(rateA)}</strong></span>
          <input type="range" min={0.01} max={0.3} step={0.001} value={rateA}
            onChange={e => setRateA(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>True rate for B (new version): <strong>{pct(rateB)}</strong></span>
          <input type="range" min={0.01} max={0.3} step={0.001} value={rateB}
            onChange={e => setRateB(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>Visitors per version n: <strong>{n}</strong></span>
          <input type="range" min={100} max={5000} step={100} value={n}
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
