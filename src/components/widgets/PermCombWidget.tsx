import { useState } from "react";

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function perm(n: number, r: number): number {
  return factorial(n) / factorial(n - r);
}

function comb(n: number, r: number): number {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export function PermCombWidget() {
  const [n, setN] = useState(8);
  const [r, setR] = useState(3);
  const [mode, setMode] = useState<"perm" | "comb">("perm");
  const [showRCode, setShowRCode] = useState(false);

  const safeR = Math.min(r, n);
  const result = mode === "perm" ? perm(n, safeR) : comb(n, safeR);

  const formula = mode === "perm"
    ? `P(${n}, ${safeR}) = ${n}! / (${n} − ${safeR})! = ${n}! / ${n - safeR}!`
    : `C(${n}, ${safeR}) = ${n}! / (${safeR}! × (${n} − ${safeR})!) = ${n}! / (${safeR}! × ${n - safeR}!)`;

  const rCode = mode === "perm"
    ? `# Permutations: order matters
n <- ${n}; r <- ${safeR}
factorial(n) / factorial(n - r)  # ${result.toLocaleString()}
# Or equivalently:
# perm(n, r)  using combinat package`
    : `# Combinations: order does not matter
n <- ${n}; r <- ${safeR}
choose(n, r)  # ${result.toLocaleString()}
# Or:
# factorial(n) / (factorial(r) * factorial(n - r))`;

  return (
    <div className="widget">
      <div className="widget-controls" style={{ flexDirection: "row", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <button
          className={`widget-toggle-btn${mode === "perm" ? " active" : ""}`}
          onClick={() => setMode("perm")}
        >
          Permutation (order matters)
        </button>
        <button
          className={`widget-toggle-btn${mode === "comb" ? " active" : ""}`}
          onClick={() => setMode("comb")}
        >
          Combination (order doesn't matter)
        </button>
      </div>

      <div className="widget-stats" style={{ marginTop: "0.75rem" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>{formula}</span>
      </div>

      <div style={{
        background: "var(--maroon-light)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        padding: "1rem",
        textAlign: "center",
        margin: "0.75rem 0",
      }}>
        <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
          {mode === "perm" ? "Number of ordered arrangements" : "Number of unordered selections"}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--maroon)" }}>
          {result > 1e15 ? result.toExponential(3) : result.toLocaleString()}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
          {mode === "perm"
            ? `Choosing ${safeR} from ${n} where order matters → ${safeR}× fewer arrangements if we ignored order`
            : `Choosing ${safeR} from ${n} where order doesn't matter`}
        </div>
      </div>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>n (population size): <strong>{n}</strong></span>
          <input type="range" min={1} max={20} step={1} value={n}
            onChange={e => { const v = Number(e.target.value); setN(v); if (r > v) setR(v); }} />
        </label>
        <label className="widget-slider-label">
          <span>r (items to choose): <strong>{safeR}</strong></span>
          <input type="range" min={0} max={n} step={1} value={safeR}
            onChange={e => setR(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
