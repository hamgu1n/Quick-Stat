import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { AppletEntry } from "@/lib/widgetRegistry";

type AppletModalProps = {
  applet: AppletEntry;
  onClose: () => void;
};

/**
 * Full-interactivity view of a single applet, rendered into `document.body`
 * via a portal so it can sit above `<SiteNav>` (which is `position: sticky`
 * inside the normal document flow) regardless of where its card lives in
 * the `/applets` grid.
 */
export function AppletModal({ applet, onClose }: AppletModalProps) {
  const Widget = applet.component;

  // Close on Escape, and lock page scroll while the modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="applet-modal-backdrop" onClick={onClose}>
      <div
        className="applet-modal"
        role="dialog"
        aria-modal="true"
        aria-label={applet.title}
        onClick={e => e.stopPropagation()}
      >
        <div className="applet-modal-header">
          <div>
            <span className="applet-card-unit">Unit {applet.unit} · Ch. {applet.chapter}</span>
            <h2 className="applet-card-title">{applet.title}</h2>
            <Link to={`/textbook/${applet.lessonSlug}`} className="applet-card-link">
              {applet.lessonTitle} →
            </Link>
          </div>
          <button
            type="button"
            className="applet-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="applet-modal-widget">
          <Widget />
        </div>
      </div>
    </div>,
    document.body,
  );
}
