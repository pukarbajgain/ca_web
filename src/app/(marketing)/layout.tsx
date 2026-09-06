import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { UtilityBar } from "@/components/layout/utility-bar";

/**
 * Marketing chrome: announcement · utility bar → header → notices · main →
 * footer, plus the fixed mobile action bar.
 *
 * **`announcement` and `notices` are parallel-route slots, not children.** They
 * carry the CMS's site messages, which are targeted by path — and a layout is
 * never told which path it is rendering. Routing them as slots is what lets them
 * know, without `headers()` dragging the whole marketing tree off the static
 * path. The reasoning is written out in full in
 * `@announcement/[[...path]]/page.tsx`; the two files that place them are here.
 *
 * Their positions differ, which is the point of having two: an announcement
 * outranks the utility bar and sits above it, while a notice is the first thing
 * *inside* the page and sits at the top of `<main>`, above `children`, so no
 * page added later can forget to render it.
 *
 * The notice band sat above the masthead for a while, and the reason is worth
 * keeping: the landing hero used to be a deep typographic ground that pulled
 * itself up under a transparent header, and a notice between the two both got
 * eaten by the hero and put the header's light ink on a light band. The hero is
 * photographic and bright now and the header is always solid, so the constraint
 * is gone and the band is back where it reads best.
 *
 * **`pb-action-bar` on `<main>` is load-bearing.** The action bar is `position:
 * fixed`, so without a matching bottom padding it permanently covers the last
 * ~56px of every page on a phone — which on this site is the disclaimer. The
 * padding and the bar's height both derive from `--action-bar-h` in `site.css`,
 * so they cannot drift apart, and the utility class zeroes itself from `md` up
 * where the bar is not rendered.
 *
 * No `export const revalidate` here. The reference storefront needs a
 * layout-level ISR floor because its chrome fetches over Axios, which Next's
 * cache cannot see; this chrome reads only local configuration, and the pages
 * and slots below declare their own revalidation with tags (§O.2).
 */
export default function MarketingLayout({
  children,
  announcement,
  notices,
}: {
  children: React.ReactNode;
  announcement: React.ReactNode;
  notices: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {announcement}
      <UtilityBar />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="pb-action-bar flex-1 outline-none">
        {notices}
        {children}
      </main>

      <SiteFooter />

      <div className="print-hidden">
        <MobileActionBar />
      </div>
    </div>
  );
}
