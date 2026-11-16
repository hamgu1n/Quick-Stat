import { useState, useMemo } from "react";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ZAxis,
} from "recharts";
import { makeLCG, qnorm } from "@/lib/stats";

type Shape = "normal" | "right" | "left" | "heavy";

const SHAPES: { id: Shape; label: string; hint: string }[] = [
  { id: "normal", label: "Normal", hint: "Points hug the line: a normal model fits." },
  { id: "right", label: "Right-skewed", hint: "The plot bends upward: the right tail is stretched out." },
  { id: "left", label: "Left-skewed", hint: "The plot bends downward: the left tail is stretched out." },
  { id: "heavy", label: "Heavy tails", hint: "An S-shape: both ends drift away from the line (more extreme values than a normal)." },
];

const BINS = 12;

// R code matching each shape. The JS generators below draw from the same
// families (normal, exponential, mirrored exponential, t with 3 df).
const R_GEN: Record<Shape, (n: number) => string> = {
  normal: n => `x <- rnorm(${n}, mean = 50, sd = 10)`,
  right: n => `x <- rexp(${n}, rate = 1/10)          # right-skewed`,
  left: n => `x <- 100 - rexp(${n}, rate = 1/10)    # left-skewed (mirrored)`,
  heavy: n => `x <- 50 + 10 * rt(${n}, df = 3)       # heavy tails`,
};

function generate(shape: Shape, n: number, seed: number): number[] {
  const rand = makeLCG(seed * 7919 + n);
  const normal = () => {
    const u1 = Math.max(1e-12, rand()), u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const expo = () => -Math.log(Math.max(1e-12, 1 - rand()));
  return Array.from({ length: n }, () => {
    switch (shape) {
      case "normal": return 50 + 10 * normal();
      case "right": return 10 * expo();
      case "left": return 100 - 10 * expo();
      case "heavy": {
        // t with 3 df = Z / sqrt(chi-square(3) / 3)
        const chi = normal() ** 2 + normal() ** 2 + normal() ** 2;
        return 50 + 10 * normal() / Math.sqrt(chi / 3);
      }
    }
  });
}

export function NormalQQWidget() {
  const [shape, setShape] = useState<Shape>("normal");
  const [n, setN] = useState(50);
  const [seed, setSeed] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const sample = useMemo(() => generate(shape, n, seed), [shape, n, seed]);

  const { hist, qq, mean, sd } = useMemo(() => {
    const m = sample.reduce((s, v) => s + v, 0) / n;
    const s = Math.sqrt(sample.reduce((acc, v) => acc + (v - m) ** 2, 0) / (n - 1));

    // Histogram on the raw scale.
    const min = Math.min(...sample), max = Math.max(...sample);
    const width = (max - min) / BINS || 1;
    const counts = Array(BINS).fill(0);
    for (const v of sample) counts[Math.min(BINS - 1, Math.floor((v - min) / width))]++;
    const histData = counts.map((count, i) => ({
      bin: (min + (i + 0.5) * width).toFixed(1),
      count,
    }));

    // Q-Q: sorted standardized data vs. theoretical normal quantiles.
    // (i - 0.5) / n are the plotting positions R's qqnorm uses for n > 10.
    const sorted = [...sample].sort((x, y) => x - y);
    const qqData = sorted.map((v, i) => ({
      theoretical: qnorm((i + 0.5) / n),
      sample: (v - m) / s,
    }));

    return { hist: histData, qq: qqData, mean: m, sd: s };
  }, [sample, n]);

  // Heavy-tailed samples can throw a point out to z = 10+; cap the axes at
  // ±5 so one extreme value doesn't squash everything else into the middle.
  const lim = Math.min(5, Math.ceil(Math.max(3, ...qq.map(p => Math.abs(p.sample)))));
  const hint = SHAPES.find(s => s.id === shape)!.hint;

  const rCode = `set.seed(${seed})
${R_GEN[shape](n)}

mean(x); sd(x)   # ${mean.toFixed(2)}, ${sd.toFixed(2)}

hist(x)          # check the shape
qqnorm(x)        # normal probability plot
qqline(x)        # reference line: points near it suggest normality`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>n = <strong>{n}</strong></span>
        <span>x̄ = <strong>{mean.toFixed(2)}</strong></span>
        <span>s = <strong>{sd.toFixed(2)}</strong></span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "1rem" }}>
        <div>
          <div className="widget-rcode-label">Histogram</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hist} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barCategoryGap={1}>
              <XAxis dataKey="bin" style={{ fontSize: "0.68rem" }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} style={{ fontSize: "0.68rem" }} />
              <Tooltip formatter={(v) => [v, "count"]} labelFormatter={l => `≈ ${l}`} />
              <Bar dataKey="count" fill="var(--maroon)" fillOpacity={0.7} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="widget-rcode-label">Normal probability (Q-Q) plot</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="theoretical" type="number" domain={[-lim, lim]} tickCount={7}
                style={{ fontSize: "0.68rem" }} name="Theoretical" allowDataOverflow />
              <YAxis dataKey="sample" type="number" domain={[-lim, lim]} tickCount={7}
                style={{ fontSize: "0.68rem" }} name="Sample (z)" allowDataOverflow />
              <ZAxis range={[18, 18]} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)} />
              <ReferenceLine segment={[{ x: -lim, y: -lim }, { x: lim, y: lim }]}
                stroke="#999" strokeDasharray="4,3" ifOverflow="hidden" />
              <Scatter data={qq} fill="#3b5b8a" isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", margin: "0.5rem 0 0" }}>{hint}</p>

      <div className="widget-controls">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {SHAPES.map(s => (
            <button key={s.id} className={`widget-toggle-btn${shape === s.id ? " active" : ""}`}
              onClick={() => setShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="widget-slider-label">
          <span>Sample size n: <strong>{n}</strong></span>
          <input type="range" min={10} max={300} step={10} value={n}
            onChange={e => setN(Number(e.target.value))} />
        </label>
        <button className="widget-toggle-btn" onClick={() => setSeed(s => s + 1)}>
          New sample
        </button>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
