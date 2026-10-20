import type { Puzzle } from "@/lib/db/puzzles";
import { explanationFor } from "@/lib/puzzle/explanation";
import { Envelope } from "./Envelope";

/** Extra context belongs on the dated page and stays behind an explicit spoiler. */
export function PuzzleExplanation({ puzzle }: { puzzle: Puzzle }) {
  const paragraphs = explanationFor(puzzle);
  return (
    <section aria-labelledby={`explanation-${puzzle.number}`}>
      <h2 id={`explanation-${puzzle.number}`} className="heading">Understanding this answer</h2>
      <p className="mt-3 max-w-[66ch] muted">This section names the country and compares it with another guess. Open it after the hints.</p>
      <div className="mt-5">
        <Envelope
          label={`Originle #${puzzle.number}: answer context`}
          note="Contains the answer. Country facts and game data, without inventing a guest's video story."
          action="Read explanation"
        >
          <div className="prose-block space-y-6">
            {paragraphs.map((paragraph) => (
              <section key={paragraph.heading}>
                <h3 className="subheading">{paragraph.heading}</h3>
                <p>{paragraph.text}</p>
              </section>
            ))}
            <p className="text-sm muted">
              Answer and distances: <a href={`${puzzle.sourceUrl}day.js`} className="inline-link">the official data for this puzzle</a>.
              {" "}Country language and geography context comes from this guide&apos;s country dataset, using{" "}
              <a href="https://github.com/annexare/Countries" className="inline-link">countries-list</a> and{" "}
              <a href="https://unstats.un.org/unsd/methodology/m49/" className="inline-link">UN M49-based region groupings</a>.
              {" "}It is independent background, not evidence that the guest mentioned those facts.
            </p>
          </div>
        </Envelope>
      </div>
    </section>
  );
}
