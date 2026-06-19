import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1.5rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Quick Stat</h1>
      <p style={{ color: "#666", fontSize: "1.1rem" }}>An interactive intro statistics textbook</p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link to="/textbook" style={{ padding: "0.75rem 1.5rem", background: "#2563eb", color: "white", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>
          Open Textbook
        </Link>
        <Link to="/analyzer" style={{ padding: "0.75rem 1.5rem", background: "#f3f4f6", color: "#111", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "500" }}>
          Stats Analyzer
        </Link>
      </div>
    </div>
  );
}
