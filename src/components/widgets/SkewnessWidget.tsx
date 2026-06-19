import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BIN_CENTERS = [10, 20, 30, 40, 50, 60, 70, 80];
const BIN_LABELS = ["10", "20", "30", "40", "50", "60", "70", "80"];

const PROFILES: Record<string, number[]> = {
  "-2": [1, 2, 3, 5, 8, 14, 22, 30],
  "-1": [3, 5, 8, 12, 18, 22, 20, 12],
  "0": [6, 12, 18, 22, 22, 18, 12, 6],
  "1": [12, 20, 22, 18, 12, 8, 5, 3],
  "2": [30, 22, 14, 8, 5, 3, 2, 1],
};

const SKEW_LABELS: Record<string, string> = {
  "-2": "Strongly Left-Skewed",
  "-1": "Mildly Left-Skewed",
  "0": "Symmetric",
  "1": "Mildly Right-Skewed",
  "2": "Strongly Right-Skewed",
};

function weightedMean(counts: number[], centers: number[]) {
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.reduce((sum, c, i) => sum + c * centers[i], 0) / total;
}

function weightedMedian(counts: number[], centers: number[]) {
  const total = counts.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  for (let i = 0; i < counts.length; i++) {
    cumulative += counts[i];
    if (cumulative >= total / 2) return centers[i];
  }
  return centers[centers.length - 1];
}

const R_CODE: Record<string, string> = {
  "-2": `set.seed(1)
data <- -rexp(200, rate = 0.05) + 90   # left-skewed
hist(data, main = "Left-Skewed Distribution",
     xlab = "Value", col = "lightblue")`,
  "-1": `set.seed(1)
data <- -rexp(200, rate = 0.08) + 85
hist(data, main = "Mildly Left-Skewed",
     xlab = "Value", col = "lightblue")`,
  "0": `set.seed(1)
data <- rnorm(200, mean = 45, sd = 15)
hist(data, main = "Symmetric Distribution",
     xlab = "Value", col = "lightblue")`,
  "1": `set.seed(1)
data <- rexp(200, rate = 0.08) + 10
hist(data, main = "Mildly Right-Skewed",
     xlab = "Value", col = "lightblue")`,
  "2": `set.seed(1)
data <- rexp(200, rate = 0.05) + 10    # right-skewed
hist(data, main = "Right-Skewed Distribution",
     xlab = "Value", col = "lightblue")`,
};

export function SkewnessWidget() {
  const [skew, setSkew] = useState(0);
  const [showRCode, setShowRCode] = useState(false);

  const key = String(skew);
  const counts = PROFILES[key];

  const bins = useMemo(
    () => counts.map((count, i) => ({ bin: BIN_LABELS[i], count })),
    [counts]
  );
  const avg = useMemo(() => weightedMean(counts, BIN_CENTERS), [counts]);
  const med = useMemo(() => weightedMedian(counts, BIN_CENTERS), [counts]);

  const relationship =
    avg > med + 2 ? "Mean > Median" : avg < med - 2 ? "Mean < Median" : "Mean ≈ Median";

  const rCode = `${R_CODE[key]}
abline(v = mean(data),   col = "red",  lwd = 2)  # mean
abline(v = median(data), col = "blue", lwd = 2)  # median
legend("topright",
       legend = c("Mean", "Median"),
       col = c("red", "blue"), lwd = 2)`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>
          Mean: <strong style={{ color: "var(--maroon)" }}>{avg.toFixed(1)}</strong>
        </span>
        <span>
          Median: <strong style={{ color: "#3b5b8a" }}>{med.toFixed(1)}</strong>
        </span>
        <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
          {relationship}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={bins} barCategoryGap="0%" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="bin" style={{ fontSize: "0.75rem" }} />
          <YAxis width={35} style={{ fontSize: "0.75rem" }} allowDecimals={false} />
          <Tooltip formatter={(v) => [v, "Frequency"]} />
          <Bar
            dataKey="count"
            fill="var(--maroon-light)"
            stroke="var(--maroon)"
            strokeWidth={1}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="widget-controls">
        <label className="widget-slider-label">
          <span>
            Shape: <strong>{SKEW_LABELS[key]}</strong>
          </span>
          <input
            type="range"
            min={-2}
            max={2}
            step={1}
            value={skew}
            onChange={(e) => setSkew(Number(e.target.value))}
          />
        </label>
      </div>
      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && (
        <pre className="widget-rcode">
          <code>{rCode}</code>
        </pre>
      )}
    </div>
  );
}
