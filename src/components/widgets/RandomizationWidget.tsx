import { useState, useMemo } from "react";
import { makeLCG } from "@/lib/stats";

// 20 participants: indices 0-7 are "older" (large dot), 8-19 are "younger" (small dot).
// Convenient assignment: first 10 (0-9) get treatment → 8 older in treatment, only 2 older in control.
// Random assignment: balanced.
const N = 20;
const IS_OLDER = Array.from({ length: N }, (_, i) => i < 8);

function getGroups(type: "random" | "convenient", seed: number): boolean[] {
  if (type === "convenient") {
    return Array.from({ length: N }, (_, i) => i < 10);
  }
  const rand = makeLCG(seed);
  const pool = Array.from({ length: N }, (_, i) => i);
  const treatment = new Set<number>();
  while (treatment.size < 10) {
    const idx = Math.floor(rand() * pool.length);
    treatment.add(pool.splice(idx, 1)[0]);
  }
  return Array.from({ length: N }, (_, i) => treatment.has(i));
}

export function RandomizationWidget() {
  const [type, setType] = useState<"random" | "convenient">("convenient");
  const [seed, setSeed] = useState(1);
  const [showRCode, setShowRCode] = useState(false);

  const isTreatment = useMemo(() => getGroups(type, seed), [type, seed]);

  const treatOlder = isTreatment.filter((t, i) => t && IS_OLDER[i]).length;
  const ctrlOlder = isTreatment.filter((t, i) => !t && IS_OLDER[i]).length;

  const rCode = type === "random"
    ? `participants <- 1:20
set.seed(42)
treatment <- sample(participants, size = 10)
control   <- setdiff(participants, treatment)`
    : `# Convenient: first 10 into treatment
treatment <- 1:10
control   <- 11:20`;

  const COLS = 5;
  return (
    <div className="widget">
      <div className="widget-controls" style={{ flexDirection: "row", gap: "0.5rem" }}>
        <button
          className={`widget-toggle-btn${type === "convenient" ? " active" : ""}`}
          onClick={() => setType("convenient")}
        >
          Convenient Assignment
        </button>
        <button
          className={`widget-toggle-btn${type === "random" ? " active" : ""}`}
          onClick={() => setType("random")}
        >
          Random Assignment
        </button>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: "0.75rem 0 0.5rem" }}>
        {type === "convenient"
          ? "First 10 participants go to treatment — but most \"older\" participants happen to be first."
          : "Participants randomly assigned — age distributes evenly between groups."}
      </p>

      <svg viewBox={`0 0 ${COLS * 48} 100`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }}>
        {Array.from({ length: N }, (_, i) => {
          const row = Math.floor(i / COLS), col = i % COLS;
          const older = IS_OLDER[i];
          const treated = isTreatment[i];
          return (
            <circle
              key={i}
              cx={col * 48 + 24}
              cy={row * 48 + 24}
              r={older ? 16 : 10}
              fill={treated ? "var(--maroon)" : "#3b5b8a"}
              opacity={0.85}
            />
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", fontSize: "0.825rem", margin: "0.5rem 0", flexWrap: "wrap" }}>
        <span><span style={{ color: "var(--maroon)", fontWeight: 700 }}>■</span> Treatment (n=10)</span>
        <span><span style={{ color: "#3b5b8a", fontWeight: 700 }}>■</span> Control (n=10)</span>
        <span>Large = Older, Small = Younger</span>
      </div>

      <div style={{ display: "flex", gap: "2rem", justifyContent: "center", fontSize: "0.875rem", marginTop: "0.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, color: "var(--maroon)" }}>Treatment</div>
          <div>{treatOlder} older, {10 - treatOlder} younger</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, color: "#3b5b8a" }}>Control</div>
          <div>{ctrlOlder} older, {10 - ctrlOlder} younger</div>
        </div>
      </div>

      {type === "random" && (
        <div className="widget-controls" style={{ marginTop: "0.75rem" }}>
          <button className="widget-toggle-btn" onClick={() => setSeed(s => s + 1)}>
            Re-randomize
          </button>
        </div>
      )}

      <button className="widget-rcode-toggle" onClick={() => setShowRCode(!showRCode)}>
        {showRCode ? "Hide R Code" : "Show R Code"}
      </button>
      {showRCode && <pre className="widget-rcode"><code>{rCode}</code></pre>}
    </div>
  );
}
