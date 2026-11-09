/** The kopi cup seen from above, as a React component. Same markup and classes as CupMark.astro. */
export function Cup({ level = 0, size = 48, className = '' }: { level?: 0 | 0.5 | 1; size?: number; className?: string }) {
  return (
    <svg className={`cup ${className}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false" data-level={level}>
      <circle className="cup__saucer" cx="23" cy="24" r="21" />
      <rect className="cup__handle" x="33" y="20" width="13" height="8" rx="4" />
      <circle className="cup__body" cx="23" cy="24" r="13.5" />
      <circle className="cup__kopi cup__kopi--half" cx="23" cy="24" r="6" />
      <circle className="cup__kopi cup__kopi--full" cx="23" cy="24" r="10.25" />
      <path className="cup__glint" d="M16.5 21.5a7.5 7.5 0 0 1 6-4.4" />
    </svg>
  );
}
