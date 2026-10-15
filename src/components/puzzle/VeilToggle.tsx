"use client";

import { useEffect, useState } from "react";

/**
 * Shows or blurs every answer in the surrounding .veil-scope. A single blurred
 * answer can also be tapped to show just that one.
 */
export function VeilToggle() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reveal = (event: MouseEvent) => {
      const cell = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-veil-cell]") : null;
      if (!cell) return;
      cell.classList.remove("veil");
      cell.removeAttribute("aria-label");
    };
    document.addEventListener("click", reveal);
    return () => document.removeEventListener("click", reveal);
  }, []);
  return (
    <button type="button" className="veil-toggle btn btn-ghost min-h-10 px-4 py-1.5 text-sm" aria-pressed={shown} onClick={() => setShown(!shown)}>
      {shown ? "Blur the answers" : "Show all answers"}
    </button>
  );
}
