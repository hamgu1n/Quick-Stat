import { NavLink } from "react-router-dom";
import { QuickStatLogo } from "@/components/QuickStatLogo";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/textbook", label: "Textbook", end: false },
  { to: "/applets", label: "Applets", end: false },
  { to: "/analyzer", label: "Analyzer", end: false },
];

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <NavLink to="/" className="site-nav-brand">
          <QuickStatLogo size={18} />
          Quick Stat
        </NavLink>
        <nav className="site-nav-links">
          {LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `site-nav-link${isActive ? " site-nav-link--active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
