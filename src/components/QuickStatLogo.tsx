/**
 * The app's mark: three ascending bars on a baseline -- a bar chart is the
 * most universally recognized "statistics" shorthand, more so than a bell
 * curve. Filled with `currentColor` so it matches the nav's text color in
 * both themes, same as the lucide icons used elsewhere in the app.
 */
export function QuickStatLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="13" width="4.5" height="8" rx="1" />
      <rect x="9.75" y="8" width="4.5" height="13" rx="1" />
      <rect x="16.5" y="3" width="4.5" height="18" rx="1" />
    </svg>
  );
}
