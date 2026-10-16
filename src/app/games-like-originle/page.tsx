import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Games Like Originle: 10 Daily Geography Puzzles",
  description:
    "Finished today's Originle? Ten more free daily geography games, from Worldle and Globle to GeoGuessr, and how Originle compares with Worldle and GeoGuessr.",
  path: "/games-like-originle",
});

interface Game {
  name: string;
  url: string;
  guess: string;
  why: string;
  group: "country" | "map" | "more";
}

const GAMES: Game[] = [
  { name: "Worldle", url: "https://worldle.teuteuf.fr/", group: "country", guess: "A country from its silhouette, with distance and direction after each try.", why: "The closest cousin: the same distance feedback Originle gives after a miss." },
  { name: "Globle", url: "https://globle-game.com/", group: "country", guess: "A mystery country on a 3D globe; each guess is coloured by how close it is.", why: "Trains the instinct for which countries are neighbours, which pays off when an Originle miss says 0 km." },
  { name: "Countryle", url: "https://countryle.com/", group: "country", guess: "A country, with feedback on its continent, hemisphere, population and climate.", why: "Rewards the same habit as Originle's scale and weather clues: reasoning from facts about a place." },
  { name: "Tradle", url: "https://games.oec.world/en/tradle/", group: "country", guess: "A country from a chart of what it exports.", why: "Like Originle's 'something from home' clue: an economy in place of a dish." },
  { name: "Flagle", url: "https://www.flagle.io/", group: "country", guess: "A flag, revealed tile by tile as you guess.", why: "A quick follow-up, and the flag is often the first thing you check after an Originle reveal." },
  { name: "Travle", url: "https://travle.earth/", group: "map", guess: "The shortest route between two countries, one neighbour at a time.", why: "Borders are the whole game here, and they're exactly what Originle's distance clue measures." },
  { name: "Capitalle", url: "https://capitalle.app/", group: "map", guess: "A world capital, with distance and direction feedback.", why: "Same reasoning as an Originle miss, one level down from countries to cities." },
  { name: "Satle", url: "https://satle.ca/", group: "map", guess: "A city from satellite images that zoom out with each wrong answer.", why: "Landscape reading, like Originle's land and weather clues, from above." },
  { name: "GeoGuessr", url: "https://www.geoguessr.com/", group: "map", guess: "Your location from Street View, by dropping a pin.", why: "The classic for reading signs, roads and languages. The free tier is limited." },
  { name: "Krillion", url: "https://krillion.io/", group: "more", guess: "Seven trivia prompts a day, scored by how rare your answer is.", why: "Another daily game from the same creator. Answers and hints are on our sister site, Krillion Today." },
];

const VERSUS = [
  {
    id: "vs-worldle",
    title: "Originle vs Worldle",
    points: [
      "Both end in one mystery country a day, and both tell you how far a wrong guess was.",
      "Worldle starts from the country's silhouette and gives six guesses with a direction arrow. Originle starts from a person and gives three, and only shows the outline as its last clue.",
      "Worldle is a map puzzle; Originle is a listening puzzle, where language, food and stories do the work.",
    ],
  },
  {
    id: "vs-geoguessr",
    title: "Originle vs GeoGuessr",
    points: [
      "Both reward reading small details: signs and roads in GeoGuessr, words and traditions in Originle.",
      "GeoGuessr drops you into Street View and scores how close your pin lands. Originle asks for a country, and only scores closeness when all three guesses miss.",
      "Originle is free with one guest a day; GeoGuessr's free tier is limited.",
    ],
  },
];

const GROUPS: { key: Game["group"]; title: string; text: string }[] = [
  { key: "country", title: "Guess the country", text: "The nearest thing to Originle: one mystery country a day." },
  { key: "map", title: "Read the map", text: "Distances, borders and landscapes, for the geography side of Originle." },
  { key: "more", title: "Something different", text: "A daily game that isn't about geography at all." },
];

export default function GamesLikeOriginlePage() {
  return (
    <PageShell
      path="/games-like-originle"
      crumbName="Games like Originle"
      title="Games like Originle"
      lead="Done with today's guest? These free daily games scratch the same itch: a mystery place, a few clues, and a score to beat tomorrow."
    >
      <div className="space-y-14">
        {GROUPS.map((group) => (
          <section key={group.key} aria-labelledby={`group-${group.key}`}>
            <h2 id={`group-${group.key}`} className="heading">
              {group.title}
            </h2>
            <p className="mt-2 muted">{group.text}</p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {GAMES.filter((game) => game.group === group.key).map((game) => (
                <li key={game.name} className="sheet flex flex-col p-5">
                  <h3 className="subheading">{game.name}</h3>
                  <p className="mt-2">{game.guess}</p>
                  <p className="mt-2 text-[0.97rem] muted">{game.why}</p>
                  <p className="mt-auto pt-4">
                    <a href={game.url} className="inline-link" target="_blank" rel="noopener">
                      Play {game.name}
                    </a>
                    {game.name === "Krillion" ? (
                      <>
                        {" "}
                        <span className="muted">or</span>{" "}
                        <a href="https://krilliontoday.com/" className="inline-link" target="_blank" rel="noopener">
                          today&apos;s Krillion answers
                        </a>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section aria-labelledby="versus">
          <h2 id="versus" className="heading">
            How Originle compares
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {VERSUS.map((match) => (
              <div key={match.id} className="sheet p-5">
                <h3 id={match.id} className="subheading">
                  {match.title}
                </h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 muted">
                  {match.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="pick" className="prose-block narrow">
          <h2 id="pick" className="heading">
            Which one to play next
          </h2>
          <p>
            If you like Originle for the people and their stories, nothing else is quite like it yet; Countryle and Tradle come closest
            because they also make you reason from facts about a place. If you like it for the geography, start with Worldle and Globle,
            then try Travle for borders.
          </p>
          <p>
            Saw a game where people guess someone&apos;s country from a video? That&apos;s{" "}
            <Link href="/guess-where-im-from-game" className="inline-link">
              Originle
            </Link>
            . New to it? Read{" "}
            <Link href="/how-to-play" className="inline-link">
              how to play
            </Link>{" "}
            or jump to{" "}
            <Link href="/hints" className="inline-link">
              today&apos;s hints
            </Link>
            .
          </p>
        </section>
      </div>
      <JsonLd data={itemListJsonLd("Games like Originle", GAMES.map((game) => ({ name: game.name, path: game.url })))} />
    </PageShell>
  );
}
