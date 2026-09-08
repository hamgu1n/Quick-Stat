import { Table2, ListChecks, FlaskConical, BarChart3, LayoutDashboard, type LucideIcon } from "lucide-react";

export type StatsTab = "data" | "summary" | "tests" | "graphs" | "dashboard";

const TABS: { id: StatsTab; label: string; icon: LucideIcon }[] = [
  { id: "data", label: "Data", icon: Table2 },
  { id: "summary", label: "Summary", icon: ListChecks },
  { id: "tests", label: "Stat", icon: FlaskConical },
  { id: "graphs", label: "Graph", icon: BarChart3 },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function StatsToolbar({ active, onChange }: { active: StatsTab; onChange: (tab: StatsTab) => void }) {
  return (
    <div className="ribbon-group" role="tablist">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`ribbon-btn${active === tab.id ? " active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
