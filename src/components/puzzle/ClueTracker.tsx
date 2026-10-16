"use client";

import { useState } from "react";
import { Segments } from "@/components/shared/Segments";
import { stakesAt, type Rules } from "@/lib/official/calculator";
import { GUESSES } from "@/lib/official/scoring";

const fmt = (n: number) => n.toLocaleString("en-US");

/** The hint to reach for at each stage: the gentle one early, the strong one once the cheap clues are spent. */
function suggestedHint(clue: number, total: number): number {
  const share = clue / total;
  return share <= 0.25 ? 1 : share <= 0.625 ? 2 : 3;
}

/**
 * "Which clue are you on?": the titles of the clues the player has already
 * watched (never the later ones, which give a lot away), what a right guess is
 * worth now, and what one more clue or a miss would cost.
 */
export function ClueTracker({ clues, rules }: { clues: { position: number; title: string; outline: boolean }[]; rules: Rules }) {
  const [clue, setClue] = useState(1);
  const [misses, setMisses] = useState(0);
  const stakes = stakesAt(rules, clue, misses, clues.length);
  const seen = clues.filter((entry) => entry.position <= clue);
  return (
    <div className="sheet p-5 sm:p-6">
      <h3 className="subheading">Which clue are you on?</h3>
      <p className="mt-1 text-[0.97rem] muted">Pick the clue you&apos;ve just watched. Only the titles you&apos;ve already seen are shown.</p>
      <div className="mt-4 grid gap-4">
        <Segments
          label="Clues watched"
          value={clue}
          onChange={setClue}
          event="clue_progress"
          options={clues.map((entry) => ({ value: entry.position, label: String(entry.position), ariaLabel: `Clue ${entry.position}` }))}
        />
        <Segments
          label="Wrong guesses so far"
          value={misses}
          onChange={setMisses}
          options={Array.from({ length: GUESSES }, (_, n) => ({ value: n, label: String(n) }))}
        />
      </div>
      <ol className="mt-5 grid gap-1.5 border-t border-dashed border-rule pt-4">
        {seen.map((entry) => (
          <li key={entry.position} className="flex gap-3">
            <span className="w-6 shrink-0 text-right font-display font-semibold text-teal">{entry.position}</span>
            <span>
              <span className="font-semibold">{entry.title}</span>
              {entry.outline ? <span className="muted"> (the country outline)</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <dl className="mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded bg-paper px-4 py-3 text-[0.98rem]" aria-live="polite">
        <dt>A right guess now</dt>
        <dd className="text-right font-semibold tabular-nums">{fmt(stakes.rightNow)}</dd>
        <dt>Right after one more clue</dt>
        <dd className="text-right font-semibold tabular-nums">{stakes.afterNextClue === null ? "last clue" : fmt(stakes.afterNextClue)}</dd>
        <dt>Right later, after a miss now</dt>
        <dd className="text-right font-semibold tabular-nums">{stakes.afterMiss === null ? "no guesses left" : fmt(stakes.afterMiss)}</dd>
      </dl>
      <p className="mt-4 text-[0.97rem]">
        Stuck on clue {clue}? Try <span className="font-semibold">hint {suggestedHint(clue, clues.length)}</span> above
        {stakes.afterNextClue !== null && stakes.afterMiss !== null && stakes.afterNextClue > stakes.afterMiss
          ? `: one more clue (${fmt(stakes.rightNow - stakes.afterNextClue)}) costs less than a wrong guess (${fmt(stakes.rightNow - stakes.afterMiss)}).`
          : "."}
      </p>
    </div>
  );
}
