/**
 * A hint or answer folded away until asked for. Built on <details>, so it
 * works without script and its contents are in the page as served.
 */
export function Envelope({
  label,
  note,
  action = "Open",
  event,
  level,
  open = false,
  children,
}: {
  label: React.ReactNode;
  note?: React.ReactNode;
  action?: string;
  event?: string;
  level?: number;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="envelope" data-spoiler open={open || undefined} data-ga-event={event} data-ga-level={level}>
      <summary>
        <span className="min-w-0">
          <span className="block font-display text-[1.12rem] font-semibold leading-tight">{label}</span>
          {note ? <span className="mt-0.5 block text-sm muted">{note}</span> : null}
        </span>
        <span className="envelope-action" aria-hidden="true">
          <span className="when-closed">{action}</span>
          <span className="when-open">Close</span>
        </span>
      </summary>
      <div className="envelope-body">{children}</div>
    </details>
  );
}
