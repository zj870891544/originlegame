"use client";

import { useState } from "react";

/** Opens (or closes) every hint and answer in the nearest [data-reveal-scope]. */
export function RevealAll({ label = "Reveal all hints and the answer" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost min-h-10 px-4 py-1.5 text-sm"
      aria-pressed={open}
      data-ga-event={open ? undefined : "reveal_all"}
      onClick={(event) => {
        const scope = event.currentTarget.closest("[data-reveal-scope]");
        const next = !open;
        scope?.querySelectorAll<HTMLDetailsElement>("details[data-spoiler]").forEach((details) => {
          details.open = next;
        });
        setOpen(next);
      }}
    >
      {open ? "Fold everything away" : label}
    </button>
  );
}
