import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dt, pt } from "@/lib/stats";

type Tail = "left" | "two" | "right";

const POINTS = 300;

export function TTestWidget() {
  const [xbar, setXbar] = useState(2450);
  const [mu0, setMu0] = useState(2300);
  const [s, setS] = useState(320);
  const [n, setN] = useState(16);
  const [tail, setTail] = useState<Tail>("right");
  const [showRCode, setShowRCode] = useState(false);

  const df = n - 1;
  const se = s / Math.sqrt(n);
  const tStat = (xbar - mu0) / se;

  let pValue: number;
  if (tail === "left") pValue = pt(tStat, df);
  else if (tail === "right") pValue = 1 - pt(tStat, df);
  else pValue = 2 * Math.min(pt(tStat, df), 1 - pt(tStat, df));

  const T_RANGE = 5;

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const tVal = -T_RANGE + (i / (POINTS - 1)) * 2 * T_RANGE;
      const y = dt(tVal, df);
      let shade: number | null = null;
      if (tail === "left" && tVal <= tStat) shade = y;
      else if (tail === "right" && tVal >= tStat) shade = y;
      else if (tail === "two") {
        if (tVal <= -Math.abs(tStat) || tVal >= Math.abs(tStat)) shade = y;
      }
      return { t: parseFloat(tVal.toFixed(3)), y: parseFloat(y.toFixed(6)), shade };
    });
  }, [df, tStat, tail]);

  const tailLabel = { left: "left-tailed", two: "two-tailed", right: "right-tailed" }[tail];

  const rCode = `xbar <- ${xbar}; mu0 <- ${mu0}; s <- ${s}; n <- ${n}
se <- s / sqrt(n)              # ${se.toFixed(2)}
t_stat <- (xbar - mu0) / se   # ${tStat.toFixed(4)}
df <- n - 1                    # ${df}

# p-value (${tailLabel})
${tail === "left" ? `pt(t_stat, df = df)` : tail === "right" ? `pt(t_stat, df = df, lower.tail = FALSE)` : `2 * pt(-abs(t_stat), df = df)`}   # ${pValue.toFixed(4)}

# Or run the full test:
# t.test(x, mu = ${mu0}, alternative = "${tail === "two" ? "two.sided" : tail === "left" ? "less" : "greater"}")`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>t = <strong style={{ color: "var(--maroon)" }}>{tStat.toFixed(3)}</strong></span>
        <span>df = <strong>{df}</strong></span>
        <span>SE = s/√n = <strong>{se.toFixed(2)}</strong></span>
        <span>p-value = <strong style={{ color: pValue < 0.05 ? "green" : "inherit" }}>{pValue.toFixed(4)}</strong></span>
        {pValue < 0.05
          ? <span style={{ color: "green", fontSize: "0.82rem" }}>Reject H₀ at α = 0.05</span>
          : <span style={{ color: "var(--muted-foreground)", fontSize: "0.82rem" }}>Fail to reject H₀ at α = 0.05</span>}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
          <XAxis dataKey="t" type="number" domain={[-T_RANGE, T_RANGE]} tickCount={11}
            tickFormatter={(v: number) => v.toFixed(1)} style={{ fontSize: "0.72rem" }}
            label={{ value: "t statistic", position: "insideBottom", offset: -4, fontSize: 10 }} />
          <YAxis width={52} tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `t = ${l}`} />
          <Area type="monotone" dataKey="shade" fill="var(--maroon)" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} />
          <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={tStat} stroke="#3b5b8a" strokeWidth={2}
            label={{ value: `t = ${tStat.toFixed(2)}`, position: "top", fontSize: 10, fill: "#3b5b8a" }} />
          <ReferenceLine x={0} stroke="#999" strokeWidth={1} strokeDasharray="3,3" />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["left", "two", "right"] as Tail[]).map(tailOpt => (
            <button key={tailOpt} className={`widget-toggle-btn${tail === tailOpt ? " active" : ""}`}
              onClick={() => setTail(tailOpt)}>
              {tailOpt === "left" ? "Left-tailed" : tailOpt === "two" ? "Two-tailed" : "Right-tailed"}
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>x̄ (sample mean): <strong>{xbar}</strong> mg</span>
          <input type="range" min={1900} max={2700} step={10} value={xbar}
            onChange={e => setXbar(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>μ₀ (null mean): <strong>{mu0}</strong> mg</span>
          <input type="range" min={1900} max={2700} step={50} value={mu0}
            onChange={e => setMu0(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>s (sample SD): <strong>{s}</strong></span>
          <input type="range" min={50} max={700} step={10} value={s}
            onChange={e => setS(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>n (sample size): <strong>{n}</strong></span>
          <input type="range" min={2} max={100} step={1} value={n}
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
