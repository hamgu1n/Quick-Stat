import { useState, useMemo } from "react";
import { Switch } from "radix-ui";
import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { dnorm } from "@/lib/stats";

type Mode = "eq" | "le" | "ge";

/**
 * Binomial PMF for k = 0..n via the recurrence
 *   P(k+1) = P(k) · (n - k)/(k + 1) · p/(1 - p)
 * which avoids computing large factorials directly.
 */
function binomPmf(n: number, p: number): number[] {
  if (p <= 0) return Array.from({ length: n + 1 }, (_, k) => (k === 0 ? 1 : 0));
  if (p >= 1) return Array.from({ length: n + 1 }, (_, k) => (k === n ? 1 : 0));
  const pmf = [Math.pow(1 - p, n)];
  const ratio = p / (1 - p);
  for (let k = 0; k < n; k++) pmf.push(pmf[k] * ((n - k) / (k + 1)) * ratio);
  return pmf;
}

/**
 * Bar chart of a Binomial(n, p) distribution with a highlighted event.
 * Defaults match Example 5.5.3 (6 viewers, 25% share rate).
 */
export function BinomialWidget() {
  const [n, setN] = useState(6);
  const [p, setP] = useState(0.25);
  const [k, setK] = useState(2);
  const [mode, setMode] = useState<Mode>("le");
  const [showNormal, setShowNormal] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  // k can't exceed n; clamp rather than store a second copy of state.
  const kEff = Math.min(k, n);

  const pmf = useMemo(() => binomPmf(n, p), [n, p]);
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));

  const inEvent = (x: number) =>
    mode === "eq" ? x === kEff : mode === "le" ? x <= kEff : x >= kEff;
  const prob = pmf.reduce((s, v, x) => (inEvent(x) ? s + v : s), 0);

  const data = pmf.map((v, x) => ({
    x,
    prob: v,
    normal: showNormal && sd > 0 ? dnorm(x, mean, sd) : null,
  }));

  const sfOk = n * p >= 10 && n * (1 - p) >= 10;

  const label =
    mode === "eq" ? `P(X = ${kEff})` : mode === "le" ? `P(X ≤ ${kEff})` : `P(X ≥ ${kEff})`;

  const rLine =
    mode === "eq"
      ? `dbinom(${kEff}, size = n, prob = p)`
      : mode === "le"
        ? `pbinom(${kEff}, size = n, prob = p)`
        : `1 - pbinom(${kEff - 1}, size = n, prob = p)   # complement: 1 - P(X <= ${kEff - 1})`;

  const rCode = `n <- ${n}; p <- ${p}

# ${label}
${rLine}   # ${prob.toFixed(4)}

# Mean and standard deviation
n * p                   # ${mean.toFixed(2)}
sqrt(n * p * (1 - p))   # ${sd.toFixed(3)}

# Full distribution as a bar chart
barplot(dbinom(0:n, n, p), names.arg = 0:n)`;

  // With many bars, only label every few ticks so they stay readable.
  const tickInterval = n <= 20 ? 0 : Math.ceil(n / 15) - 1;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>{label} = <strong style={{ color: "var(--maroon)" }}>{prob.toFixed(4)}</strong></span>
        <span>μ = np = <strong>{mean.toFixed(2)}</strong></span>
        <span>σ = <strong>{sd.toFixed(3)}</strong></span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="12%">
          <XAxis dataKey="x" interval={tickInterval} style={{ fontSize: "0.72rem" }} />
          <YAxis width={50} tickFormatter={(v: number) => v.toFixed(2)} style={{ fontSize: "0.72rem" }} />
          <Tooltip
            formatter={(v, name) => [typeof v === "number" ? v.toFixed(4) : v, name === "prob" ? "P(X = k)" : "normal approx."]}
            labelFormatter={l => `k = ${l}`} />
          <Bar dataKey="prob" isAnimationActive={false}>
            {data.map(d => (
              <Cell key={d.x} fill={inEvent(d.x) ? "var(--maroon)" : "var(--maroon-muted)"}
                fillOpacity={inEvent(d.x) ? 0.9 : 0.35} />
            ))}
          </Bar>
          {showNormal && (
            <Line type="monotone" dataKey="normal" stroke="#3b5b8a" strokeWidth={2}
              dot={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {showNormal && (
        <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0", color: sfOk ? "green" : "#c0392b" }}>
          Success-failure check: np = {mean.toFixed(1)}, n(1 − p) = {(n - mean).toFixed(1)}.{" "}
          {sfOk ? "Both are at least 10, so the normal curve is a good approximation."
            : "At least one is below 10, so the normal curve is not a reliable approximation yet."}
        </p>
      )}

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["eq", "le", "ge"] as Mode[]).map(m => (
            <button key={m} className={`widget-toggle-btn${mode === m ? " active" : ""}`}
              onClick={() => setMode(m)}>
              {m === "eq" ? "Exactly k" : m === "le" ? "At most k" : "At least k"}
            </button>
          ))}
        </div>
        <div className="widget-switch-row">
          <Switch.Root
            id="binomial-normal-approx"
            className="settings-switch"
            checked={showNormal}
            onCheckedChange={setShowNormal}
          >
            <Switch.Thumb className="settings-switch__thumb" />
          </Switch.Root>
          <label htmlFor="binomial-normal-approx">Show the normal approximation</label>
        </div>
        <label className="widget-slider-label">
          <span>k (number of successes): <strong>{kEff}</strong></span>
          <input type="range" min={0} max={n} step={1} value={kEff}
            onChange={e => setK(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>n (number of trials): <strong>{n}</strong></span>
          <input type="range" min={1} max={100} step={1} value={n}
            onChange={e => setN(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>p (probability of success): <strong>{p}</strong></span>
          <input type="range" min={0.01} max={0.99} step={0.01} value={p}
            onChange={e => setP(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
