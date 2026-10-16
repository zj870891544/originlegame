"use client";

import { useId, useState } from "react";
import { Segments } from "@/components/shared/Segments";
import {
  inputFromShare,
  parseShareText,
  scoreGame,
  solvedUnder,
  type GameInput,
  type Outcome,
  type Rules,
} from "@/lib/official/calculator";
import { CLOSE_MISS_MAX, CLUES } from "@/lib/official/scoring";

const fmt = (n: number) => n.toLocaleString("en-US");
const clueOptions = Array.from({ length: CLUES }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const missOptions = [0, 1, 2].map((n) => ({ value: n, label: String(n) }));

const START: GameInput = { rules: "current", outcome: "solved", clue: 3, misses: 0, km: null };

/** Works out an Originle score from how a round went, or from the game's share text. */
export function ScoreCalculator() {
  const [input, setInput] = useState<GameInput>(START);
  const [share, setShare] = useState("");
  const [shareNote, setShareNote] = useState<string | null>(null);
  const kmId = useId();
  const shareId = useId();
  const set = (patch: Partial<GameInput>) => {
    setInput((current) => ({ ...current, ...patch }));
    setShareNote(null);
  };

  const result = scoreGame(input);
  const needsKm = input.outcome === "missed" || (input.outcome === "gave-up" && input.misses > 0);
  const scoreKnown = !needsKm || input.km !== null;

  const readShare = () => {
    const parsed = parseShareText(share);
    if (!parsed) {
      setShareNote("That doesn't look like a finished Originle result. Copy it with the Share button at the end of a round.");
      return;
    }
    const next = inputFromShare(parsed);
    setInput(next);
    const computed = scoreGame(next).score;
    setShareNote(
      parsed.solved
        ? parsed.score === null || parsed.score === computed
          ? `Originle #${parsed.number}: solved on clue ${parsed.clues} after ${parsed.misses} ${parsed.misses === 1 ? "miss" : "misses"}.`
          : `Originle #${parsed.number}: your text says ${fmt(parsed.score)}, but those clues and misses score ${fmt(computed)}. Check the result was copied whole.`
        : `Originle #${parsed.number}: ${parsed.gaveUp ? "given up" : "all three guesses missed"}. The text doesn't say how close the nearest guess was; add its distance below.`,
    );
  };

  return (
    <div className="sheet p-5 sm:p-7">
      <div className="grid gap-6">
        <Segments<Rules>
          label="Which puzzle?"
          value={input.rules}
          onChange={(rules) => set({ rules })}
          options={[
            { value: "current", label: "#3 onward" },
            { value: "original", label: "#1 or #2", ariaLabel: "Puzzle #1 or #2 (original rules)" },
          ]}
        />
        <Segments<Outcome>
          label="How did the round end?"
          value={input.outcome}
          onChange={(outcome) => set({ outcome, misses: outcome === "missed" ? 3 : 0 })}
          event="score_calculate"
          options={[
            { value: "solved", label: "Got it right" },
            { value: "missed", label: "Missed all three" },
            { value: "gave-up", label: "Gave up" },
          ]}
        />
        {input.outcome === "solved" ? (
          <>
            <Segments label="Clues open when you got it" value={input.clue} onChange={(clue) => set({ clue })} options={clueOptions} />
            <Segments label="Wrong guesses before the right one" value={Math.min(input.misses, 2)} onChange={(misses) => set({ misses })} options={missOptions} />
          </>
        ) : null}
        {input.outcome === "gave-up" ? (
          <Segments label="Wrong guesses before giving up" value={Math.min(input.misses, 2)} onChange={(misses) => set({ misses })} options={missOptions} />
        ) : null}
        {needsKm ? (
          <div>
            <label htmlFor={kmId} className="mb-2 block text-sm font-semibold">
              Distance of your closest guess (km)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id={kmId}
                type="number"
                inputMode="numeric"
                min={0}
                max={20000}
                step={1}
                placeholder="e.g. 640"
                value={input.km ?? ""}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  set({ km: value === "" ? null : Math.max(0, Number(value)) });
                }}
                className="min-h-11 w-36 rounded border-[1.5px] border-rule bg-card px-3 text-lg tabular-nums"
              />
              <button type="button" className="segment" aria-pressed={input.km === 0} onClick={() => set({ km: 0 })}>
                0 km, a neighbour
              </button>
            </div>
            <p className="mt-2 text-sm muted">The game shows each wrong guess&apos;s distance from the answer, border to border.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-7 rounded-md bg-ink p-5 text-card" aria-live="polite">
        <p className="text-sm text-card/75">{input.outcome === "solved" ? "Your score" : "Your score, from the closest guess"}</p>
        <p className="font-display text-[clamp(2.4rem,2rem+2vw,3.4rem)] font-bold leading-tight tabular-nums">
          {scoreKnown ? fmt(result.score) : `0–${fmt(CLOSE_MISS_MAX)}`}
          <span className="text-[0.5em] font-semibold"> / 10,000</span>
        </p>
        {result.correct && result.clueValue !== null ? (
          <ul className="mt-3 space-y-1 text-[0.97rem] text-card/85">
            <li>
              Clue {input.clue} open: worth {fmt(result.clueValue)}
              {result.clueCost ? ` (the clues cost ${fmt(result.clueCost)})` : " (no clues bought)"}
            </li>
            <li>
              {input.misses === 0
                ? "No wrong guesses: nothing more lost."
                : `${input.misses} wrong ${input.misses === 1 ? "guess" : "guesses"}: −${fmt(result.missCost ?? 0)}`}
            </li>
            {input.clue > 1 ? <li>One clue earlier, the same round scores {fmt(solvedUnder(input.rules, input.clue - 1, input.misses))}.</li> : null}
            {input.misses > 0 ? <li>With one miss fewer, it scores {fmt(solvedUnder(input.rules, input.clue, input.misses - 1))}.</li> : null}
          </ul>
        ) : (
          <p className="mt-3 text-[0.97rem] text-card/85">
            {input.outcome === "gave-up" && input.misses === 0
              ? "Giving up before any guess scores 0. One guess, even a wild one, would have scored something."
              : `Without a correct guess, the closest one scores up to ${fmt(CLOSE_MISS_MAX)}: 1,000 × e^(−km / 1,500), rounded to tens. Any correct answer scores at least 1,470.`}
          </p>
        )}
      </div>

      <div className="mt-7 border-t border-dashed border-rule pt-6">
        <label htmlFor={shareId} className="block text-sm font-semibold">
          Or paste the result the game&apos;s Share button copied
        </label>
        <textarea
          id={shareId}
          rows={3}
          value={share}
          onChange={(event) => setShare(event.currentTarget.value)}
          placeholder={"Originle #11 · 6,480\n🟥🟩 · 3/8 clues"}
          className="mt-2 w-full rounded border-[1.5px] border-rule bg-card px-3 py-2"
        />
        <button type="button" className="btn btn-ghost mt-3 min-h-10 px-4 py-1.5 text-sm" onClick={readShare} data-ga-event="score_calculate">
          Read my result
        </button>
        {shareNote ? (
          <p className="mt-3 text-[0.97rem]" role="status">
            {shareNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
