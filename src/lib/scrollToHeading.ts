/**
 * Scrolls a lesson heading into view and briefly highlights it, so a student
 * sent back from the Section Review can see exactly where to start reading.
 *
 * On the normal lesson page it scrolls the window; the headings'
 * `scroll-margin-top` (in index.css) keeps them clear of the sticky nav.
 */
export function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  // A heading inside a hidden pane (e.g. the side-by-side lesson on a phone)
  // has no boxes on screen, so there's nothing to scroll to.
  if (!el || el.getClientRects().length === 0) return false;
  // Inside the side-by-side lesson pane, scroll just that pane, so the
  // quiz column and the page itself stay put.
  const pane = el.closest<HTMLElement>(".review-lesson-pane");
  if (pane) {
    const top = el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top: top - 16, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  el.classList.remove("heading-flash");
  // Reading offsetWidth forces the browser to notice the class was removed,
  // so the animation restarts if the same heading is targeted twice.
  void el.offsetWidth;
  el.classList.add("heading-flash");
  window.setTimeout(() => el.classList.remove("heading-flash"), 2200);
  return true;
}
