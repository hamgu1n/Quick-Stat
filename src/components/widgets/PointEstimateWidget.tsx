import { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { makeLCG } from "@/lib/stats";

// A fixed "city" of 2,000 workers' commute times in minutes. Right-skewed
// (a gamma shape: most commutes are short, a few are long), like real
// commutes. Built once from a fixed seed so every student sees the same city.
const POP_SIZE = 2000;
const CUTOFF = 30; // p = share of commutes longer than this
const POPULATION = (() => {
  const rand = makeLCG(2024);
  return Array.from({ length: POP_SIZE }, () => {
    // Sum of 3 exponentials (scale 8) = gamma(shape 3, scale 8), mean 24.
    let t = 0;
    for (let k = 0; k < 3; k++) t += -8 * Math.log(1 - rand());
    return Math.round(t * 10) / 10;
  });
})();

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[], divisor: number) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / divisor);
};

// The true parameters (unknown to the "researcher" until revealed).
const MU = mean(POPULATION);
const SIGMA = sd(POPULATION, POP_SIZE);
const P = POPULATION.filter((t) => t > CUTOFF).length / POP_SIZE;

/** A simple random sample of size n (without replacement) from the population. */
function drawSample(n: number, seed: number) {
  const rand = makeLCG(seed);
  const idx = Array.from({ length: POP_SIZE }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (POP_SIZE - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => POPULATION[i]);
}

type Estimate = { xbar: number; s: number; phat: number };

function estimate(sample: number[]): Estimate {
  return {
    xbar: mean(sample),
    s: sd(sample, sample.length - 1),
    phat: sample.filter((t) => t > CUTOFF).length / sample.length,
  };
}

/** The most samples kept in the dot plot. */
const MAX_SAMPLES = 100;

/**
 * Point estimates (Section 4.1): draw a random sample of commute times and
 * see its point estimates (x-bar, s, p-hat) for the unknown parameters
 * (mu, sigma, p). Drawing many samples shows that the estimates vary from
 * sample to sample but center on the truth, and vary less for bigger n.
 */
export function PointEstimateWidget() {
  const [n, setN] = useState(25);
  const [seed, setSeed] = useState(1);
  const [history, setHistory] = useState<number[]>(() => [estimate(drawSample(25, 1)).xbar]);
  const [reveal, setReveal] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const sample = useMemo(() => drawSample(n, seed), [n, seed]);
  const est = useMemo(() => estimate(sample), [sample]);

  function draw(requested: number) {
    // Never go past MAX_SAMPLES dots.
    const count = Math.min(requested, MAX_SAMPLES - history.length);
    if (count <= 0) return;
    const newMeans: number[] = [];
    let s = seed;
    for (let k = 0; k < count; k++) {
      s += 1;
      newMeans.push(estimate(drawSample(n, s)).xbar);
    }
    setSeed(s);
    setHistory((h) => [...h, ...newMeans]);
  }

  /** Clear the dot plot and start again from one new sample. */
  function startOver() {
    const next = seed + 1;
    setSeed(next);
    setHistory([estimate(drawSample(n, next)).xbar]);
  }

  function changeN(next: number) {
    // Estimates from a different sample size aren't comparable, so start over.
    setN(next);
    setHistory([estimate(drawSample(next, seed)).xbar]);
  }

  // Stack the dots so repeated values pile up like a dot plot.
  const dots = useMemo(() => {
    const binWidth = 0.5;
    const heights = new Map<number, number>();
    return history.map((xbar, i) => {
      const bin = Math.round(xbar / binWidth);
      const y = (heights.get(bin) ?? 0) + 1;
      heights.set(bin, y);
      return { x: xbar, y, latest: i === history.length - 1 };
    });
  }, [history]);
  const maxStack = Math.max(5, ...dots.map((d) => d.y));
  const avgOfMeans = mean(history);
  const full = history.length >= MAX_SAMPLES;

  const hidden = "?";
  const rCode = `# A sample of n = ${n} commute times (minutes) from a population
# (R's random numbers differ from this applet's, so your values will too)
set.seed(${seed})
population <- round(rgamma(${POP_SIZE}, shape = 3, scale = 8), 1)
x <- sample(population, ${n})

# Point estimates
mean(x)        # x-bar estimates mu    (applet: ${est.xbar.toFixed(2)})
sd(x)          # s estimates sigma     (applet: ${est.s.toFixed(2)})
mean(x > ${CUTOFF})   # p-hat estimates p (applet: ${est.phat.toFixed(3)})

# Repeat for many samples: the x-bars center on mu
xbars <- replicate(${history.length}, mean(sample(population, ${n})))
mean(xbars); mean(population)`;

  return (
    <div className="widget">
      <div className="point-est-grid">
        <div className="point-est-row point-est-row--head">
          <span />
          <span>Point estimate (from your sample)</span>
          <span>Parameter (whole population)</span>
        </div>
        <div className="point-est-row">
          <span>Mean commute</span>
          <span>x̄ = <strong>{est.xbar.toFixed(2)}</strong> min</span>
          <span>μ = <strong>{reveal ? MU.toFixed(2) : hidden}</strong>{reveal && " min"}</span>
        </div>
        <div className="point-est-row">
          <span>Standard deviation</span>
          <span>s = <strong>{est.s.toFixed(2)}</strong> min</span>
          <span>σ = <strong>{reveal ? SIGMA.toFixed(2) : hidden}</strong>{reveal && " min"}</span>
        </div>
        <div className="point-est-row">
          <span>Share over {CUTOFF} min</span>
          <span>p̂ = <strong>{est.phat.toFixed(3)}</strong></span>
          <span>p = <strong>{reveal ? P.toFixed(3) : hidden}</strong></span>
        </div>
      </div>

      <p className="point-est-caption">
        Each dot is the x̄ from one sample of n = {n} ({history.length} of {MAX_SAMPLES} so far
        {history.length > 1 && <>, averaging <strong>{avgOfMeans.toFixed(2)}</strong></>}).
        {full && " That's the most the plot holds; start over to draw again."}
        {reveal ? " The dashed line is the true mean μ." : " Reveal the true values to see where μ is."}
      </p>

      <ResponsiveContainer width="100%" height={150}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[10, 40]}
            ticks={[10, 15, 20, 25, 30, 35, 40]}
            allowDataOverflow
            style={{ fontSize: "0.75rem" }}
            label={{ value: "x̄ (minutes)", position: "insideBottomRight", offset: -2, fontSize: 11 }}
          />
          <YAxis type="number" dataKey="y" domain={[0, maxStack + 1]} hide />
          <Tooltip
            formatter={(v, name) => (name === "x" ? [Number(v).toFixed(2), "x̄"] : [null, null])}
            cursor={false}
          />
          {reveal && <ReferenceLine x={MU} stroke="var(--maroon)" strokeDasharray="5 4" strokeWidth={2} />}
          <Scatter data={dots.filter((d) => !d.latest)} fill="var(--maroon-muted)" isAnimationActive={false} />
          <Scatter data={dots.filter((d) => d.latest)} fill="var(--maroon)" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>Sample size (n): <strong>{n}</strong></span>
          <input type="range" min={5} max={200} step={5} value={n} onChange={(e) => changeN(Number(e.target.value))} />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="widget-toggle-btn" onClick={() => draw(1)} disabled={full}>Draw a new sample</button>
          <button type="button" className="widget-toggle-btn" onClick={() => draw(5)} disabled={full}>Draw 5 more</button>
          {full && (
            <button type="button" className="widget-toggle-btn" onClick={startOver}>Start over</button>
          )}
          <button type="button" className={`widget-toggle-btn${reveal ? " active" : ""}`} onClick={() => setReveal((r) => !r)}>
            {reveal ? "Hide the true values" : "Reveal the true values"}
          </button>
        </div>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
