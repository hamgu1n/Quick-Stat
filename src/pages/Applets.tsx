import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { APPLETS } from "@/lib/widgetRegistry";
import { AppletModal } from "@/components/AppletModal";

export default function Applets() {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APPLETS;
    return APPLETS.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.lessonTitle.toLowerCase().includes(q) ||
      a.tags.some(tag => tag.includes(q)),
    );
  }, [query]);

  const expandedApplet = expandedId
    ? APPLETS.find(a => a.id === expandedId) ?? null
    : null;

  return (
    <div className="applets-page">
      <div className="applets-header">
        <h1>Applets</h1>
        <p>
          Every interactive widget from the textbook, in one scrollable gallery.
          Search by test name, concept, or chapter, then click a card to open
          and use it.
        </p>
        <label className="applets-search">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search applets (e.g. “t-test”, “chapter 8”, “correlation”)…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <p className="applets-count">
          {filtered.length} of {APPLETS.length} applets
        </p>
      </div>

      <div className="applets-grid">
        {filtered.map(applet => {
          const Widget = applet.component;
          return (
            // A <button> can't legally contain the nested lesson <a> below,
            // so this is a div acting as a button: click/Enter/Space open it.
            <div
              role="button"
              tabIndex={0}
              className="applet-card"
              key={applet.id}
              data-tags={applet.tags.join(" ")}
              onClick={() => setExpandedId(applet.id)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedId(applet.id);
                }
              }}
              aria-label={`Open ${applet.title} applet`}
            >
              <div className="applet-card-header">
                <span className="applet-card-unit">Unit {applet.unit} · Ch. {applet.chapter}</span>
                <h2 className="applet-card-title">{applet.title}</h2>
                <Link
                  to={`/textbook/${applet.lessonSlug}`}
                  className="applet-card-link"
                  onClick={e => e.stopPropagation()}
                >
                  {applet.lessonTitle} →
                </Link>
              </div>
              {/* Preview only: the real widget renders at its default state,
                  but this wrapper is not interactive — the overlay swallows
                  clicks/drags so sliders can't be dragged from the grid.
                  Clicking anywhere on the card (including the preview)
                  opens the real, interactive widget in AppletModal. */}
              <div className="applet-card-widget">
                <div className="applet-card-preview" aria-hidden="true">
                  <Widget />
                  <div className="applet-card-preview-overlay" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="applets-empty">No applets match “{query}”. Try a different search term.</p>
      )}

      {expandedApplet && (
        <AppletModal applet={expandedApplet} onClose={() => setExpandedId(null)} />
      )}
    </div>
  );
}
