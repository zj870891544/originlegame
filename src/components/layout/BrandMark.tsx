/** The site's mark: a perforated postage stamp with a map pin. */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="29" height="29" rx="3" fill="#1E5E5A" />
      <rect x="3.5" y="3.5" width="25" height="25" rx="1.5" fill="none" stroke="#FFFAF1" strokeWidth="1.2" strokeDasharray="1.6 1.9" />
      <path d="M16 7.5c-3.4 0-6.1 2.6-6.1 6 0 4.3 6.1 11 6.1 11s6.1-6.7 6.1-11c0-3.4-2.7-6-6.1-6Z" fill="#FFFAF1" />
      <circle cx="16" cy="13.5" r="2.3" fill="#C8413B" />
    </svg>
  );
}
