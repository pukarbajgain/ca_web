import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ClipboardCheck,
  FileText,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
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
 * ── Six equal cards, and the featured tile is gone ──────────────────────────
 * This used to give the defining service a cell two columns wide and two rows
 * tall, with `serviceGridSpans` computing the arrangement so that no row was
 * ever left with a lone card beside dead space. It worked, and it was still
 * wrong: one service's copy does not fill a 700px cell, so the tile needed a
 * photograph and a larger button to justify its height, and the section grew
 * to nearly a full screen for six short summaries. Emphasis that costs that
 * much height is not emphasis, it is imbalance.
 *
 * Six items in three columns is exactly two full rows — no stranding to solve,
 * no span arithmetic, and a section a reader takes in at a glance. The firm's
 * `featured` flag survives as a **quiet** accent: a tinted ground and a ring,
 * at the same size as its neighbours. Emphasis without a hole beside it.
 *
 * **The tinted icon tile is here at the firm's direction.** It had been removed
 * as the template signal §3.8b names — a clipboard glyph beside "Audit &
 * assurance" restates the word rather than adding to it. The firm's judgement
 * is that the page read as too editorial without it, and that is their call.
 * The mono index stays alongside, because it encodes something the icon does
 * not: the list is ordered by the sequence in which a Nepali business meets
 * these obligations.
 *
 * Grid: 1 → 2 at `sm` → 3 at `lg` (§D.3 rule 6). `auto-rows-fr` plus `h-full`
 * keeps a row's cards equal-height with no JS measure.
 */

/**
 * `ServiceItem.icon` is a lucide name held as a plain string, so `content.ts`
 * stays free of component imports and can be read anywhere. This is the one
 * place that resolves it. An unrecognised name falls back rather than throwing:
 * a card with the wrong glyph is a blemish, a card that crashes the page is an
 * outage.
 */
const SERVICE_ICONS: Record<string, LucideIcon> = {
  ClipboardCheck,
  Receipt,
  Calculator,
  FileText,
  BookOpen,
  TrendingUp,
};

export function ServiceGrid({ items = services }: { items?: readonly ServiceItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section labelledBy="services-heading" ground="muted">
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

      <ul className="mt-10 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5">
        {items.map((service, index) => (
          <li key={service.slug} className="rise">
            <ServiceCard service={service} index={index} />
          </li>
        ))}
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

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const Icon = SERVICE_ICONS[service.icon] ?? ClipboardCheck;
  /* Three, not four. A fourth line on one card and not its neighbours is what
   * puts a row's "Read more" links out of alignment; the detail page carries
   * the full list. */
  const includes = service.includes.slice(0, 3);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-xl border border-outline-variant bg-card p-6 transition-colors duration-300 hover:border-primary/45",
        /* The firm's emphasis, expressed at the same size as everything else:
         * a tint and a ring, not a bigger cell. */
        service.featured && "bg-primary/[0.04] ring-1 ring-primary/15",
      )}
    >
      {/* Icon tile and index on one line: the glyph gives the card a visual
          anchor, the numeral gives it a position in the sequence. Both are
          `aria-hidden` — the card's accessible name is the service name, and a
          screen reader gains nothing from "clipboard check, 01".

          The tint alternates blue/green down the list so six cards do not read
          as six of the same thing. Opacity 0.8 on the numeral, not the 0.4 it
          started at: `aria-hidden` does not exempt visible text from the 4.5:1
          floor, and the axe gate measured 2.0:1 and failed. */}
      <div className="flex items-center justify-between gap-4">
        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            index % 2 === 0
              ? "bg-primary/10 text-primary"
              : "bg-tertiary/10 text-tertiary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <p
          aria-hidden
          className="tabular font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant opacity-80"
        >
          {String(index + 1).padStart(2, "0")}
        </p>
      </div>

      <h3
        className={cn(
          "mt-5 font-[family-name:var(--font-display)] text-title-large text-on-surface",
          /* Two lines are reserved from `lg`, where the three-column measure is
           * narrow enough that one title wraps and another does not — which put
           * the summaries in a row 29px out of line with each other. From `xl`
           * the column is wide enough that every title fits on one line, so the
           * reservation is dropped rather than left as permanent dead space.
           * `lh` keeps the number tied to the type scale, not to a magic px. */
          "lg:min-h-[2lh] xl:min-h-0",
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

      <p className="mt-2 text-body-medium text-on-surface-variant">{service.summary}</p>

      <ul className="mt-5 flex flex-col gap-2 border-t border-outline-variant pt-4 text-body-small text-on-surface-variant">
        {includes.map((item) => (
          <li key={item} className="flex gap-2.5">
            {/* A filled tick, not a dot. These are things the firm actually
                delivers, and a tick says "included" where a bullet only says
                "item". White on the tertiary green measures 5.09:1. */}
            <span
              aria-hidden
              className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-tertiary text-white"
            >
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>

      {/* Pushes the affordance to the bottom edge regardless of how much the
          copy above wraps, so a row of cards aligns. */}
      <span className="mt-auto" />

      {/* An explicit affordance, not a glyph that only appears on hover. A
          hover-only arrow is invisible on a touch device — which is most of
          this site's traffic — and it made the card's one action something a
          reader had to discover. The whole card is still the target; this is
          what tells them so. */}
      <span className="mt-6 inline-flex w-fit items-center gap-2 text-label-large text-primary">
        {vocabulary.actions.readMore}
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
        />
      </span>
    </article>
  );
}
