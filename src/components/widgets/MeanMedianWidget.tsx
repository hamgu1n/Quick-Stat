import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE_DATA = [73, 78, 81, 84, 86, 88, 90, 92, 94, 96, 97, 100, 102, 104, 107, 109, 112, 116, 119, 123, 127, 132, 137, 144, 156];
const OUTLIER = 1000;
const BIN_STARTS = Array.from({ length: 11 }, (_, i) => i * 100);

function mean(data: number[]) {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function median(data: number[]) {
  const s = [...data].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function toBins(data: number[]) {
  return BIN_STARTS.map((start) => ({
    bin: `$${start}k`,
    count: data.filter((v) => v >= start && v < start + 100).length,
  }));
}

export function MeanMedianWidget() {
  const [showOutlier, setShowOutlier] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(() => (showOutlier ? [...BASE_DATA, OUTLIER] : BASE_DATA), [showOutlier]);
  const avg = useMemo(() => mean(data), [data]);
  const med = useMemo(() => median(data), [data]);
  const bins = useMemo(() => toBins(data), [data]);

  const rCode = `data <- c(${BASE_DATA.join(", ")}${showOutlier ? `, ${OUTLIER}` : ""})
mean(data)   # ${avg.toFixed(1)}
median(data) # ${med.toFixed(1)}
hist(data, breaks = 11, main = "Employee Salaries ($k)",
     xlab = "Salary ($k)", col = "lightblue")
abline(v = mean(data),   col = "red",  lwd = 2)  # mean
abline(v = median(data), col = "blue", lwd = 2)  # median`;

  return (
    <div className="widget">
      <div className="widget-stats">
        <span>
          Mean: <strong style={{ color: "var(--maroon)" }}>${avg.toFixed(0)}k</strong>
        </span>
        <span>
          Median: <strong style={{ color: "#3b5b8a" }}>${med.toFixed(0)}k</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={bins} barCategoryGap="0%" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="bin" style={{ fontSize: "0.7rem" }} interval={1} />
          <YAxis width={30} style={{ fontSize: "0.75rem" }} allowDecimals={false} />
          <Tooltip formatter={(v) => [v, "Employees"]} />
          <Bar dataKey="count" fill="var(--maroon-light)" stroke="var(--maroon)" strokeWidth={1} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="widget-controls">
        <button
          className={`widget-toggle-btn${showOutlier ? " active" : ""}`}
          onClick={() => setShowOutlier(!showOutlier)}
        >
          {showOutlier ? "Remove CEO ($1,000k)" : "Add CEO ($1,000k)"}
        </button>
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
