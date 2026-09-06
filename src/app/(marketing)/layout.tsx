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
 * **Both sit above the header, and that is a deliberate reversal.** The notice
 * band read better directly beneath the header — until the homepage, whose hero
 * pulls itself up under a transparent header (`hero.tsx`) so the page does not
 * open on a hard light-on-dark seam. A notice between the two breaks that in two
 * ways at once: the hero slides up over the notice and eats 4rem of it, and the
 * header's light ink ends up on the notice's light ground, unreadable.
 *
 * Every fix that kept the notice under the header required the header to know
 * whether a notice had rendered — and the header is a sibling of the slot, in a
 * layout that cannot inspect either. Coupling the message engine to one page's
 * hero treatment to buy 80px of position is a bad trade. Above the masthead is
 * also a pattern readers know from government and bank sites, and it has the
 * property that matters more: it is correct on every page, including the ones
 * added next year.
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
      {notices}
      <UtilityBar />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="pb-action-bar flex-1 outline-none">
        {children}
      </main>

      <SiteFooter />

      <div className="print-hidden">
        <MobileActionBar />
      </div>
    </div>
  );
}
