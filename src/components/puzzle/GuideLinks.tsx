import Link from "@/components/shared/Link";

const GUIDES = [
  { href: "/today", title: "Today's answer", text: "The country for today's guest, with the facts and the close misses." },
  { href: "/hints", title: "Hints", text: "Three hints that narrow the map step by step, plus the clue titles." },
  { href: "/archive", title: "Archive", text: "Every past guest with their own page of hints and the answer." },
  { href: "/how-to-play", title: "How to play", text: "Rules, the exact scoring tables and the habits that save points." },
  { href: "/originle-score-calculator", title: "Score calculator", text: "Your score from the clues and misses, or from your share result." },
  { href: "/games-like-originle", title: "Similar games", text: "More daily geography puzzles for after you've finished." },
];

/** The ways into the guide, written as what each page does. */
export function GuideLinks({ exclude }: { exclude?: string }) {
  return (
    <ul className="grid overflow-hidden rounded-md border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-3">
      {GUIDES.filter((guide) => guide.href !== exclude).map((guide) => (
        <li key={guide.href} className="border-b border-r border-rule bg-card">
          <Link href={guide.href} className="group block h-full p-5 no-underline hover:bg-paper">
            <span className="font-display text-xl font-semibold group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
              {guide.title}
            </span>
            <span className="mt-1.5 block text-[0.97rem] muted">{guide.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
