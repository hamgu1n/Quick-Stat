import { useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { makeLCG, dnorm } from "@/lib/stats";

type PopShape = "normal" | "uniform" | "skewed";

const POP_CONFIG: Record<PopShape, { mu: number; sigma: number; label: string }> = {
  normal:  { mu: 5, sigma: 2,    label: "Normal N(5, 2)" },
  uniform: { mu: 5, sigma: 2.887, label: "Uniform U(0, 10)" },
  skewed:  { mu: 5, sigma: 5,    label: "Skewed Right (Exp, mean=5)" },
};

const N_OPTIONS = [1, 5, 10, 30];
const N_SAMPLES = 500;

function sampleFrom(shape: PopShape, rand: () => number): number {
  if (shape === "normal") {
    // Box-Muller
    const u1 = Math.max(1e-10, rand()), u2 = rand();
    return 5 + 2 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  if (shape === "uniform") return rand() * 10;
  // Exponential with mean 5
  return -5 * Math.log(Math.max(1e-10, rand()));
}

function buildHistogram(means: number[], mu: number, sigma: number, n: number) {
  const se = sigma / Math.sqrt(n);
  const lo = mu - 4 * se, hi = mu + 4 * se;
  const bins = 30;
  const step = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  means.forEach(m => {
    const b = Math.floor((m - lo) / step);
    if (b >= 0 && b < bins) counts[b]++;
  });
  const density = counts.map(c => c / (means.length * step));
  return Array.from({ length: bins }, (_, i) => {
    const x = lo + (i + 0.5) * step;
    return { x: parseFloat(x.toFixed(2)), freq: parseFloat(density[i].toFixed(4)),
      normal: parseFloat(dnorm(x, mu, se).toFixed(4)) };
  });
}

export function CLTWidget() {
  const [shape, setShape] = useState<PopShape>("skewed");
  const [n, setN] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(() => {
    const rand = makeLCG(42);
    const { mu, sigma } = POP_CONFIG[shape];
    const means = Array.from({ length: N_SAMPLES }, () => {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += sampleFrom(shape, rand);
      return sum / n;
    });
    return buildHistogram(means, mu, sigma, n);
  }, [shape, n]);

  const { mu, sigma, label } = POP_CONFIG[shape];
  const se = sigma / Math.sqrt(n);

  const rCode = shape === "skewed"
    ? `set.seed(42)
pop <- rexp(10000, rate = 1/5)   # mean=5, skewed right
means <- replicate(${N_SAMPLES}, mean(sample(pop, ${n})))
hist(means, probability = TRUE, main = paste("n =", ${n}),
     xlab = "Sample Mean", col = "#f2dde6")
curve(dnorm(x, mean = ${mu}, sd = ${sigma}/sqrt(${n})),
      add = TRUE, col = "darkred", lwd = 2)`
    : shape === "uniform"
    ? `set.seed(42)
pop <- runif(10000, 0, 10)
means <- replicate(${N_SAMPLES}, mean(sample(pop, ${n})))
hist(means, probability = TRUE, main = paste("n =", ${n}),
     xlab = "Sample Mean", col = "#f2dde6")
curve(dnorm(x, mean = ${mu}, sd = ${sigma}/sqrt(${n})),
      add = TRUE, col = "darkred", lwd = 2)`
    : `set.seed(42)
pop <- rnorm(10000, mean = ${mu}, sd = ${sigma})
means <- replicate(${N_SAMPLES}, mean(sample(pop, ${n})))
hist(means, probability = TRUE, main = paste("n =", ${n}),
     xlab = "Sample Mean", col = "#f2dde6")
curve(dnorm(x, mean = ${mu}, sd = ${sigma}/sqrt(${n})),
      add = TRUE, col = "darkred", lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-controls" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
        {(["normal", "uniform", "skewed"] as PopShape[]).map(s => (
          <button key={s} className={`widget-toggle-btn${shape === s ? " active" : ""}`}
            onClick={() => setShape(s)}>
            {POP_CONFIG[s].label}
          </button>
        ))}
      </div>

      <div className="widget-stats" style={{ marginTop: "0.75rem" }}>
        <span>Population: <strong>{label}</strong></span>
        <span>n = <strong>{n}</strong></span>
        <span>SE = σ/√n = <strong style={{ color: "var(--maroon)" }}>{se.toFixed(3)}</strong></span>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: "0.25rem 0 0.5rem" }}>
        Histogram of {N_SAMPLES} sample means. Red curve = N(μ, σ/√n) — the CLT approximation.
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tickCount={7}
            tickFormatter={(v: number) => v.toFixed(1)} style={{ fontSize: "0.72rem" }} />
          <YAxis width={52} tickFormatter={(v: number) => v.toFixed(2)} style={{ fontSize: "0.72rem" }} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v, ""]} labelFormatter={l => `x̄ = ${l}`} />
          <Bar dataKey="freq" name="Sample means" fill="var(--maroon-light)" stroke="var(--maroon)"
            strokeWidth={0.5} isAnimationActive={false} />
          <Line type="monotone" dataKey="normal" name="N(μ, σ/√n)"
            stroke="var(--maroon)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {N_OPTIONS.map(v => (
            <button key={v} className={`widget-toggle-btn${n === v ? " active" : ""}`}
              onClick={() => setN(v)}>
              n = {v}
            </button>
          ))}
        </div>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
