import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type Pattern = "good" | "hetero" | "nonlinear";

// Each pattern generates residuals vs fitted values
function makeData(pattern: Pattern) {
  // 30 points, fitted values ranging 30-70
  return Array.from({ length: 30 }, (_, i) => {
    const yhat = 30 + (i / 29) * 40;
    let e: number;
    const t = (i / 29 - 0.5) * 2; // -1 to 1
    const raw = [1.2, -0.4, 0.8, -1.1, 0.3, 0.9, -0.7, 0.5, -0.2, 1.5,
      -0.8, 0.1, -1.3, 0.7, 0.4, -0.5, 1.1, -0.9, 0.6, -0.3,
      0.2, -1.0, 0.8, 0.3, -0.6, 1.4, -0.4, 0.7, -1.2, 0.5][i];
    if (pattern === "good") {
      e = raw * 3;
    } else if (pattern === "hetero") {
      // Spread increases with fitted value (megaphone)
      e = raw * (1 + (yhat - 30) / 10) * 1.5;
    } else {
      // U-shaped: systematic curve
      e = t * t * 8 - 2 + raw * 1.5;
    }
    return { yhat: parseFloat(yhat.toFixed(1)), e: parseFloat(e.toFixed(2)) };
  });
}

const PATTERN_LABELS: Record<Pattern, string> = {
  good: "Good residuals (random scatter)",
  hetero: "Non-constant variance (megaphone)",
  nonlinear: "Non-linear pattern (U-shape)",
};

const PATTERN_DESC: Record<Pattern, string> = {
  good: "Points scatter randomly around zero with constant spread — all four LINE assumptions appear satisfied.",
  hetero: "Spread increases as fitted values grow. This indicates heteroscedasticity (unequal variance) — the E assumption is violated.",
  nonlinear: "A curved pattern means the true relationship is not linear — the L assumption is violated. A linear model will systematically over- or under-predict.",
};

const PATTERN_RCODE: Record<Pattern, string> = {
  good: `fit <- lm(y ~ x, data = df)
plot(fit$fitted.values, fit$residuals,
     main = "Residuals vs. Fitted",
     xlab = "Fitted Values", ylab = "Residuals",
     pch = 19, col = "darkred")
abline(h = 0, lty = 2, col = "gray")`,
  hetero: `# Fan-shaped residuals suggest heteroscedasticity
# Consider a log transform: lm(log(y) ~ x)
plot(fit$fitted.values, fit$residuals,
     pch = 19, col = "darkred")
abline(h = 0, lty = 2, col = "gray")`,
  nonlinear: `# U-shaped residuals suggest a non-linear relationship
# Consider adding a quadratic term: lm(y ~ x + I(x^2))
plot(fit$fitted.values, fit$residuals,
     pch = 19, col = "darkred")
abline(h = 0, lty = 2, col = "gray")`,
};

export function ResidualWidget() {
  const [pattern, setPattern] = useState<Pattern>("good");
  const [showRCode, setShowRCode] = useState(false);

  const data = makeData(pattern);

  return (
    <div className="widget">
      <div className="widget-controls" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
        {(Object.keys(PATTERN_LABELS) as Pattern[]).map(p => (
          <button key={p} className={`widget-toggle-btn${pattern === p ? " active" : ""}`}
            onClick={() => setPattern(p)}>
            {p === "good" ? "Good" : p === "hetero" ? "Heteroscedastic" : "Non-linear"}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: "0.75rem 0 0.5rem" }}>
        {PATTERN_DESC[pattern]}
      </p>

      <p style={{ fontSize: "0.8rem", fontWeight: 600, margin: "0 0 0.25rem" }}>Residuals vs. Fitted Values</p>

      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" dataKey="yhat" name="Fitted" domain={[25, 75]}
            label={{ value: "Fitted Values (ŷ)", position: "insideBottom", offset: -2, fontSize: 10 }}
            tickCount={6} style={{ fontSize: "0.72rem" }} />
          <YAxis type="number" dataKey="e" name="Residual"
            label={{ value: "Residuals (e)", angle: -90, position: "insideLeft", fontSize: 10 }}
            width={48} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(2) : v, ""]}
            labelFormatter={() => ""} />
          <ReferenceLine y={0} stroke="var(--maroon)" strokeWidth={1.5} strokeDasharray="5,3" />
          <Scatter data={data} fill="#3b5b8a" opacity={0.8} />
        </ScatterChart>
      </ResponsiveContainer>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{PATTERN_RCODE[pattern]}</code></pre>}
    </div>
  );
}
