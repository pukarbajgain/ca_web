import { Container } from "@/components/layout/container";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Legal route group: the same chrome as marketing, but a **narrow prose
 * layout** (§D.2). These pages are read linearly and at length, so the measure
 * is capped at `--container-prose` (44rem ≈ 70ch) rather than the page width —
 * a 90rem line of legal text is genuinely hard to read, and this is the content
 * where a reader giving up matters most.
 *
 * No utility bar: a registration number above the fold is a homepage trust
 * device, not something a privacy notice needs.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="pb-action-bar flex-1 outline-none">
        <Container width="prose" className="py-12 md:py-16">
          {/* The typographic rules for legal prose are set once, here, using
              child selectors — the alternative is every legal page repeating
              the same six className strings and drifting. */}
          <article
            className={[
              "[&_h1]:font-[family-name:var(--font-display)] [&_h1]:text-display-small",
              "[&_h2]:mt-10 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-headline-small [&_h2]:text-on-surface",
              "[&_p]:mt-4 [&_p]:text-body-large [&_p]:text-on-surface-variant",
              "[&_ul]:mt-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2",
              "[&_li]:relative [&_li]:pl-5 [&_li]:text-body-large [&_li]:text-on-surface-variant",
              "[&_li]:before:absolute [&_li]:before:top-3 [&_li]:before:left-0 [&_li]:before:size-1 [&_li]:before:rounded-full [&_li]:before:bg-outline",
              "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
            ].join(" ")}
          >
            {children}
          </article>
        </Container>
      </main>

      <SiteFooter />

      <div className="print-hidden">
        <MobileActionBar />
      </div>
    </div>
  );
}
