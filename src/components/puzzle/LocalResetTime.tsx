"use client";

import { useSyncExternalStore } from "react";
import { nextResetAt } from "@/lib/time/game-day";

const subscribe = () => () => {};
const localTime = () => nextResetAt(new Date()).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
const unknown = () => null;

/** The next midnight in New York in the reader's own clock, e.g. "12:00 PM GMT+8". Nothing on the server, which can't know it. */
export function LocalResetTime() {
  const local = useSyncExternalStore(subscribe, localTime, unknown);
  return local ? <> In your time zone, the next one arrives at {local}.</> : null;
}
