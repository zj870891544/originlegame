import type { ComponentProps } from "react";

/**
 * The site's link: a plain anchor, so following one loads the destination as a
 * document. Documents come out of the edge cache (`src/lib/edge/page-cache.ts`);
 * the framework's own link asks the Worker to render the page again on every
 * click, and in the background for every link that scrolls into view.
 */
export default function Link(props: ComponentProps<"a"> & { href: string }) {
  return <a {...props} />;
}
