import type { Crumb } from "@/lib/seo/jsonld";
import { Breadcrumbs } from "./Breadcrumbs";

interface Props {
  title: React.ReactNode;
  /** Trail after "Home"; the current page is appended automatically. */
  path: string;
  crumbName: string;
  parents?: Crumb[];
  lead?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Standard frame for reading pages: breadcrumb, one H1, optional lead, content. */
export function PageShell({ title, path, crumbName, parents = [], lead, aside, children }: Props) {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }, ...parents, { name: crumbName, path }];
  return (
    <div className="shell pb-8 pt-8 md:pt-12">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="display max-w-[20ch] text-(length:--text-title)">{title}</h1>
          {lead ? <div className="mt-5 max-w-[62ch] text-lg leading-relaxed muted md:text-xl">{lead}</div> : null}
        </div>
        {aside}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}
