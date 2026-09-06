import { Container } from "@/components/layout/container";
import { vocabulary } from "@/lib/vocabulary";

/**
 * The `/services` page opening.
 *
 * **A single wide statement, and nothing else.** The first draft carried a jump
 * list of the six practice areas in a right-hand column; it was removed because
 * the index it linked to begins one screen below and is only six rows long, so
 * the nav was a second copy of the page's own contents dressed as navigation.
 * CLAUDE.md §3.8b: if a section is better with something removed, remove it —
 * and the whitespace it leaves is what makes the statement land.
 *
 * The deep ground and the ledger rule motif are the site's, not this page's:
 * `site.css` owns them, the landing hero and the closing CTA band both use them,
 * and the CTA band sits at the foot of this page. A plainer treatment here would
 * read as two different sites on one scroll, which is the opposite of restraint.
 */
export function ServicesHero() {
  return (
    <section
      aria-labelledby="services-hero-heading"
      /* Deliberately NOT pulled up under the header with `-mt-16 pt-16`, which
       * is what the landing hero does. `site-header.tsx` renders transparent
       * only on `/` (and the `/design` preview of it), so pulling this up would
       * put a deep ground behind a solid, blurred header bar and tint it, for a
       * layout that is pixel-identical either way. */
      className="relative isolate overflow-hidden bg-[var(--hero-ground)] text-[color:var(--hero-ink)]"
    >
      <div
        aria-hidden
        className="ledger-rules pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_85%_50%,var(--hero-ground-2),transparent_70%)]"
      />

      <Container className="py-16 md:py-24 lg:py-28">
        <p className="flex items-center gap-3 text-label-small text-[color:var(--hero-ink-subtle)] uppercase">
          <span aria-hidden className="h-px w-8 bg-current opacity-70" />
          {vocabulary.nav.services}
        </p>

        <h1
          id="services-hero-heading"
          className="mt-8 max-w-[14ch] font-[family-name:var(--font-display)] text-display-large"
        >
          Six practice areas, one{" "}
          <span className="text-[color:var(--hero-accent)] italic">file</span>.
        </h1>

        <p className="mt-8 max-w-[62ch] text-body-large text-[color:var(--hero-ink-muted)]">
          Most clients arrive with one obligation to meet and stay for the ones that
          follow from it. Each practice area below sets out what is actually done, who it
          suits and what you receive at the end.
        </p>
      </Container>
    </section>
  );
}
