import { faqJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "./JsonLd";

export interface FaqItem {
  question: string;
  /** Plain text used for structured data; shown as-is unless `body` is given. */
  answer: string;
  /** Richer visible version (links, emphasis). Must say the same thing as `answer`. */
  body?: React.ReactNode;
}

/** Questions that open to their answers, with matching FAQPage data. */
export function Faq({ items, headingLevel = "h3" }: { items: FaqItem[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <>
      <div className="divide-y divide-rule border-y border-rule">
        {items.map((item) => (
          <details key={item.question} className="fold">
            <summary>
              <Heading className="subheading">{item.question}</Heading>
            </summary>
            <div className="max-w-[68ch] pb-5 muted">{item.body ?? item.answer}</div>
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(items.map(({ question, answer }) => ({ question, answer })))} />
    </>
  );
}
