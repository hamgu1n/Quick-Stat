import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const FLAVOR_DATA = [
  { flavor: "Chocolate", count: 35 },
  { flavor: "Vanilla", count: 28 },
  { flavor: "Strawberry", count: 18 },
  { flavor: "Mint Chip", count: 12 },
  { flavor: "Cookie Dough", count: 7 },
];

const PIE_COLORS = ["var(--maroon)", "#3b5b8a", "#2a7a3a", "#c9973f", "var(--maroon-muted)"];

type ChartType = "bar" | "pie";

export function BarChartWidget() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [sorted, setSorted] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const data = useMemo(
    () =>
      sorted
        ? [...FLAVOR_DATA].sort((a, b) => b.count - a.count)
        : FLAVOR_DATA,
    [sorted]
  );

  const rCode = useMemo(() => {
    const header = `categories <- c("Chocolate", "Vanilla", "Strawberry", "Mint Chip", "Cookie Dough")
counts <- c(35, 28, 18, 12, 7)`;

    if (chartType === "pie") {
      return `${header}

pie(counts, labels = categories,
    main = "Favorite Ice Cream Flavors",
    col = rainbow(length(counts)))`;
    }

    if (sorted) {
      return `${header}

# Pareto chart - sorted by frequency
ord <- order(counts, decreasing = TRUE)
barplot(counts[ord], names.arg = categories[ord],
        main = "Favorite Ice Cream Flavors (Pareto)",
        xlab = "Flavor", ylab = "Count", col = "lightblue")`;
    }

    return `${header}

# Standard bar chart
barplot(counts, names.arg = categories,
        main = "Favorite Ice Cream Flavors",
        xlab = "Flavor", ylab = "Count", col = "lightblue")`;
  }, [chartType, sorted]);

  return (
    <div className="widget">
      {chartType === "bar" ? (
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
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={FLAVOR_DATA}
              dataKey="count"
              nameKey="flavor"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(props: { name?: string; percent?: number }) =>
                `${props.name} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
              }
              isAnimationActive={false}
            >
              {FLAVOR_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [v, "Students"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div className="widget-controls" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
        <button
          className={`widget-toggle-btn${chartType === "bar" ? " active" : ""}`}
          onClick={() => setChartType("bar")}
        >
          Bar Chart
        </button>
        <button
          className={`widget-toggle-btn${chartType === "pie" ? " active" : ""}`}
          onClick={() => setChartType("pie")}
        >
          Pie Chart
        </button>
        {chartType === "bar" && (
          <button
            className={`widget-toggle-btn${sorted ? " active" : ""}`}
            onClick={() => setSorted(!sorted)}
          >
            {sorted ? "Unsort (Original Order)" : "Sort by Frequency (Pareto)"}
          </button>
        )}
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
