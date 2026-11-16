import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dnorm, pnorm } from "@/lib/stats";

type Tail = "left" | "two" | "right";

const POINTS = 300;

/**
 * One-proportion z-test: shades the p-value on the null distribution of p̂.
 * Defaults match Example 8.2.2 (500 users, 182 daily, p0 = 0.40).
 */
export function OnePropTestWidget() {
  const [n, setN] = useState(500);
  const [x, setX] = useState(182);
  const [p0, setP0] = useState(0.4);
  const [tail, setTail] = useState<Tail>("two");
  const [showRCode, setShowRCode] = useState(false);

  // The success count can't exceed n; clamp instead of syncing state.
  const xEff = Math.min(x, n);
  const pHat = xEff / n;
  // Standard error uses p0, not p̂: the test assumes H0 is true.
  const se = Math.sqrt((p0 * (1 - p0)) / n);
  const z = (pHat - p0) / se;

  let pValue: number;
  if (tail === "left") pValue = pnorm(z);
  else if (tail === "right") pValue = 1 - pnorm(z);
  else pValue = 2 * (1 - pnorm(Math.abs(z)));

  const successes = n * p0, failures = n * (1 - p0);
  const conditionsOk = successes >= 10 && failures >= 10;

  // Plot range: wide enough for the null curve and the observed p̂.
  const xMin = Math.max(0, Math.min(p0 - 4 * se, pHat - se));
  const xMax = Math.min(1, Math.max(p0 + 4 * se, pHat + se));

  const data = useMemo(() => {
    const cut = Math.abs(pHat - p0);
    return Array.from({ length: POINTS }, (_, i) => {
      const v = xMin + (i / (POINTS - 1)) * (xMax - xMin);
      const y = dnorm(v, p0, se);
      let inTail: boolean;
      if (tail === "left") inTail = v <= pHat;
      else if (tail === "right") inTail = v >= pHat;
      else inTail = v <= p0 - cut || v >= p0 + cut;
      return { v: parseFloat(v.toFixed(5)), y, shade: inTail ? y : null };
    });
  }, [xMin, xMax, p0, se, pHat, tail]);

  const alt = { left: "less", two: "two.sided", right: "greater" }[tail];
  const pvLine =
    tail === "left" ? "pnorm(z)"
      : tail === "right" ? "pnorm(z, lower.tail = FALSE)"
        : "2 * pnorm(-abs(z))";

  const rCode = `x <- ${xEff}; n <- ${n}; p0 <- ${p0}

p_hat <- x / n                          # ${pHat.toFixed(4)}
se <- sqrt(p0 * (1 - p0) / n)           # ${se.toFixed(4)}  (uses p0, not p_hat)
z <- (p_hat - p0) / se                  # ${z.toFixed(3)}
${pvLine}   # p-value: ${pValue.toFixed(4)}

# Same test in one line (correct = FALSE matches the formula above)
prop.test(x, n, p = p0, alternative = "${alt}", correct = FALSE)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>p̂ = {xEff}/{n} = <strong>{pHat.toFixed(4)}</strong></span>
        <span>z = <strong style={{ color: "var(--maroon)" }}>{z.toFixed(3)}</strong></span>
        <span>p-value = <strong style={{ color: pValue < 0.05 ? "green" : "inherit" }}>{pValue < 0.0001 ? "< 0.0001" : pValue.toFixed(4)}</strong></span>
        {pValue < 0.05
          ? <span style={{ color: "green", fontSize: "0.82rem" }}>Reject H₀ at α = 0.05</span>
          : <span style={{ color: "var(--muted-foreground)", fontSize: "0.82rem" }}>Fail to reject H₀ at α = 0.05</span>}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 28, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="v" type="number" domain={[xMin, xMax]} tickCount={7}
            tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.72rem" }} />
          <YAxis hide />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v, "density"]}
            labelFormatter={l => `p̂ = ${l}`} />
          <Area type="monotone" dataKey="shade" fill="var(--maroon)" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} />
          <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={pHat} stroke="#3b5b8a" strokeWidth={2}
            label={{ value: `p̂=${pHat.toFixed(3)}`, position: "top", fontSize: 10, fill: "#3b5b8a" }} />
          <ReferenceLine x={p0} stroke="#999" strokeWidth={1.5} strokeDasharray="4,3"
            label={{ value: `p₀=${p0}`, position: "insideTopLeft", fontSize: 10, fill: "#999" }} />
        </ComposedChart>
      </ResponsiveContainer>

      <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0", color: conditionsOk ? "green" : "#c0392b" }}>
        Success-failure check (using p₀): np₀ = {successes.toFixed(1)}, n(1 − p₀) = {failures.toFixed(1)}.{" "}
        {conditionsOk ? "Both are at least 10, so the normal model applies."
          : "At least one is below 10, so this z-test is not reliable."}
      </p>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["left", "two", "right"] as Tail[]).map(t => (
            <button key={t} className={`widget-toggle-btn${tail === t ? " active" : ""}`}
              onClick={() => setTail(t)}>
              {t === "left" ? "Hₐ: p < p₀" : t === "two" ? "Hₐ: p ≠ p₀" : "Hₐ: p > p₀"}
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>x (number of successes): <strong>{xEff}</strong></span>
          <input type="range" min={0} max={n} step={1} value={xEff}
            onChange={e => setX(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>n (sample size): <strong>{n}</strong></span>
          <input type="range" min={10} max={2000} step={10} value={n}
            onChange={e => setN(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>p₀ (null hypothesis proportion): <strong>{p0}</strong></span>
          <input type="range" min={0.01} max={0.99} step={0.01} value={p0}
            onChange={e => setP0(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
