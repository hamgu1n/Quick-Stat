import { useState } from "react";

export function ProbabilityVennWidget() {
  const [pA, setPA] = useState(0.5);
  const [pB, setPB] = useState(0.4);
  const [pAB, setPAB] = useState(0.15);
  const [showRCode, setShowRCode] = useState(false);

  // Derived probabilities
  const maxAB = Math.min(pA, pB);
  const safeAB = Math.min(pAB, maxAB);
  const pAonly = pA - safeAB;
  const pBonly = pB - safeAB;
  const pUnion = pA + pB - safeAB;
  const pNeither = Math.max(0, 1 - pUnion);

  const rCode = `P_A  <- ${pA}
P_B  <- ${pB}
P_AB <- ${safeAB}   # P(A and B)

P_union      <- P_A + P_B - P_AB   # ${pUnion.toFixed(3)}
P_complement <- 1 - P_A            # ${(1 - pA).toFixed(3)}
P_A_given_B  <- P_AB / P_B         # ${pB > 0 ? (safeAB / pB).toFixed(3) : "—"}`;

  return (
    <div className="widget">
      {/* SVG Venn diagram */}
      <svg viewBox="0 0 300 160" style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }}>
        {/* Outer box representing the sample space */}
        <rect x="5" y="5" width="290" height="150" rx="6" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <text x="285" y="20" textAnchor="end" fontSize="11" fill="var(--muted-foreground)">S</text>

        {/* Circle A */}
        <circle cx="110" cy="80" r="58" fill="var(--maroon)" fillOpacity="0.18" stroke="var(--maroon)" strokeWidth="1.5" />
        {/* Circle B */}
        <circle cx="190" cy="80" r="58" fill="#3b5b8a" fillOpacity="0.18" stroke="#3b5b8a" strokeWidth="1.5" />

        {/* Labels for each region */}
        <text x="72" y="82" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--maroon)">{pAonly.toFixed(3)}</text>
        <text x="72" y="97" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">A only</text>

        <text x="150" y="76" textAnchor="middle" fontSize="12" fontWeight="600" fill="#555">{safeAB.toFixed(3)}</text>
        <text x="150" y="91" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">A ∩ B</text>

        <text x="228" y="82" textAnchor="middle" fontSize="12" fontWeight="600" fill="#3b5b8a">{pBonly.toFixed(3)}</text>
        <text x="228" y="97" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">B only</text>

        <text x="22" y="148" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{pNeither.toFixed(3)}</text>

        {/* Circle labels */}
        <text x="90" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--maroon)">A</text>
        <text x="210" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#3b5b8a">B</text>
      </svg>

      {/* Computed stats */}
      <div className="widget-stats">
        <span>P(A) = <strong>{pA.toFixed(2)}</strong></span>
        <span>P(B) = <strong>{pB.toFixed(2)}</strong></span>
        <span>P(A∩B) = <strong>{safeAB.toFixed(3)}</strong></span>
        <span>P(A∪B) = <strong style={{ color: "var(--maroon)" }}>{pUnion.toFixed(3)}</strong></span>
        <span>P(Aᶜ) = <strong>{(1 - pA).toFixed(2)}</strong></span>
        {pB > 0 && <span>P(A|B) = <strong>{(safeAB / pB).toFixed(3)}</strong></span>}
      </div>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>P(A): <strong>{pA.toFixed(2)}</strong></span>
          <input type="range" min={0.05} max={0.95} step={0.05} value={pA}
            onChange={e => setPA(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>P(B): <strong>{pB.toFixed(2)}</strong></span>
          <input type="range" min={0.05} max={0.95} step={0.05} value={pB}
            onChange={e => setPB(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>P(A∩B): <strong>{safeAB.toFixed(3)}</strong> (max: {maxAB.toFixed(2)})</span>
          <input type="range" min={0} max={maxAB} step={0.01} value={safeAB}
            onChange={e => setPAB(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
