import Link from "@/components/shared/Link";
import { FOOTER_NAV, SITE, officialUrl } from "@/lib/seo/site";
import { BrandMark } from "./BrandMark";

export function SiteFooter({ year }: { year: number }) {
  return (
    <footer className="mt-20 border-t border-rule bg-paper-deep">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold">{SITE.name}</span>
          </div>
          <p className="mt-4 text-[0.95rem] muted">
            Daily answers, hints and an archive for{" "}
            <a href={officialUrl("/", "footer")} className="inline-link" rel="noopener" data-ga-event="official_link_click">
              Originle
            </a>
            , the guess-the-country game. {SITE.disclaimer}
          </p>
          <p className="mt-3 text-[0.95rem]">
            <a href={`mailto:${SITE.contactEmail}`} className="inline-link">
              {SITE.contactEmail}
            </a>
          </p>
        </div>
        {FOOTER_NAV.map((group) => (
          <div key={group.heading}>
            <p className="font-display text-base font-semibold">{group.heading}</p>
            <ul className="mt-3 space-y-2 text-[0.95rem]">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="muted no-underline hover:text-ink hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-rule">
        <p className="shell py-5 text-sm muted">
          © {year} {SITE.name}. Originle and its guests&apos; stories belong to their creators; play the game at originle.io.
        </p>
      </div>
    </footer>
  );
}
