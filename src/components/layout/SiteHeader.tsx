import Link from "@/components/shared/Link";
import { PRIMARY_NAV, SITE } from "@/lib/seo/site";
import { BrandMark } from "./BrandMark";

export function SiteHeader() {
  return (
    <header className="border-b border-rule/80 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75 sticky top-0 z-30">
      <div className="shell flex min-h-16 flex-wrap items-center gap-x-6 gap-y-1 py-2">
        <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label={`${SITE.name} home`}>
          <BrandMark />
          <span className="font-display text-[1.3rem] font-bold tracking-tight">
            Originle<span className="text-teal"> Game</span>
          </span>
        </Link>
        <nav aria-label="Main" className="-mx-2 order-last w-full overflow-x-auto sm:order-none sm:ml-auto sm:w-auto">
          <ul className="flex gap-1 whitespace-nowrap pb-1 sm:pb-0">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-full px-3 py-1.5 text-[0.95rem] font-semibold no-underline hover:bg-teal-wash">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
