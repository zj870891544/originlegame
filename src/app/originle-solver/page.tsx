import type { Metadata } from "next";
import { CountrySolver } from "@/components/puzzle/CountrySolver";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { COUNTRY_COUNT } from "@/lib/countries";
import { webToolJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

const description = "Narrow down Originle country guesses using the distances from your wrong guesses and an optional continent clue. An independent map-based helper with adjustable distance tolerance.";
export const metadata: Metadata = pageMetadata({
  title: "Originle Solver: Country & Distance Helper",
  description,
  path: "/originle-solver",
});

const FAQ = [
  {
    question: "How do I narrow down countries from an Originle distance?",
    answer: "Enter a country you guessed incorrectly and the distance shown by Originle. This helper compares independent map distances to every possible candidate. Add another wrong guess to keep only countries that fit both distances, and select a continent only if a clue supports it.",
  },
  {
    question: "Does this solver reveal today's Originle answer?",
    answer: "It does not read the daily answer or the guest's clues. It filters countries from the feedback you enter, so it works for current and past puzzles. Candidate names may still make an answer easier to guess; use the folded hints page if you want gentler help.",
  },
  {
    question: "Why does the helper's distance differ from the game?",
    answer: "The helper uses an independent, simplified country-boundary map. Islands, overseas areas and boundary definitions can cause large differences from the game's distance table. The tolerance allows each estimate to differ from your entered distance by the number of kilometres you choose. Even a wider tolerance cannot guarantee that the correct country appears.",
  },
  {
    question: "Does 0 km mean my guess was correct?",
    answer: "No. Only the exact country is correct. A wrong guess can be recorded at 0 km in the game's distance table. Enter 0 if that is what the game shows; the helper excludes the country you already guessed and looks for other candidates.",
  },
  {
    question: "Why are there no matching countries?",
    answer: "Check that each number is the distance in kilometres, rather than your score. Try a wider tolerance or remove a continent you are unsure about. Independent map estimates can exclude the real answer, and conflicting inputs can leave no matches.",
  },
];

export default function SolverPage() {
  return (
    <PageShell path="/originle-solver" crumbName="Country solver" title="Originle country & distance solver" lead="Already made a wrong guess? Use its distance to find countries worth considering, then combine another guess or a continent clue to narrow the list.">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          <CountrySolver />
          <section aria-labelledby="how-this-helps" className="prose-block">
            <h2 id="how-this-helps" className="heading">Use the feedback you already have</h2>
            <ol>
              <li>Choose a country you guessed incorrectly and enter the kilometres shown beside it.</li>
              <li>Leave the continent open unless the guest&apos;s clues give you a reason to narrow it.</li>
              <li>Find candidates. Another wrong guess adds another distance constraint; each candidate must fit all of them.</li>
              <li>Compare the list with the guest&apos;s language, culture and landscape clues before spending your next guess.</li>
            </ol>
            <p>Two guesses do not always identify one country. Many places can fit a single distance, and approximate maps can miss a small island or include an extra neighbour.</p>
          </section>
          <section aria-labelledby="map-source" className="prose-block">
            <h2 id="map-source" className="heading">Where the estimates come from</h2>
            <p>
              The helper covers the {COUNTRY_COUNT} countries in Originle&apos;s guess list. Distances are estimated between country boundaries using{" "}
              <a href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/" className="inline-link">Natural Earth&apos;s 1:10m country map</a>,
              rather than between capitals. Natural Earth provides its map data in the{" "}
              <a href="https://www.naturalearthdata.com/about/terms-of-use/" className="inline-link">public domain</a>.
            </p>
            <p>This is an independent map model, separate from Originle&apos;s published distances. Use the game&apos;s displayed distance for scoring; the map estimates here help you compare candidates.</p>
          </section>
          <section aria-labelledby="solver-questions">
            <h2 id="solver-questions" className="heading">Country solver questions</h2>
            <div className="mt-5"><Faq items={FAQ} /></div>
          </section>
        </div>
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="sheet p-5" aria-labelledby="next-step">
            <h2 id="next-step" className="subheading">Choose how much help you want</h2>
            <ul className="mt-4 space-y-4">
              <li><Link href="/hints" className="inline-link">Gentle hints for today&apos;s guest</Link><p className="mt-1 text-sm muted">Open one hint at a time.</p></li>
              <li><Link href="/today" className="inline-link">Today&apos;s verified answer</Link><p className="mt-1 text-sm muted">The answer stays folded until you reveal it.</p></li>
              <li><Link href="/originle-score-calculator" className="inline-link">Calculate your Originle score</Link><p className="mt-1 text-sm muted">Use clue costs, wrong guesses or a shared result.</p></li>
              <li><Link href="/archive" className="inline-link">Past puzzles and explanations</Link><p className="mt-1 text-sm muted">Find one guest by number or New York date.</p></li>
            </ul>
          </section>
        </aside>
      </div>
      <JsonLd data={webToolJsonLd({ name: "Originle Country & Distance Solver", path: "/originle-solver", description })} />
    </PageShell>
  );
}
