import Link from "@/components/shared/Link";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo/jsonld";
import { JsonLd } from "./JsonLd";

/** Visible trail plus matching BreadcrumbList data. The last crumb is the current page. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[0.95rem] muted">
        <ol className="flex flex-wrap gap-x-2">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex gap-x-2">
                {last ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <>
                    <Link href={crumb.path} className="underline underline-offset-2 hover:text-ink">
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
