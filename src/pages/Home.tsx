import { Link } from "react-router-dom";
import { BookOpen, LayoutGrid, ChartColumn } from "lucide-react";
import { QuickStatLogo } from "@/components/QuickStatLogo";

export default function Home() {
  return (
    <div className="home-hero">
      <QuickStatLogo size={40} />
      <h1 className="home-title">Quick Stat</h1>
      <p className="home-subtitle">An interactive intro statistics textbook</p>
      <div className="home-links">
        <Link to="/textbook" className="home-link home-link--primary">
          <BookOpen size={18} strokeWidth={2} />
          Open Textbook
        </Link>
        <Link to="/applets" className="home-link">
          <LayoutGrid size={18} strokeWidth={2} />
          Browse Applets
        </Link>
        <Link to="/analyzer" className="home-link">
          <ChartColumn size={18} strokeWidth={2} />
          Stats Analyzer
        </Link>
      </div>
    </div>
  );
}
