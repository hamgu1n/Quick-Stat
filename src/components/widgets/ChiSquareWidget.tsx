import { useState, useMemo } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { dchisq, pchisq } from "@/lib/stats";

const POINTS = 300;

export function ChiSquareWidget() {
  const [df, setDf] = useState(5);
  const [chiStat, setChiStat] = useState(7);
  const [showRCode, setShowRCode] = useState(false);

  const pValue = 1 - pchisq(chiStat, df);
  const xMax = Math.max(df * 3, 30, chiStat + 5);

  const data = useMemo(() => {
    return Array.from({ length: POINTS }, (_, i) => {
      const x = (i / (POINTS - 1)) * xMax;
      const y = dchisq(x, df);
      return {
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(6)),
        shade: x >= chiStat ? parseFloat(y.toFixed(6)) : null,
      };
    });
  }, [df, chiStat, xMax]);

  const rCode = `df <- ${df}
chi_stat <- ${chiStat}

# Chi-square distribution curve
curve(dchisq(x, df), from = 0, to = ${xMax.toFixed(1)},
      main = paste("χ² Distribution (df =", df, ")"),
      xlab = "χ²", ylab = "Density", col = "darkred", lwd = 2)

# p-value (right tail)
pchisq(chi_stat, df, lower.tail = FALSE)   # ${pValue.toFixed(4)}
abline(v = chi_stat, col = "#3b5b8a", lty = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>df = <strong>{df}</strong></span>
        <span>χ² = <strong style={{ color: "#3b5b8a" }}>{chiStat}</strong></span>
        <span>p-value = <strong style={{ color: pValue < 0.05 ? "green" : "inherit" }}>{pValue.toFixed(4)}</strong></span>
        {pValue < 0.05 && <span style={{ color: "green", fontSize: "0.82rem" }}>Reject H₀ at α = 0.05</span>}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={[0, xMax]} tickCount={8}
            tickFormatter={(v: number) => v.toFixed(0)} style={{ fontSize: "0.72rem" }} />
          <YAxis width={52} tickFormatter={(v: number) => v.toFixed(3)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v, ""]} labelFormatter={l => `χ² = ${l}`} />
          <Area type="monotone" dataKey="shade" fill="var(--maroon)" fillOpacity={0.35}
            stroke="none" isAnimationActive={false} />
          <Line type="monotone" dataKey="y" stroke="var(--maroon)" strokeWidth={2}
            dot={false} isAnimationActive={false} />
          <ReferenceLine x={chiStat} stroke="#3b5b8a" strokeWidth={2}
            label={{ value: `χ²=${chiStat}`, position: "top", fontSize: 10, fill: "#3b5b8a" }} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Degrees of freedom (df): <strong>{df}</strong></span>
          <input type="range" min={1} max={20} step={1} value={df}
            onChange={e => setDf(Number(e.target.value))} />
        </label>
        <label className="widget-slider-label">
          <span>χ² test statistic: <strong>{chiStat}</strong></span>
          <input type="range" min={0} max={Math.max(df * 3, 30)} step={0.1} value={chiStat}
            onChange={e => setChiStat(Number(e.target.value))} />
        </label>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
