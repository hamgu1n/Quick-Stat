import { useState, useMemo } from "react";
import { makeLCG } from "@/lib/stats";

type Method = "srs" | "systematic" | "stratified" | "cluster";

// 50 people arranged in a 5-row × 10-column grid.
// Strata = rows (0–4). Clusters = column-pairs: [0-1],[2-3],[4-5],[6-7],[8-9].
const ROWS = 5, COLS = 10, N = ROWS * COLS, SAMPLE_SIZE = 10;

function getSelected(method: Method, seed: number): Set<number> {
  const rand = makeLCG(seed);
  const sel = new Set<number>();

  if (method === "srs") {
    const pool = Array.from({ length: N }, (_, i) => i);
    while (sel.size < SAMPLE_SIZE) {
      const idx = Math.floor(rand() * pool.length);
      sel.add(pool.splice(idx, 1)[0]);
    }
  } else if (method === "systematic") {
    const start = Math.floor(rand() * (N / SAMPLE_SIZE));
    for (let i = 0; i < SAMPLE_SIZE; i++) sel.add(start + i * (N / SAMPLE_SIZE));
  } else if (method === "stratified") {
    // 2 random from each of 5 rows
    for (let row = 0; row < ROWS; row++) {
      const rowIndices = Array.from({ length: COLS }, (_, c) => row * COLS + c);
      let picked = 0;
      while (picked < 2) {
        const i = Math.floor(rand() * rowIndices.length);
        sel.add(rowIndices.splice(i, 1)[0]);
        picked++;
      }
    }
  } else {
    // cluster: 5 clusters of (2 cols × 5 rows = 10 people); pick 1 cluster
    const clusterIdx = Math.floor(rand() * 5);
    for (let row = 0; row < ROWS; row++) {
      for (let c = 0; c < 2; c++) {
        sel.add(row * COLS + clusterIdx * 2 + c);
      }
    }
  }
  return sel;
}

const METHOD_LABELS: Record<Method, string> = {
  srs: "Simple Random",
  systematic: "Systematic",
  stratified: "Stratified",
  cluster: "Cluster",
};

const METHOD_DESC: Record<Method, string> = {
  srs: "10 individuals chosen at random from all 50 — like drawing names from a hat.",
  systematic: "Start at a random position, then pick every 5th person down the list.",
  stratified: "Divide into 5 rows (strata) and randomly pick 2 from each row.",
  cluster: "Divide into 5 column-pair clusters; randomly select 1 entire cluster (10 people).",
};

const R_CODE: Record<Method, string> = {
  srs: `population <- 1:50
sample(population, size = 10)   # simple random sample`,
  systematic: `population <- 1:50
start <- sample(1:5, 1)         # random start
systematic_sample <- seq(start, 50, by = 5)`,
  stratified: `library(dplyr)
df <- data.frame(id = 1:50, stratum = rep(1:5, each = 10))
df %>%
  group_by(stratum) %>%
  slice_sample(n = 2)           # 2 from each stratum`,
  cluster: `clusters <- split(1:50, rep(1:5, each = 10))
chosen_cluster <- sample(clusters, 1)[[1]]`,
};

export function SamplingMethodWidget() {
  const [method, setMethod] = useState<Method>("srs");
  const [seed, setSeed] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const selected = useMemo(() => getSelected(method, seed), [method, seed]);

  return (
    <div className="widget">
      <div className="widget-controls" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
        {(Object.keys(METHOD_LABELS) as Method[]).map((m) => (
          <button
            key={m}
            className={`widget-toggle-btn${method === m ? " active" : ""}`}
            onClick={() => setMethod(m)}
          >
            {METHOD_LABELS[m]}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: "0.75rem 0 0.5rem" }}>
        {METHOD_DESC[method]}
      </p>

      {/* Population grid */}
      <svg viewBox={`0 0 ${COLS * 28} ${ROWS * 28}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }}>
        {Array.from({ length: N }, (_, i) => {
          const row = Math.floor(i / COLS), col = i % COLS;
          const isSelected = selected.has(i);
          return (
            <circle
              key={i}
              cx={col * 28 + 14}
              cy={row * 28 + 14}
              r={10}
              fill={isSelected ? "var(--maroon)" : "var(--maroon-light)"}
              stroke={isSelected ? "var(--maroon)" : "var(--border)"}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
        <span style={{ color: "var(--maroon)", fontWeight: 600 }}>● Selected (n = {SAMPLE_SIZE})</span>
        {"  "}
        <span>○ Not selected (N = {N})</span>
      </div>

      <div className="widget-controls" style={{ marginTop: "0.75rem" }}>
        <button className="widget-toggle-btn" onClick={() => setSeed(s => s + 1)}>
          Resample
        </button>
      </div>

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && (
        <pre className="widget-rcode"><code>{R_CODE[method]}</code></pre>
      )}
    </div>
  );
}
