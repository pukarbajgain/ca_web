import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { services, type ServiceItem } from "@/config/content";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Services grid (§D.6 row 7): makes the offer legible in ten seconds.
 *
 * Each card carries a one-line summary *and* three concrete deliverables. The
 * deliverables are what make it credible — "Taxation" says nothing; "VAT and TDS
 * registration, returns and reconciliation" says the firm has done it. That is
 * the difference between a services page and a services page a prospect
 * believes.
 *
 * The card is drawn rather than filled: a hairline border, a mono index above the
 * name, and a ruled separator above the deliverables. No shadow — a page of
 * floating cards reads as a SaaS template, and ruled paper is this practice's own
 * material.
 *
 * **This is the one section on the page that keeps cards** (CLAUDE.md §3.8b).
 * Six discrete, separately-linked offerings are what a card is actually for; the
 * firm's commitments and the engagement steps, which used to be card grids
 * either side of this one, are now ruled entries and a numbered sequence, so the
 * page no longer repeats one composition three times.
 *
 * The tinted icon chip on every card went with them. An icon per heading is the
 * template signal §3.8b names, and a clipboard glyph beside "Audit & assurance"
 * restates the word without adding to it — whereas the mono index does encode
 * something true, because the list is ordered by the sequence in which a Nepali
 * business meets these obligations.
 *
 * Grid: 1 → 2 at `sm` → 3 at `lg` (§D.3 rule 6). `auto-rows-fr` plus `h-full`
 * keeps a row's cards equal-height with no JS measure. The spans that make the
 * last row come out even are computed by `serviceGridSpans` — see the reasoning
 * on that function.
 */

export type ServiceCellSpan = {
  /** Columns the cell occupies in the 3-column (`lg`) layout. */
  readonly lgCols: 1 | 2 | 3;
  /** Rows the cell occupies in the 3-column (`lg`) layout. */
  readonly lgRows: 1 | 2;
  /** Columns the cell occupies in the 2-column (`sm`) layout. */
  readonly smCols: 1 | 2;
};

/**
 * How every cell in the grid is sized, so that **no row is ever left with a lone
 * card and dead space beside it**.
 *
 * The version this replaced gave the featured service `col-span-2` in a
 * three-column grid. Six services then occupy seven cells, seven is not a
 * multiple of three, and the last row rendered one 403px card with 826px of
 * empty grid beside it (measured at 1440 and at 1920). A featured treatment that
 * strands a card is worse than no featured treatment at all.
 *
 * Three columns, one **2×2** featured tile and five standard cells is 4 + 5 = 9,
 * which fills a 3×3 grid exactly. That only holds when `count % 3 === 0`, so the
 * emphasis is applied *conditionally on the data* rather than assumed — the
 * service list is editable (it becomes a CMS collection in Phase 4) and a
 * seventh service must not silently reintroduce the hole.
 *
 * When the count cannot take the featured tile, the tail is widened instead: a
 * remainder of one makes the last card full-width, a remainder of two widens the
 * last card to two columns. Both fill the row. The same rule runs for the
 * two-column (`sm`) layout, where an odd count would otherwise strand the last
 * card.
 *
 * Exported and unit-tested because it is the whole fix: a component is awkward
 * to assert about, an array of spans is not.
 */
export function serviceGridSpans(
  count: number,
  featuredIndex: number,
): readonly ServiceCellSpan[] {
  if (count <= 0) return [];

  const spans: ServiceCellSpan[] = Array.from({ length: count }, () => ({
    lgCols: 1,
    lgRows: 1,
    smCols: 1,
  }));

  /* ── Three columns ────────────────────────────────────────────────────────
   * The 2×2 tile fills exactly when the cells sum to whole rows *and* grid
   * auto-placement can actually reach that arrangement. The second condition is
   * the one that is easy to miss: `grid-auto-flow: row` is sparse, so a
   * two-column item that does not fit the space left in the current row skips to
   * the next one and **leaves the remainder of that row empty** — the very hole
   * this function exists to prevent. Requiring the tile to start a row
   * (`featuredIndex % 3 === 0`) is what guarantees it always fits where it is
   * placed. */
  const canFeature =
    featuredIndex >= 0 &&
    featuredIndex < count &&
    featuredIndex % 3 === 0 &&
    count % 3 === 0 &&
    count >= 6;

  if (canFeature) {
    spans[featuredIndex] = { ...spans[featuredIndex]!, lgCols: 2, lgRows: 2 };
  } else {
    // No featured tile: widen the tail instead, so the last row is still whole.
    const remainder = count % 3;
    if (remainder === 1) {
      spans[count - 1] = { ...spans[count - 1]!, lgCols: 3 };
    } else if (remainder === 2) {
      spans[count - 1] = { ...spans[count - 1]!, lgCols: 2 };
    }
  }

  // ── Two columns ──────────────────────────────────────────────────────────
  if (count % 2 === 1) {
    spans[count - 1] = { ...spans[count - 1]!, smCols: 2 };
  }

  return spans;
}

/* Static class strings, because Tailwind reads the source and cannot resolve a
 * template literal. Keyed by the span so the lookup stays total. */
const LG_COLS = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;
const LG_ROWS = { 1: "", 2: "lg:row-span-2" } as const;
const SM_COLS = { 1: "", 2: "sm:col-span-2" } as const;

export function ServiceGrid({ items = services }: { items?: readonly ServiceItem[] }) {
  if (items.length === 0) return null;

  const featuredIndex = items.findIndex((item) => item.featured);
  const spans = serviceGridSpans(items.length, featuredIndex);
  /* A service is only *rendered* as featured when it actually got the big cell.
   * Otherwise the flag would produce display type in a standard-sized card. */
  const featuredCell = featuredIndex >= 0 && spans[featuredIndex]?.lgRows === 2;

  return (
    <Section labelledBy="services-heading" ground="muted" index="02">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          id="services-heading"
          eyebrow={vocabulary.sections.services}
          title="What we do"
          lede="Six practice areas. Most clients start with one and add others as the business grows."
        />
        <Link
          href={routes.services()}
          className="group hidden min-h-11 items-center gap-2 text-label-large text-primary lg:inline-flex"
        >
          {vocabulary.actions.viewAllServices}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
          />
        </Link>
      </div>

      <ul className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {items.map((service, index) => {
          const span = spans[index]!;
          return (
            <li
              key={service.slug}
              className={cn(
                "rise",
                SM_COLS[span.smCols],
                LG_COLS[span.lgCols],
                LG_ROWS[span.lgRows],
              )}
            >
              <ServiceCard
                service={service}
                index={index}
                big={featuredCell && index === featuredIndex}
              />
            </li>
          );
        })}
      </ul>

      <Link
        href={routes.services()}
        className="group mt-8 inline-flex min-h-11 items-center gap-2 text-label-large text-primary lg:hidden"
      >
        {vocabulary.actions.viewAllServices}
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
        />
      </Link>
    </Section>
  );
}

/**
 * One card. `big` is true only for the 2×2 featured cell, and only from `lg` —
 * below that every card is the same width and the emphasis simply does not
 * apply, so every `big` class carries an `lg:` prefix.
 *
 * ── Why the featured tile's deliverables become a ruled index ────────────────
 * A cell two rows tall is roughly 700px at 1920, and one service's copy is
 * nowhere near 700px. The first version of this stacked the same short blocks at
 * the top and pinned the deliverables to the bottom, which traded the grid's
 * orphaned card for a 300px hole inside the card — no better.
 *
 * So the deliverables stop being a bullet list and become the thing that fills
 * the tile: four rows, each on a hairline, each stretching to share the height
 * that is actually available. Evenly-spaced rules are what turn empty space into
 * structure rather than into a gap, and a ruled index is the same motif the hero
 * and the section numbering already use. The tile gets taller or shorter with
 * the viewport and the rows absorb the difference.
 */
function ServiceCard({
  service,
  index,
  big,
}: {
  service: ServiceItem;
  index: number;
  big: boolean;
}) {
  /* The featured tile has the height for every deliverable; a standard card
   * shows three, because a fourth would push the card past its neighbours. */
  const includes = service.includes.slice(0, big ? 4 : 3);

  return (
    <article
      className={cn(
        "group @container relative flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-card p-6 transition-colors duration-300 hover:border-primary/45",
        big && "lg:p-8",
      )}
    >
      {/* Ledger index, in the flow rather than floating in a corner: with the
          icon chip gone it is the card's first line, and it matches the
          numbering the hero's practice index and the engagement steps use.
          `aria-hidden` because the card's accessible name is the service name;
          the numeral is a position. Opacity 0.8, not the 0.4 it started at —
          `aria-hidden` does not exempt visible text from the 4.5:1 floor, and
          the axe gate measured 2.0:1 and failed. */}
      <p
        aria-hidden
        className="tabular font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant opacity-80"
      >
        {String(index + 1).padStart(2, "0")}
      </p>

      <h3
        className={cn(
          "mt-4 font-[family-name:var(--font-display)] text-title-large text-on-surface",
          /* Two lines are reserved from `lg`, where the three-column measure is
           * narrow enough that one title wraps and another does not — which put
           * the summaries in a row 29px out of line with each other. From `xl`
           * the column is wide enough that every title fits on one line, so the
           * reservation is dropped rather than left as permanent dead space.
           * `lh` keeps the number tied to the type scale, not to a magic px. */
          !big && "lg:min-h-[2lh] xl:min-h-0",
          big && "lg:mt-5 lg:text-display-small",
        )}
      >
        {/* Whole-card target: the pseudo-element covers the card, while the
            accessible name stays the service name, not "card". */}
        <Link
          href={routes.service(service.slug)}
          className="after:absolute after:inset-0 focus-visible:outline-none"
        >
          {service.name}
        </Link>
      </h3>

      <p
        className={cn(
          "mt-2 text-body-medium text-on-surface-variant",
          big && "lg:mt-4 lg:max-w-[52ch] lg:text-body-large",
        )}
      >
        {service.summary}
      </p>

      {big ? (
        <p className="mt-8 hidden text-label-small text-on-surface-variant uppercase lg:block">
          {vocabulary.labels.whatIsIncluded}
        </p>
      ) : null}

      <ul
        className={cn(
          "mt-5 flex flex-col gap-2 border-t border-outline-variant pt-4 text-body-small text-on-surface-variant",
          /* `flex-1` + `gap-0` + a per-row rule: the rows share whatever height
             the tile has left, so the panel always reaches the bottom edge. */
          big && "lg:mt-3 lg:flex-1 lg:gap-0 lg:border-t-0 lg:pt-0 lg:text-body-medium",
        )}
      >
        {includes.map((item) => (
          <li
            key={item}
            className={cn(
              "flex gap-2.5",
              big &&
                "lg:min-h-14 lg:flex-1 lg:items-center lg:gap-4 lg:border-t lg:border-outline-variant",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-[0.55rem] size-1 shrink-0 rounded-full bg-tertiary",
                big && "lg:mt-0",
              )}
            />
            {item}
          </li>
        ))}
      </ul>

      {/* Pushes the affordance to the bottom edge regardless of how much the copy
          above wraps, so a row of cards aligns. The featured tile does not need
          it — its deliverables panel already grows into the space. */}
      {big ? null : <span className="mt-auto" />}

      {/* One hover affordance, not three. The border tint and this arrow both
          say "this is a link"; the rule that used to wipe along the bottom edge
          said it a third time, which is decoration (§3.8b). */}
      <ArrowUpRight
        aria-hidden
        className="pointer-events-none absolute right-5 bottom-5 size-4 text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </article>
  );
}
