import type { Metadata } from "next";
import Link from "@/components/shared/Link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="shell pb-16 pt-12 md:pt-20">
      <h1 className="display max-w-[16ch] text-(length:--text-title)">No guest at this address</h1>
      <p className="mt-5 max-w-[58ch] text-xl leading-snug muted">
        This page doesn&apos;t exist, or it&apos;s a puzzle whose day hasn&apos;t come yet. Puzzles appear here once Originle releases them
        at midnight Eastern.
      </p>
      <ul className="mt-8 space-y-3 text-lg">
        <li>
          <Link className="inline-link" href="/today">
            Today&apos;s Originle answer
          </Link>
        </li>
        <li>
          <Link className="inline-link" href="/archive">
            Every past puzzle
          </Link>
        </li>
        <li>
          <Link className="inline-link" href="/how-to-play">
            How to play Originle
          </Link>
        </li>
      </ul>
    </div>
  );
}
