import { useEffect, useState } from "react";

type Tip = { text: string; hint: string; x: number; y: number };

const ACTIVE_CLASS = "math-say-active";
// Each formula with labeled symbols becomes one keyboard stop.
const FORMULA_ATTR = "data-say-formula";

/**
 * One tooltip for the whole site. Math symbols carry a `data-say` attribute
 * (added by annotateTex in src/lib/mathSpeech.ts) saying how to read them
 * aloud, and this shows that text just above the symbol.
 *
 * - Mouse or touch: hover over (or tap) a symbol.
 * - Keyboard: Tab to a formula, then use the arrow keys to move between its
 *   symbols. Escape hides the tooltip. Making every symbol its own tab stop
 *   would mean dozens of extra Tab presses per page, so each formula is one
 *   stop instead.
 *
 * It's a single fixed-position box rather than a CSS tooltip on each symbol,
 * because display equations scroll sideways and would clip a CSS tooltip.
 */
export function MathTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let active: HTMLElement | null = null;

    function show(el: HTMLElement | null, hint = "") {
      active?.classList.remove(ACTIVE_CLASS);
      active = el;
      if (!el) {
        setTip(null);
        return;
      }
      el.classList.add(ACTIVE_CLASS);
      const r = el.getBoundingClientRect();
      // Keep the tooltip on screen near the left and right edges.
      const x = Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90);
      setTip({ text: el.dataset.say ?? "", hint, x, y: r.top });
    }

    // --- Make each labeled formula focusable (including ones that appear
    //     later, e.g. after navigating to another lesson).
    function tagFormulas(root: ParentNode) {
      root.querySelectorAll<HTMLElement>(".katex").forEach((formula) => {
        if (formula.hasAttribute(FORMULA_ATTR) || !formula.querySelector("[data-say]")) return;
        formula.setAttribute(FORMULA_ATTR, "");
        formula.tabIndex = 0;
        formula.setAttribute("aria-description", "Use the arrow keys to hear how each symbol is said");
      });
    }
    tagFormulas(document);
    const observer = new MutationObserver(() => tagFormulas(document));
    observer.observe(document.body, { childList: true, subtree: true });

    const symbolsIn = (formula: Element) =>
      [...formula.querySelectorAll<HTMLElement>(".katex-html [data-say]")];

    function showSymbol(formula: HTMLElement, index: number) {
      const symbols = symbolsIn(formula);
      if (symbols.length === 0) return;
      const i = (index + symbols.length) % symbols.length;
      formula.dataset.sayIndex = String(i);
      show(symbols[i], symbols.length > 1 ? `${i + 1} of ${symbols.length} · ← → for more` : "");
    }

    // --- Mouse and touch.
    // closest() finds the innermost labeled symbol under the pointer, so
    // hovering p-hat inside a square root shows "p-hat", not "square root of".
    const onOver = (e: Event) => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest<HTMLElement>("[data-say]") ?? null;
      if (el !== active) show(el);
    };

    // --- Keyboard.
    const onFocusIn = (e: FocusEvent) => {
      const formula = e.target instanceof HTMLElement && e.target.hasAttribute(FORMULA_ATTR) ? e.target : null;
      if (formula) showSymbol(formula, 0);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target.hasAttribute(FORMULA_ATTR)) show(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const formula = document.activeElement;
      if (!(formula instanceof HTMLElement) || !formula.hasAttribute(FORMULA_ATTR)) return;
      const current = Number(formula.dataset.sayIndex ?? 0);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        showSymbol(formula, current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        showSymbol(formula, current - 1);
      } else if (e.key === "Escape") {
        show(null);
      }
    };

    const hide = () => {
      // Keep a keyboard tooltip while its formula is focused; just re-place it.
      const formula = document.activeElement;
      if (formula instanceof HTMLElement && formula.hasAttribute(FORMULA_ATTR) && active) {
        showSymbol(formula, Number(formula.dataset.sayIndex ?? 0));
      } else {
        show(null);
      }
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("touchstart", onOver, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      observer.disconnect();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("touchstart", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      active?.classList.remove(ACTIVE_CLASS);
    };
  }, []);

  if (!tip) return null;
  return (
    <div className="math-tooltip" role="tooltip" aria-live="polite" style={{ left: tip.x, top: tip.y }}>
      {tip.text}
      {tip.hint && <span className="math-tooltip__hint">{tip.hint}</span>}
    </div>
  );
}
