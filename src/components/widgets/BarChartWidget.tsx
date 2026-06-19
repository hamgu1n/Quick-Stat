import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const FLAVOR_DATA = [
  { flavor: "Chocolate", count: 35 },
  { flavor: "Vanilla", count: 28 },
  { flavor: "Strawberry", count: 18 },
  { flavor: "Mint Chip", count: 12 },
  { flavor: "Cookie Dough", count: 7 },
];

export function BarChartWidget() {
  const [sorted, setSorted] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(
    () =>
      sorted
        ? [...FLAVOR_DATA].sort((a, b) => b.count - a.count)
        : FLAVOR_DATA,
    [sorted]
  );

  const rCode = `categories <- c("Chocolate", "Vanilla", "Strawberry", "Mint Chip", "Cookie Dough")
counts <- c(35, 28, 18, 12, 7)

${
  sorted
    ? `# Pareto chart — sorted by frequency
ord <- order(counts, decreasing = TRUE)
barplot(counts[ord], names.arg = categories[ord],
        main = "Favorite Ice Cream Flavors (Pareto)",
        xlab = "Flavor", ylab = "Count", col = "lightblue")`
    : `# Standard bar chart
barplot(counts, names.arg = categories,
        main = "Favorite Ice Cream Flavors",
        xlab = "Flavor", ylab = "Count", col = "lightblue")`
}`;

  return (
    <div className="widget">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 0 }}>
          <XAxis
            dataKey="flavor"
            style={{ fontSize: "0.75rem" }}
            interval={0}
            tick={{ dy: 8 }}
          />
          <YAxis width={35} style={{ fontSize: "0.75rem" }} />
          <Tooltip formatter={(v) => [v, "Students"]} />
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
        <button
          className={`widget-toggle-btn${sorted ? " active" : ""}`}
          onClick={() => setSorted(!sorted)}
        >
          {sorted ? "Unsort (Original Order)" : "Sort by Frequency (Pareto)"}
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
