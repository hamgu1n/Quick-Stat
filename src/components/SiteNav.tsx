import { Link, NavLink, useLocation } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, Menu } from "lucide-react";
import { QuickStatLogo } from "@/components/QuickStatLogo";
import { SettingsMenu } from "@/components/SettingsMenu";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/textbook", label: "Textbook", end: false },
  { to: "/applets", label: "Applets", end: false },
  { to: "/analyzer", label: "Analyzer", end: false },
  { to: "/about", label: "About", end: false },
];

export function SiteNav() {
  const { pathname } = useLocation();
  // The page the reader is on, shown on the phone menu button.
  const current =
    [...LINKS].reverse().find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to))) ?? LINKS[0];

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <NavLink to="/" className="site-nav-brand">
          <QuickStatLogo size={18} />
          Quick Stat
        </NavLink>
        {/* Wide screens: every page in a row. */}
        <nav className="site-nav-links" aria-label="Main">
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

        {/* Phones: one button that opens a dropdown of the pages. Radix
            DropdownMenu handles opening, closing, and keyboard support. */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="site-nav-menu-trigger" aria-label="Open the site menu">
              <Menu size={16} aria-hidden="true" />
              {current.label}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="site-nav-menu" align="start" sideOffset={6}>
              {LINKS.map((link) => (
                // A plain string className here: Radix merges its own props
                // into the link, which doesn't work with NavLink's
                // function-style className.
                <DropdownMenu.Item key={link.to} asChild>
                  <Link
                    to={link.to}
                    className={`site-nav-menu-item${link === current ? " site-nav-menu-item--active" : ""}`}
                    aria-current={link === current ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="site-nav-spacer" />
        <SettingsMenu />
      </div>
    </header>
  );
}
