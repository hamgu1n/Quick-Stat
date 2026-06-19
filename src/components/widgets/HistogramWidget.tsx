import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const EXAM_DATA = [
  51, 55, 58, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70, 70, 71, 72, 72, 73, 73,
  74, 74, 75, 75, 76, 76, 77, 77, 78, 78, 79, 80, 80, 81, 82, 83, 84, 85, 85,
  86, 87, 88, 89, 90, 91, 92, 94, 96, 98, 100, 102,
];

const DATA_MIN = 50;
const DATA_MAX = 105;

function createBins(data: number[], count: number) {
  const width = (DATA_MAX - DATA_MIN) / count;
  return Array.from({ length: count }, (_, i) => {
    const lo = DATA_MIN + i * width;
    const hi = lo + width;
    const binCount = data.filter((v) => v >= lo && (i === count - 1 ? v <= hi : v < hi)).length;
    return {
      bin: `${lo.toFixed(0)}`,
      count: binCount,
    };
  });
}

export function HistogramWidget() {
  const [binCount, setBinCount] = useState(8);
  const [showRCode, setShowRCode] = useState(false);

  const bins = useMemo(() => createBins(EXAM_DATA, binCount), [binCount]);

  const rCode = `scores <- c(${EXAM_DATA.join(", ")})
hist(scores,
     breaks = ${binCount},
     main   = "Exam Score Distribution (${binCount} bins)",
     xlab   = "Score",
     ylab   = "Frequency",
     col    = "lightblue")`;

  return (
    <div className="widget">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bins} barCategoryGap="0%" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="bin"
            style={{ fontSize: "0.7rem" }}
            interval={Math.floor(binCount / 6)}
          />
          <YAxis width={30} style={{ fontSize: "0.75rem" }} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [v, "Students"]}
            labelFormatter={(l) => `Score ≥ ${l}`}
          />
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
            Number of bins: <strong>{binCount}</strong>
          </span>
          <input
            type="range"
            min={3}
            max={15}
            step={1}
            value={binCount}
            onChange={(e) => setBinCount(Number(e.target.value))}
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
