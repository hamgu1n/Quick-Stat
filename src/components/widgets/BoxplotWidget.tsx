import { useState } from "react";

const BASE_DATA = [28, 35, 42, 55, 60, 65, 70, 78, 85, 92];
const OUTLIER = 180;

function fiveNum(data: number[]) {
  const s = [...data].sort((a, b) => a - b);
  const n = s.length;

  const med = (arr: number[]) => {
    const m = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
  };

  const q2 = med(s);
  const lower = s.slice(0, Math.floor(n / 2));
  const upper = s.slice(n % 2 === 0 ? n / 2 : n / 2 + 1);
  const q1 = med(lower);
  const q3 = med(upper);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const nonOutliers = s.filter((v) => v >= lowerFence && v <= upperFence);
  const outliers = s.filter((v) => v < lowerFence || v > upperFence);

  return {
    min: nonOutliers[0],
    q1,
    q2,
    q3,
    max: nonOutliers[nonOutliers.length - 1],
    iqr,
    lowerFence,
    upperFence,
    outliers,
  };
}

const SCALE_MIN = 0;
const SCALE_MAX = 200;
const SVG_LEFT = 60;
const SVG_RIGHT = 520;
const SVG_WIDTH = SVG_RIGHT - SVG_LEFT;
const BOX_Y = 50;
const BOX_H = 36;

function toX(v: number) {
  return SVG_LEFT + ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * SVG_WIDTH;
}

export function BoxplotWidget() {
  const [showOutlier, setShowOutlier] = useState(false);
  const [showRCode, setShowRCode] = useState(false);

  const data = showOutlier ? [...BASE_DATA, OUTLIER] : BASE_DATA;
  const { min, q1, q2, q3, max, iqr, upperFence, outliers } = fiveNum(data);

  const rCode = `prices <- c(${BASE_DATA.join(", ")}${showOutlier ? `, ${OUTLIER}` : ""})

# Five-number summary
summary(prices)
# Q1=${q1}, Median=${q2}, Q3=${q3}, IQR=${iqr}
# Upper fence = ${q3} + 1.5 × ${iqr} = ${upperFence}

boxplot(prices,
        horizontal = TRUE,
        main = "Textbook Prices ($)",
        xlab = "Price ($)")`;

  const tickValues = [0, 50, 100, 150, 200];

  return (
    <div className="widget">
      <svg
        viewBox={`0 0 580 ${BOX_Y * 2 + BOX_H + 40}`}
        style={{ width: "100%", overflow: "visible", fontFamily: "inherit" }}
      >
        {/* Axis line */}
        <line x1={SVG_LEFT} y1={BOX_Y + BOX_H + 14} x2={SVG_RIGHT} y2={BOX_Y + BOX_H + 14} stroke="var(--border)" strokeWidth={1} />

        {/* Tick marks and labels */}
        {tickValues.map((v) => (
          <g key={v}>
            <line x1={toX(v)} y1={BOX_Y + BOX_H + 10} x2={toX(v)} y2={BOX_Y + BOX_H + 18} stroke="var(--muted-foreground)" strokeWidth={1} />
            <text x={toX(v)} y={BOX_Y + BOX_H + 30} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">${v}</text>
          </g>
        ))}

        {/* Left whisker */}
        <line x1={toX(min)} y1={BOX_Y + BOX_H / 2} x2={toX(q1)} y2={BOX_Y + BOX_H / 2} stroke="var(--maroon)" strokeWidth={2} />
        <line x1={toX(min)} y1={BOX_Y + 8} x2={toX(min)} y2={BOX_Y + BOX_H - 8} stroke="var(--maroon)" strokeWidth={2} />

        {/* Right whisker */}
        <line x1={toX(q3)} y1={BOX_Y + BOX_H / 2} x2={toX(max)} y2={BOX_Y + BOX_H / 2} stroke="var(--maroon)" strokeWidth={2} />
        <line x1={toX(max)} y1={BOX_Y + 8} x2={toX(max)} y2={BOX_Y + BOX_H - 8} stroke="var(--maroon)" strokeWidth={2} />

        {/* Box */}
        <rect x={toX(q1)} y={BOX_Y} width={toX(q3) - toX(q1)} height={BOX_H} fill="var(--maroon-light)" stroke="var(--maroon)" strokeWidth={2} />

        {/* Median line */}
        <line x1={toX(q2)} y1={BOX_Y} x2={toX(q2)} y2={BOX_Y + BOX_H} stroke="var(--maroon)" strokeWidth={3} />

        {/* Outlier points */}
        {outliers.map((v, i) => (
          <circle key={i} cx={toX(v)} cy={BOX_Y + BOX_H / 2} r={5} fill="none" stroke="var(--maroon)" strokeWidth={2} />
        ))}

        {/* Labels */}
        <text x={toX(min)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">Min={min}</text>
        <text x={toX(q1)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--foreground)">Q₁={q1}</text>
        <text x={toX(q2)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--maroon)" fontWeight={600}>Median={q2}</text>
        <text x={toX(q3)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--foreground)">Q₃={q3}</text>
        <text x={toX(max)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">Max={max}</text>
        {outliers.map((v, i) => (
          <text key={i} x={toX(v)} y={BOX_Y - 6} textAnchor="middle" fontSize={10} fill="var(--maroon)">⚠ {v}</text>
        ))}
      </svg>

      <div className="widget-controls" style={{ marginTop: "0.5rem" }}>
        <button
          className={`widget-toggle-btn${showOutlier ? " active" : ""}`}
          onClick={() => setShowOutlier(!showOutlier)}
        >
          {showOutlier ? "Remove Outlier ($180)" : "Add Outlier ($180)"}
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
