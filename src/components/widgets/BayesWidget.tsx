import { useState } from "react";

export function BayesWidget() {
  const [prevalence, setPrevalence] = useState(0.02);
  const [sensitivity, setSensitivity] = useState(0.90);
  const [fpr, setFpr] = useState(0.05); // false positive rate P(+|¬D)
  const [showRCode, setShowRCode] = useState(false);

  // Bayes' theorem
  const pPos = prevalence * sensitivity + (1 - prevalence) * fpr;
  const pDGivenPos = pPos > 0 ? (prevalence * sensitivity) / pPos : 0;

  // Frequency table for 1000 people
  const n = 1000;
  const TP = Math.round(n * prevalence * sensitivity);
  const FN = Math.round(n * prevalence * (1 - sensitivity));
  const FP = Math.round(n * (1 - prevalence) * fpr);
  const TN = n - TP - FN - FP;
  const totalPos = TP + FP;
  const totalNeg = FN + TN;

  const rCode = `P_D   <- ${prevalence}    # prevalence
P_pos_D  <- ${sensitivity}    # sensitivity P(+|D)
P_pos_nD <- ${fpr}    # false positive rate P(+|¬D)

# Bayes' Theorem
P_pos <- P_D * P_pos_D + (1 - P_D) * P_pos_nD
P_D_given_pos <- (P_pos_D * P_D) / P_pos
cat("P(Disease | Positive test):", round(P_D_given_pos, 4))  # ${pDGivenPos.toFixed(4)}`;

  const tdStyle: React.CSSProperties = {
    padding: "0.3rem 0.6rem",
    border: "1px solid var(--border)",
    fontSize: "0.85rem",
    textAlign: "center",
  };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 600, background: "var(--muted)" };

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>P(Test+) = <strong>{pPos.toFixed(4)}</strong></span>
        <span>
          P(Disease | Test+) ={" "}
          <strong style={{ color: "var(--maroon)", fontSize: "1.05em" }}>
            {(pDGivenPos * 100).toFixed(1)}%
          </strong>
        </span>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: "0 0 0.75rem" }}>
        Among 1,000 randomly tested people:
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "0.75rem" }}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            <th style={{ ...thStyle, color: "var(--maroon)" }}>Has Disease (D)</th>
            <th style={{ ...thStyle, color: "#3b5b8a" }}>No Disease (¬D)</th>
            <th style={thStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={thStyle}>Test +</td>
            <td style={{ ...tdStyle, color: "var(--maroon)", fontWeight: 600 }}>{TP} (TP)</td>
            <td style={{ ...tdStyle, color: "#3b5b8a" }}>{FP} (FP)</td>
            <td style={tdStyle}>{totalPos}</td>
          </tr>
          <tr>
            <td style={thStyle}>Test −</td>
            <td style={{ ...tdStyle, color: "var(--maroon)" }}>{FN} (FN)</td>
            <td style={{ ...tdStyle, color: "#3b5b8a", fontWeight: 600 }}>{TN} (TN)</td>
            <td style={tdStyle}>{totalNeg}</td>
          </tr>
          <tr>
            <td style={thStyle}>Total</td>
            <td style={tdStyle}>{TP + FN}</td>
            <td style={tdStyle}>{FP + TN}</td>
            <td style={{ ...tdStyle, fontWeight: 600 }}>{n}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: "0 0 0.75rem" }}>
        P(D | +) = TP / (TP + FP) = {TP} / {totalPos} = <strong>{(pDGivenPos * 100).toFixed(1)}%</strong>
      </p>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Prevalence P(D): <strong>{(prevalence * 100).toFixed(1)}%</strong></span>
          <input type="range" min={0.001} max={0.3} step={0.001} value={prevalence}
            onChange={e => setPrevalence(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>Sensitivity P(+|D): <strong>{(sensitivity * 100).toFixed(0)}%</strong></span>
          <input type="range" min={0.5} max={0.999} step={0.01} value={sensitivity}
            onChange={e => setSensitivity(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>False positive rate P(+|¬D): <strong>{(fpr * 100).toFixed(1)}%</strong></span>
          <input type="range" min={0.001} max={0.5} step={0.001} value={fpr}
            onChange={e => setFpr(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
