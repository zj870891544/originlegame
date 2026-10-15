"use client";

import { useEffect, useState } from "react";
import { nextResetAt } from "@/lib/time/game-day";

function format(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Time left until midnight in New York, when Originle releases the next guest. */
export function Countdown() {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setLeft(format(nextResetAt(new Date()).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-semibold tabular-nums" aria-live="off">
      {left ?? "at midnight Eastern"}
    </span>
  );
}
